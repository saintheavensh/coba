import { db } from "../../db";
import { commissionPayments, services, users } from "../../db/schema";
import { eq, and, desc, sql, gte, lte, isNull } from "drizzle-orm";
import { AuditService } from "./audit.service";
import { JournalService } from "./journal.service";

export interface CreateCommissionPaymentInput {
    technicianId: string;
    period: string;
    serviceIds: number[];
    amount: number;
    accountId?: string;
}

export class CommissionPaymentService {
    /**
     * Get pending commissions by technician for a period
     */
    static async getPendingCommissions(period: string) {
        const startDate = new Date(`${period}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        // Get all completed services in this period
        const completedServices = await db
            .select({
                id: services.id,
                no: services.no,
                technicianId: services.technicianId,
                technicianName: users.name,
                actualCost: services.actualCost,
                dateOut: services.dateOut,
            })
            .from(services)
            .leftJoin(users, eq(services.technicianId, users.id))
            .where(and(
                gte(services.dateOut, startDate),
                lte(services.dateOut, endDate),
                eq(services.status, "diambil")
            ));

        // Get already paid service IDs for this period
        const paidCommissions = await db
            .select()
            .from(commissionPayments)
            .where(eq(commissionPayments.period, period));

        const paidServiceIds = new Set<number>();
        for (const pc of paidCommissions) {
            for (const sid of (pc.serviceIds || [])) {
                paidServiceIds.add(sid);
            }
        }

        // Filter out already paid services and group by technician
        const pendingByTechnician: Record<string, {
            technicianId: string;
            technicianName: string;
            services: typeof completedServices;
            totalAmount: number;
        }> = {};

        for (const svc of completedServices) {
            if (!svc.technicianId || paidServiceIds.has(svc.id)) continue;

            if (!pendingByTechnician[svc.technicianId]) {
                pendingByTechnician[svc.technicianId] = {
                    technicianId: svc.technicianId,
                    technicianName: svc.technicianName || "Unknown",
                    services: [],
                    totalAmount: 0,
                };
            }

            pendingByTechnician[svc.technicianId].services.push(svc);
            // Assuming 10% commission - this should come from user's commissionConfig
            pendingByTechnician[svc.technicianId].totalAmount += Math.floor((svc.actualCost || 0) * 0.1);
        }

        return Object.values(pendingByTechnician);
    }

    /**
     * Create a commission payment
     */
    static async payCommission(input: CreateCommissionPaymentInput, userId: string): Promise<number> {
        const accountId = input.accountId || "1-1001"; // Default: Kas Toko

        // Create journal entry
        const journalId = await JournalService.create({
            description: `Komisi teknisi ${input.period}`,
            referenceType: "commission",
            referenceId: input.technicianId,
            lines: [
                { accountId: "5-2005", debit: input.amount, credit: 0, description: "Beban komisi" },
                { accountId, debit: 0, credit: input.amount, description: "Pembayaran kas" },
            ],
        }, userId);

        // Insert payment record
        const [payment] = await db.insert(commissionPayments).values({
            technicianId: input.technicianId,
            period: input.period,
            serviceIds: input.serviceIds,
            amount: input.amount,
            status: "paid",
            paidBy: userId,
            paidAt: new Date(),
            journalId,
            accountId,
        }).returning();

        await AuditService.log({
            userId,
            action: "PAY",
            entityType: "commission_payment",
            entityId: String(payment.id),
            tableName: "commission_payments",
            newValues: {
                technicianId: input.technicianId,
                period: input.period,
                amount: input.amount,
                serviceCount: input.serviceIds.length,
            },
        });

        return payment.id;
    }

    /**
     * Get commission payment history
     */
    static async getPaymentHistory(technicianId?: string, period?: string) {
        const conditions = [];
        if (technicianId) conditions.push(eq(commissionPayments.technicianId, technicianId));
        if (period) conditions.push(eq(commissionPayments.period, period));

        const query = db
            .select({
                id: commissionPayments.id,
                technicianId: commissionPayments.technicianId,
                technicianName: users.name,
                period: commissionPayments.period,
                amount: commissionPayments.amount,
                status: commissionPayments.status,
                serviceCount: sql<number>`json_array_length(${commissionPayments.serviceIds})`,
                paidAt: commissionPayments.paidAt,
            })
            .from(commissionPayments)
            .leftJoin(users, eq(commissionPayments.technicianId, users.id))
            .orderBy(desc(commissionPayments.paidAt));

        if (conditions.length > 0) {
            return query.where(and(...conditions));
        }

        return query;
    }

    /**
     * Get summary for a period
     */
    static async getPeriodSummary(period: string) {
        const pending = await this.getPendingCommissions(period);
        const paid = await this.getPaymentHistory(undefined, period);

        return {
            period,
            pendingCount: pending.length,
            pendingTotal: pending.reduce((s, p) => s + p.totalAmount, 0),
            paidCount: paid.length,
            paidTotal: paid.reduce((s, p) => s + p.amount, 0),
        };
    }
}
