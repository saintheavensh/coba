import { db } from "../../db";
import { periodLocks, sales, purchases, services, operationalCosts } from "../../db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { AuditService } from "./audit.service";

export class PeriodCloseService {
    /**
     * Check if a period is closed
     */
    static async isPeriodClosed(period: string): Promise<boolean> {
        const [lock] = await db
            .select()
            .from(periodLocks)
            .where(eq(periodLocks.period, period));

        return lock?.status === "closed";
    }

    /**
     * Validate that a date is not in a closed period
     */
    static async validateNotClosed(date: Date): Promise<void> {
        const period = date.toISOString().slice(0, 7); // "2026-01"
        const isClosed = await this.isPeriodClosed(period);

        if (isClosed) {
            throw new Error(`Period ${period} is closed. Cannot modify transactions in a closed period.`);
        }
    }

    /**
     * Get all periods with their status
     */
    static async getAllPeriods() {
        return db
            .select()
            .from(periodLocks)
            .orderBy(periodLocks.period);
    }

    /**
     * Close a period
     */
    static async closePeriod(period: string, userId: string): Promise<void> {
        // Check if already closed
        const existing = await db
            .select()
            .from(periodLocks)
            .where(eq(periodLocks.period, period));

        if (existing.length > 0 && existing[0].status === "closed") {
            throw new Error(`Period ${period} is already closed`);
        }

        // Calculate period totals
        const startDate = new Date(`${period}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        // Sales total
        const salesResult = await db
            .select({ total: sql<number>`COALESCE(SUM(${sales.finalAmount}), 0)` })
            .from(sales)
            .where(and(
                gte(sales.createdAt, startDate),
                lte(sales.createdAt, endDate),
                eq(sales.paymentStatus, "paid")
            ));

        // Purchases total
        const purchasesResult = await db
            .select({ total: sql<number>`COALESCE(SUM(${purchases.totalAmount}), 0)` })
            .from(purchases)
            .where(and(
                gte(purchases.date, startDate),
                lte(purchases.date, endDate)
            ));

        // Services total
        const servicesResult = await db
            .select({ total: sql<number>`COALESCE(SUM(${services.actualCost}), 0)` })
            .from(services)
            .where(and(
                gte(services.dateOut, startDate),
                lte(services.dateOut, endDate),
                eq(services.status, "diambil")
            ));

        // Expenses total
        const expensesResult = await db
            .select({ total: sql<number>`COALESCE(SUM(${operationalCosts.amount}), 0)` })
            .from(operationalCosts)
            .where(and(
                gte(operationalCosts.date, startDate),
                lte(operationalCosts.date, endDate)
            ));

        const totals = {
            salesTotal: salesResult[0]?.total || 0,
            purchasesTotal: purchasesResult[0]?.total || 0,
            servicesTotal: servicesResult[0]?.total || 0,
            expensesTotal: expensesResult[0]?.total || 0,
        };

        if (existing.length > 0) {
            await db
                .update(periodLocks)
                .set({
                    status: "closed",
                    closedBy: userId,
                    closedAt: new Date(),
                    ...totals,
                })
                .where(eq(periodLocks.period, period));
        } else {
            await db.insert(periodLocks).values({
                period,
                status: "closed",
                closedBy: userId,
                closedAt: new Date(),
                ...totals,
            });
        }

        await AuditService.log({
            userId,
            action: "CLOSE",
            entityType: "period",
            entityId: period,
            tableName: "period_locks",
            newValues: { status: "closed", ...totals },
        });
    }

    /**
     * Reopen a period (admin only)
     */
    static async reopenPeriod(period: string, reason: string, userId: string): Promise<void> {
        const [existing] = await db
            .select()
            .from(periodLocks)
            .where(eq(periodLocks.period, period));

        if (!existing || existing.status !== "closed") {
            throw new Error(`Period ${period} is not closed`);
        }

        await db
            .update(periodLocks)
            .set({
                status: "open",
            })
            .where(eq(periodLocks.period, period));

        await AuditService.log({
            userId,
            action: "UPDATE",
            entityType: "period",
            entityId: period,
            tableName: "period_locks",
            oldValues: { status: "closed" },
            newValues: { status: "open" },
            reason,
        });
    }

    /**
     * Get period summary
     */
    static async getPeriodSummary(period: string) {
        const [lock] = await db
            .select()
            .from(periodLocks)
            .where(eq(periodLocks.period, period));

        if (!lock) {
            return { period, status: "open", hasData: false };
        }

        const netIncome =
            (lock.salesTotal || 0) +
            (lock.servicesTotal || 0) -
            (lock.purchasesTotal || 0) -
            (lock.expensesTotal || 0);

        return {
            period,
            status: lock.status,
            closedAt: lock.closedAt,
            closedBy: lock.closedBy,
            salesTotal: lock.salesTotal,
            servicesTotal: lock.servicesTotal,
            purchasesTotal: lock.purchasesTotal,
            expensesTotal: lock.expensesTotal,
            netIncome,
            hasData: true,
        };
    }
}
