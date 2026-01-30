import { db } from "../../db";
import { revenueTargets, operationalCosts, sales, services } from "../../db/schema";
import { eq, and, gte, lte, sql, sum } from "drizzle-orm";
import { AssetsService } from "./assets.service";
import { AuditService } from "./audit.service";

export interface SetTargetInput {
    month: string; // "2026-01"
    workingDays: number;
    profitMarginPercent?: number;
}

export class RevenueTargetService {
    /**
     * Get or create target for a month
     */
    static async getOrCreate(month: string, userId?: string) {
        let [target] = await db
            .select()
            .from(revenueTargets)
            .where(eq(revenueTargets.month, month));

        if (!target) {
            // Auto-create with default values
            await this.calculateAndSet({ month, workingDays: 26 }, userId);
            [target] = await db
                .select()
                .from(revenueTargets)
                .where(eq(revenueTargets.month, month));
        }

        return target;
    }

    /**
     * Calculate monthly costs and set target
     */
    static async calculateAndSet(input: SetTargetInput, userId?: string): Promise<void> {
        const { month, workingDays, profitMarginPercent = 20 } = input;

        // Get operational costs for this month
        const startDate = new Date(`${month}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        const opCosts = await db
            .select({ total: sql<number>`COALESCE(SUM(${operationalCosts.amount}), 0)` })
            .from(operationalCosts)
            .where(and(
                gte(operationalCosts.date, startDate),
                lte(operationalCosts.date, endDate)
            ));

        const monthlyOperational = opCosts[0]?.total || 0;

        // Get total depreciation from active assets
        const monthlyDepreciation = await AssetsService.getTotalMonthlyDepreciation();

        // Calculate totals
        const monthlyTotal = monthlyOperational + monthlyDepreciation;
        const dailyBreakeven = Math.ceil(monthlyTotal / workingDays);
        const dailyTarget = Math.ceil(dailyBreakeven * (1 + profitMarginPercent / 100));

        // Upsert target
        const existing = await db
            .select()
            .from(revenueTargets)
            .where(eq(revenueTargets.month, month));

        if (existing.length > 0) {
            await db
                .update(revenueTargets)
                .set({
                    workingDays,
                    monthlyOperational,
                    monthlyDepreciation,
                    monthlyTotal,
                    dailyBreakeven,
                    profitMarginPercent,
                    dailyTarget,
                    updatedAt: new Date(),
                })
                .where(eq(revenueTargets.month, month));
        } else {
            await db.insert(revenueTargets).values({
                month,
                workingDays,
                monthlyOperational,
                monthlyDepreciation,
                monthlyTotal,
                dailyBreakeven,
                profitMarginPercent,
                dailyTarget,
                createdBy: userId,
            });
        }

        await AuditService.log({
            userId,
            action: existing.length > 0 ? "UPDATE" : "CREATE",
            entityType: "revenue_target",
            entityId: month,
            tableName: "revenue_targets",
            newValues: { monthlyTotal, dailyTarget, workingDays },
        });
    }

    /**
     * Get today's progress vs target
     */
    static async getTodayProgress() {
        const today = new Date();
        const month = today.toISOString().slice(0, 7); // "2026-01"

        const target = await this.getOrCreate(month);
        if (!target) {
            return { hasTarget: false };
        }

        // Get today's revenue from sales and services
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        // Sales revenue
        const salesResult = await db
            .select({ total: sql<number>`COALESCE(SUM(${sales.finalAmount}), 0)` })
            .from(sales)
            .where(and(
                gte(sales.createdAt, todayStart),
                lte(sales.createdAt, todayEnd),
                eq(sales.paymentStatus, "paid")
            ));

        // Service revenue (only "diambil" status)
        const serviceResult = await db
            .select({ total: sql<number>`COALESCE(SUM(${services.actualCost}), 0)` })
            .from(services)
            .where(and(
                gte(services.dateOut, todayStart),
                lte(services.dateOut, todayEnd),
                eq(services.status, "diambil")
            ));

        const todayRevenue = (salesResult[0]?.total || 0) + (serviceResult[0]?.total || 0);
        const progressPercent = target.dailyTarget > 0
            ? Math.round((todayRevenue / target.dailyTarget) * 100)
            : 0;

        return {
            hasTarget: true,
            month,
            date: today.toISOString().slice(0, 10),
            dailyTarget: target.dailyTarget,
            dailyBreakeven: target.dailyBreakeven,
            todayRevenue,
            progressPercent,
            remaining: Math.max(0, target.dailyTarget - todayRevenue),
            isAboveBreakeven: todayRevenue >= target.dailyBreakeven,
            isAboveTarget: todayRevenue >= target.dailyTarget,
        };
    }

    /**
     * Get monthly progress
     */
    static async getMonthProgress(month: string) {
        const target = await this.getOrCreate(month);
        if (!target) {
            return { hasTarget: false };
        }

        const startDate = new Date(`${month}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        // Sales revenue for month
        const salesResult = await db
            .select({ total: sql<number>`COALESCE(SUM(${sales.finalAmount}), 0)` })
            .from(sales)
            .where(and(
                gte(sales.createdAt, startDate),
                lte(sales.createdAt, endDate),
                eq(sales.paymentStatus, "paid")
            ));

        // Service revenue for month
        const serviceResult = await db
            .select({ total: sql<number>`COALESCE(SUM(${services.actualCost}), 0)` })
            .from(services)
            .where(and(
                gte(services.dateOut, startDate),
                lte(services.dateOut, endDate),
                eq(services.status, "diambil")
            ));

        const monthRevenue = (salesResult[0]?.total || 0) + (serviceResult[0]?.total || 0);
        const monthTarget = target.dailyTarget * target.workingDays;

        // Calculate working days elapsed
        const today = new Date();
        const isCurrentMonth = month === today.toISOString().slice(0, 7);
        const dayOfMonth = isCurrentMonth ? today.getDate() : new Date(endDate.getTime() - 1).getDate();

        // Simple estimate: assume evenly distributed working days
        const workingDaysElapsed = Math.ceil((dayOfMonth / 30) * target.workingDays);
        const expectedRevenue = target.dailyTarget * workingDaysElapsed;

        return {
            hasTarget: true,
            month,
            monthlyTarget: monthTarget,
            monthlyBreakeven: target.monthlyTotal,
            monthRevenue,
            progressPercent: monthTarget > 0 ? Math.round((monthRevenue / monthTarget) * 100) : 0,
            expectedRevenue,
            vsExpected: monthRevenue - expectedRevenue,
            isOnTrack: monthRevenue >= expectedRevenue,
        };
    }

    /**
     * Update target manually
     */
    static async update(month: string, input: Partial<SetTargetInput>, userId?: string): Promise<void> {
        const existing = await this.getOrCreate(month, userId);

        await this.calculateAndSet({
            month,
            workingDays: input.workingDays || existing.workingDays,
            profitMarginPercent: input.profitMarginPercent || existing.profitMarginPercent,
        }, userId);
    }
}
