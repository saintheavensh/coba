import { db } from "../../db";
import { purchasePayments, purchases, suppliers } from "../../db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { AuditService } from "./audit.service";
import { JournalService } from "./journal.service";

export interface CreatePaymentInput {
    purchaseId: string;
    amount: number;
    method: string;
    accountId?: string;
    reference?: string;
}

export class SupplierPaymentService {
    /**
     * Create a payment to a supplier
     */
    static async create(input: CreatePaymentInput, userId?: string): Promise<number> {
        // Get purchase details
        const [purchase] = await db
            .select()
            .from(purchases)
            .where(eq(purchases.id, input.purchaseId));

        if (!purchase) {
            throw new Error(`Purchase ${input.purchaseId} not found`);
        }

        const accountId = input.accountId || (input.method === "transfer" ? "1-1002" : "1-1001");

        // Create journal entry
        const journalId = await JournalService.create({
            description: `Pembayaran ${input.purchaseId} ke supplier`,
            referenceType: "supplier_payment",
            referenceId: input.purchaseId,
            lines: [
                { accountId: "2-1000", debit: input.amount, credit: 0, description: "Pelunasan hutang" },
                { accountId, debit: 0, credit: input.amount, description: "Pembayaran kas/bank" },
            ],
        }, userId);

        // Insert payment record
        const [payment] = await db.insert(purchasePayments).values({
            purchaseId: input.purchaseId,
            supplierId: purchase.supplierId,
            amount: input.amount,
            method: input.method,
            accountId,
            reference: input.reference,
            journalId,
            createdBy: userId,
        }).returning();

        // Audit log
        await AuditService.log({
            userId,
            action: "PAY",
            entityType: "purchase_payment",
            entityId: String(payment.id),
            tableName: "purchase_payments",
            newValues: { purchaseId: input.purchaseId, amount: input.amount, method: input.method },
        });

        return payment.id;
    }

    /**
     * Get total paid for a purchase
     */
    static async getTotalPaid(purchaseId: string): Promise<number> {
        const result = await db
            .select({ total: sql<number>`COALESCE(SUM(${purchasePayments.amount}), 0)` })
            .from(purchasePayments)
            .where(eq(purchasePayments.purchaseId, purchaseId));

        return result[0]?.total || 0;
    }

    /**
     * Get outstanding payables (all purchases with unpaid balance)
     */
    static async getOutstandingPayables() {
        // Get all purchases
        const allPurchases = await db
            .select({
                id: purchases.id,
                supplierId: purchases.supplierId,
                supplierName: suppliers.name,
                totalAmount: purchases.totalAmount,
                date: purchases.date,
            })
            .from(purchases)
            .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
            .orderBy(desc(purchases.date));

        // Get payments for each purchase and calculate outstanding
        const result = [];
        for (const purchase of allPurchases) {
            const totalPaid = await this.getTotalPaid(purchase.id);
            const outstanding = purchase.totalAmount - totalPaid;

            if (outstanding > 0) {
                result.push({
                    ...purchase,
                    totalPaid,
                    outstanding,
                    paymentStatus: totalPaid === 0 ? "unpaid" : "partial",
                });
            }
        }

        return result;
    }

    /**
     * Get supplier payables summary
     */
    static async getPayablesSummary() {
        const payables = await this.getOutstandingPayables();

        // Group by supplier
        const bySupplier: Record<string, { name: string; total: number; count: number }> = {};

        for (const p of payables) {
            const key = p.supplierId;
            if (!bySupplier[key]) {
                bySupplier[key] = { name: p.supplierName || "Unknown", total: 0, count: 0 };
            }
            bySupplier[key].total += p.outstanding;
            bySupplier[key].count++;
        }

        return {
            totalOutstanding: payables.reduce((s, p) => s + p.outstanding, 0),
            purchaseCount: payables.length,
            bySupplier: Object.values(bySupplier),
        };
    }

    /**
     * Get payment history for a purchase
     */
    static async getPaymentHistory(purchaseId: string) {
        return db
            .select()
            .from(purchasePayments)
            .where(eq(purchasePayments.purchaseId, purchaseId))
            .orderBy(desc(purchasePayments.date));
    }

    /**
     * Check if a purchase is fully paid
     */
    static async isFullyPaid(purchaseId: string): Promise<boolean> {
        const [purchase] = await db
            .select()
            .from(purchases)
            .where(eq(purchases.id, purchaseId));

        if (!purchase) return false;

        const totalPaid = await this.getTotalPaid(purchaseId);
        return totalPaid >= purchase.totalAmount;
    }
}
