import { db } from "../../../db";
import { purchases, purchasePayments, operationalCosts, commissionPayments, suppliers, users } from "../../../db/schema";
import { eq, and, sql, sum, gte, lte, desc, isNull, not } from "drizzle-orm";
import { SupplierPaymentService } from "./supplier-payment.service";
import { CommissionPaymentService } from "./commission-payment.service";
import { accountingService } from "../accounting-container";

export class LiabilitiesService {
    /**
     * Get overall summary of all liabilities
     */
    static async getSummary() {
        const supplierSummary = await this.getSupplierSummary();
        const expenseSummary = await this.getExpenseSummary();
        const commissionSummary = await this.getCommissionSummary();

        return {
            totalLiabilities: supplierSummary.total + expenseSummary.total + commissionSummary.total,
            breakdown: {
                suppliers: supplierSummary,
                expenses: expenseSummary,
                commissions: commissionSummary
            }
        };
    }

    /**
     * Get outstanding debts to suppliers (Accounts Payable)
     */
    static async getSupplierDebts() {
        // Find purchases that are NOT fully paid
        // Total Amount vs Sum of Payments

        const results = await db
            .select({
                purchaseId: purchases.id,
                supplierId: purchases.supplierId,
                supplierName: suppliers.name,
                totalAmount: purchases.totalAmount,
                date: purchases.date,
                dueDate: purchases.paymentDueDate,
                paidAmount: sql<number>`COALESCE((SELECT SUM(amount) FROM ${purchasePayments} WHERE ${purchasePayments.purchaseId} = ${purchases.id}), 0)`
            })
            .from(purchases)
            .innerJoin(suppliers, eq(purchases.supplierId, suppliers.id))
            .where(and(
                not(eq(purchases.status, "CANCELLED")),
                sql`purchases.total_amount > (SELECT COALESCE(SUM(amount), 0) FROM ${purchasePayments} WHERE ${purchasePayments.purchaseId} = ${purchases.id})`
            ))
            .orderBy(purchases.date);

        return results.map(r => ({
            ...r,
            outstanding: r.totalAmount - r.paidAmount
        }));
    }

    private static async getSupplierSummary() {
        const debts = await this.getSupplierDebts();
        return {
            total: debts.reduce((s, d) => s + d.outstanding, 0),
            count: debts.length
        };
    }

    /**
     * Get pending operational expenses
     */
    static async getExpenseDebts() {
        return await db
            .select()
            .from(operationalCosts)
            .where(eq(operationalCosts.status, "pending"))
            .orderBy(operationalCosts.dueDate);
    }

    private static async getExpenseSummary() {
        const expenses = await this.getExpenseDebts();
        return {
            total: expenses.reduce((s, e) => s + e.amount, 0),
            count: expenses.length
        };
    }

    /**
     * Get pending technician commissions
     */
    static async getCommissionDebts(period?: string) {
        // Use CommissionPaymentService to get pending commissions
        const currentPeriod = period || new Date().toISOString().substring(0, 7);
        const pending = await CommissionPaymentService.getPendingCommissions(currentPeriod);

        return pending.map(p => ({
            technicianId: p.technicianId,
            technicianName: p.technicianName,
            amount: p.totalAmount,
            period: currentPeriod,
            serviceCount: p.services.length
        }));
    }

    private static async getCommissionSummary() {
        const currentPeriod = new Date().toISOString().substring(0, 7);
        const pending = await this.getCommissionDebts(currentPeriod);
        return {
            total: pending.reduce((s, c) => s + c.amount, 0),
            count: pending.length
        };
    }

    /**
     * Pay an operational expense
     */
    static async payExpense(id: string, payload: { sourceAccountId: string; expenseAccountId: string; date?: Date; notes?: string }, userId?: string) {
        const [expense] = await db
            .select()
            .from(operationalCosts)
            .where(eq(operationalCosts.id, id))
            .limit(1);

        if (!expense) throw new Error("Expense not found");
        if (expense.status === "paid") throw new Error("Expense already paid");

        // 1. Create Journal Entry
        await accountingService.createJournal({
            description: `Pembayaran biaya: ${expense.category} - ${expense.description || ""}`,
            referenceType: "operational_expense",
            referenceId: expense.id,
            lines: [
                { accountId: payload.expenseAccountId, debit: expense.amount, credit: 0, description: expense.description },
                { accountId: payload.sourceAccountId, debit: 0, credit: expense.amount, description: "Pembayaran" },
            ],
            isAutoGenerated: true
        }, userId);

        // 2. Update status
        await db
            .update(operationalCosts)
            .set({
                status: "paid",
                paidAt: payload.date || new Date(),
                // Add notes if table supports it, otherwise skip
            })
            .where(eq(operationalCosts.id, id));

        return { success: true };
    }
}
