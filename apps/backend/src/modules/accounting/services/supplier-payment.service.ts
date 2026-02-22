import { AuditService } from "./audit.service";
import { JournalService } from "./journal.service";
import { SupplierPaymentModel } from "../models/supplier-payment.model";

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
    static async create(input: CreatePaymentInput, userId?: string): Promise<string> {
        // Get purchase details
        const purchase = await SupplierPaymentModel.findPurchaseById(input.purchaseId);

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
        const [payment] = await SupplierPaymentModel.create({
            purchaseId: input.purchaseId,
            supplierId: purchase.supplierId,
            amount: input.amount,
            method: input.method,
            accountId,
            reference: input.reference,
            journalId,
            createdBy: userId,
        });

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
        return SupplierPaymentModel.getTotalPaid(purchaseId);
    }

    /**
     * Get outstanding payables (all purchases with unpaid balance)
     */
    static async getOutstandingPayables() {
        // Get all purchases
        const allPurchases = await SupplierPaymentModel.findAllPurchasesWithSuppliers();

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
            const key = p.supplierId as string;
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
        return SupplierPaymentModel.findHistoryByPurchaseId(purchaseId);
    }

    /**
     * Check if a purchase is fully paid
     */
    static async isFullyPaid(purchaseId: string): Promise<boolean> {
        const purchase = await SupplierPaymentModel.findPurchaseById(purchaseId);

        if (!purchase) return false;

        const totalPaid = await this.getTotalPaid(purchaseId);
        return totalPaid >= purchase.totalAmount;
    }
}
