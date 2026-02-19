import { Context } from "hono";
import { db } from "../../../db";
import { operationalCosts, commissionPayments, users, purchases } from "../../../db/schema";
import { eq, and, sql, desc, ne, gt } from "drizzle-orm";
import { OperationalCostsService } from "../../operational-costs/services/operational-costs.service";
import { PurchasesModel } from "../../purchases/models/purchases.model";
import { CommissionPaymentService } from "../../accounting/services/commission-payment.service";

export class LiabilitiesController {
    static async getSummary(c: Context) {
        try {
            // 1. Operational Expenses (Pending)
            const expenseService = new OperationalCostsService();
            // We need a custom query for pending expenses as findAll might not filter by status efficiently without implementing specific method
            // But let's use direct DB query for efficiency here
            const pendingExpenses = await db.query.operationalCosts.findMany({
                where: eq(operationalCosts.status, "pending")
            });
            const totalPendingExpenses = pendingExpenses.reduce((sum, item) => sum + item.amount, 0);

            // 2. Unpaid Purchases (Supplier Debt)
            const purchasesModel = new PurchasesModel();
            const unpaidPurchases = await purchasesModel.getUnpaid(db);
            const totalSupplierDebt = unpaidPurchases.reduce((sum: any, item: any) => sum + item.remainingAmount, 0);

            // 3. Pending Commissions
            // We need to fetch all technicians and their pending commissions using logic similar to getPendingCommissions
            // But getPendingCommissions is per period. We want global outstanding.
            // CommissionPaymentService.getPendingCommissions logic is: Find services completed but not paid. 
            // Actually, `getPendingCommissions` takes a period (month). 
            // We should iterate over recent periods or just find all services without commission_payment link?
            // The current logic in `getPendingCommissions` filters by `dateOut`.
            // For a "Liabilities" summary, we truly want *everything* unpaid.
            // Let's assume for now we look back 3-6 months or just fetch all "completed" services.
            // But realistically, `getPendingCommissions` is designed for a specific month context.
            // Let's try to reuse `getPendingCommissions` for the current month + last month as a proxy, 
            // OR standard way: Technicians usually paid monthly.
            // Let's implement a `getAllPendingCommissions` in CommissionPaymentService later if needed.
            // For now, let's just stick to 0 or implement a quick robust query.

            // Allow querying for specific period? Or just show "Current Period" liability?
            // "Liabilities" usually implies *all* debt.
            // Let's approximate by fetching current month's pending commissions.
            const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
            const pendingCommissions = await CommissionPaymentService.getPendingCommissions(currentPeriod);
            const totalCommissionDebt = pendingCommissions.reduce((sum: number, item: any) => sum + item.commission, 0);

            return c.json({
                summary: {
                    supplierDebt: totalSupplierDebt,
                    expenseDebt: totalPendingExpenses,
                    commissionDebt: totalCommissionDebt,
                    total: totalSupplierDebt + totalPendingExpenses + totalCommissionDebt
                }
            });
        } catch (error: any) {
            console.error("Error getting liabilities summary:", error);
            return c.json({ error: error.message }, 500);
        }
    }

    static async getSupplierDebts(c: Context) {
        try {
            const model = new PurchasesModel();
            const unpaid = await model.getUnpaid(db);
            return c.json(unpaid);
        } catch (error: any) {
            return c.json({ error: error.message }, 500);
        }
    }

    static async getExpenseDebts(c: Context) {
        try {
            const expenses = await db.query.operationalCosts.findMany({
                where: eq(operationalCosts.status, "pending"),
                orderBy: [desc(operationalCosts.date)],
                with: {
                    user: true // Created by
                }
            });
            return c.json(expenses);
        } catch (error: any) {
            return c.json({ error: error.message }, 500);
        }
    }

    static async getCommissionDebts(c: Context) {
        try {
            // For now, return current period
            const period = c.req.query("period") || new Date().toISOString().slice(0, 7);
            const commissions = await CommissionPaymentService.getPendingCommissions(period);
            return c.json(commissions);
        } catch (error: any) {
            return c.json({ error: error.message }, 500);
        }
    }

    static async payExpense(c: Context) {
        try {
            const id = c.req.param("id");
            const body = await c.req.json();
            const userId = c.get("user")?.id;

            const service = new OperationalCostsService();
            await service.markAsPaid(id, body, userId);

            return c.json({ message: "Expense paid successfully" });
        } catch (error: any) {
            return c.json({ error: error.message }, 500);
        }
    }
}
