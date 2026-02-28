import { Context } from "hono";
import { accountingService, AccountingService } from "../accounting-container";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";
import { AccountingReportService } from "../services/accounting-reports.service";
import { LiabilitiesService } from "../services/liabilities.service";
import { SupplierPaymentService } from "../services/supplier-payment.service";
import { RevenueTargetService } from "../services/revenue-target.service";

export class AccountingController {
    constructor(
        private readonly service: AccountingService = accountingService
    ) { }

    // Dashboard Summary
    async getDashboard(c: Context) {
        try {
            // 1. Get today's register progress
            const todayProgress = await this.service.getTodayRegisterProgress();

            // 2. Get Income Statement for current year to show Revenue vs Expenses
            const yearStart = new Date(new Date().getFullYear(), 0, 1);
            const now = new Date();
            const incomeStatement = await AccountingReportService.getIncomeStatement(yearStart, now);

            // 3. Aggregate for frontend
            const dashboardData = {
                todayProgress,
                balanceSummary: {
                    REVENUE: incomeStatement.revenue,
                    EXPENSE: {
                        total: incomeStatement.expenses.total + incomeStatement.cogs.total,
                        accounts: [...incomeStatement.expenses.accounts, ...incomeStatement.cogs.accounts]
                    }
                }
            };

            return apiSuccess(c, dashboardData, "Dashboard data retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve dashboard data");
        }
    }

    // Liabilities
    async getLiabilitiesSummary(c: Context) {
        try {
            const summary = await LiabilitiesService.getSummary();
            return apiSuccess(c, summary);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve liabilities summary");
        }
    }

    async getSupplierDebts(c: Context) {
        try {
            const debts = await LiabilitiesService.getSupplierDebts();
            return apiSuccess(c, debts);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve supplier debts");
        }
    }

    async getExpenseDebts(c: Context) {
        try {
            const expenses = await LiabilitiesService.getExpenseDebts();
            return apiSuccess(c, expenses);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve expense debts");
        }
    }

    async getCommissionDebts(c: Context) {
        try {
            const { period } = c.req.query();
            const commissions = await LiabilitiesService.getCommissionDebts(period);
            return apiSuccess(c, commissions);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve commission debts");
        }
    }

    async payExpenseDebt(c: Context) {
        try {
            const id = c.req.param("id");
            const payload = await c.req.json();
            const userId = c.get("user")?.id;
            const result = await LiabilitiesService.payExpense(id, payload, userId);
            return apiSuccess(c, result, "Expense paid successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to pay expense");
        }
    }

    // Accounts
    async getAllAccounts(c: Context) {
        try {
            const { typeId } = c.req.query();
            const accounts = await this.service.getAllAccounts({ typeId });
            return apiSuccess(c, accounts, "Accounts retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve accounts");
        }
    }

    async getAccountTree(c: Context) {
        try {
            const { typeId } = c.req.query();
            const tree = await this.service.getAccountTree({ typeId });
            return apiSuccess(c, tree, "Account tree retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve account tree");
        }
    }

    async getAccountTypes(c: Context) {
        try {
            const types = await this.service.getAccountTypes();
            return apiSuccess(c, types, "Account types retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve account types");
        }
    }

    async createAccount(c: Context) {
        try {
            const body = await c.req.json();
            const userId = c.get("user")?.id;
            const id = await this.service.createAccount(body, userId);
            return apiSuccess(c, { id }, "Account created successfully", 201);
        } catch (e: any) {
            return apiError(c, e, "Failed to create account");
        }
    }

    async updateAccount(c: Context) {
        try {
            const id = c.req.param("id");
            const body = await c.req.json();
            const userId = c.get("user")?.id;
            await this.service.updateAccount(id, body, userId);
            return apiSuccess(c, null, "Account updated successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to update account");
        }
    }

    async deleteAccount(c: Context) {
        try {
            const id = c.req.param("id");
            const userId = c.get("user")?.id;
            await this.service.deleteAccount(id, userId);
            return apiSuccess(c, null, "Account deleted successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to delete account");
        }
    }

    // Journals
    async getAllJournals(c: Context) {
        try {
            const filters = c.req.query();
            const journals = await this.service.getAllJournals(filters);
            return apiSuccess(c, journals, "Journals retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve journals");
        }
    }

    async getJournalById(c: Context) {
        try {
            const id = c.req.param("id");
            const journal = await this.service.getJournalById(id);
            if (!journal) return apiError(c, null, "Journal not found", 404);
            return apiSuccess(c, journal, "Journal retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve journal");
        }
    }

    // Cash Register
    async getCurrentRegister(c: Context) {
        try {
            const register = await this.service.getTodayRegisterProgress();
            return apiSuccess(c, register, "Current register status retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve register status");
        }
    }

    async openRegister(c: Context) {
        try {
            const { openingBalance } = await c.req.json();
            const userId = c.get("user")?.id;
            const id = await this.service.openRegister(openingBalance, userId);
            return apiSuccess(c, { id }, "Register opened successfully", 201);
        } catch (e: any) {
            return apiError(c, e, "Failed to open register");
        }
    }

    async closeRegister(c: Context) {
        try {
            const { actualClosing, notes, reservation } = await c.req.json();
            const userId = c.get("user")?.id;
            await this.service.closeRegister(actualClosing, notes, userId, reservation);
            return apiSuccess(c, null, "Register closed successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to close register");
        }
    }

    async recordExpense(c: Context) {
        try {
            const { amount, category, description, userRoles } = await c.req.json();
            const userId = c.get("user")?.id;
            await this.service.recordCashExpense(amount, category, description, userId, userRoles);
            return apiSuccess(c, null, "Expense recorded successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to record expense");
        }
    }

    // Assets
    async getAllAssets(c: Context) {
        try {
            const assets = await this.service.getAllAssets();
            return apiSuccess(c, assets, "Assets retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve assets");
        }
    }

    async createAsset(c: Context) {
        try {
            const body = await c.req.json();
            const userId = c.get("user")?.id;
            const id = await this.service.createAsset(body, userId);
            return apiSuccess(c, { id }, "Asset created successfully", 201);
        } catch (e: any) {
            return apiError(c, e, "Failed to create asset");
        }
    }

    // Reports
    async getGeneralLedger(c: Context) {
        try {
            const { accountId, startDate, endDate } = c.req.query();
            if (!accountId) return apiError(c, null, "accountId is required", 400);

            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;

            const report = await AccountingReportService.getGeneralLedger(accountId, start, end);
            return apiSuccess(c, report, "General Ledger retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve General Ledger");
        }
    }

    async getIncomeStatement(c: Context) {
        try {
            const { startDate, endDate } = c.req.query();
            // Default to current year if not provided
            const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
            const end = endDate ? new Date(endDate) : new Date();

            const report = await AccountingReportService.getIncomeStatement(start, end);
            return apiSuccess(c, report, "Income Statement retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve Income Statement");
        }
    }

    async getBalanceSheet(c: Context) {
        try {
            const { date } = c.req.query();
            const asOfDate = date ? new Date(date) : new Date();

            const report = await AccountingReportService.getBalanceSheet(asOfDate);
            return apiSuccess(c, report, "Balance Sheet retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve Balance Sheet");
        }
    }

    // Payables (Supplier Debts)
    async getPayablesSummary(c: Context) {
        try {
            const debts = await LiabilitiesService.getSupplierDebts();
            const bySupplier: Record<string, { name: string; total: number; count: number }> = {};

            for (const d of debts) {
                if (!bySupplier[d.supplierId]) {
                    bySupplier[d.supplierId] = { name: d.supplierName, total: 0, count: 0 };
                }
                bySupplier[d.supplierId].total += d.outstanding;
                bySupplier[d.supplierId].count++;
            }

            const summary = {
                totalOutstanding: debts.reduce((s, d) => s + d.outstanding, 0),
                purchaseCount: debts.length,
                bySupplier: Object.values(bySupplier)
            };

            return apiSuccess(c, summary);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve payables summary");
        }
    }

    async getAllPayables(c: Context) {
        try {
            const debts = await LiabilitiesService.getSupplierDebts();
            // Map consistent with frontend expectations
            const mapped = debts.map(d => ({
                ...d,
                totalPaid: d.paidAmount,
                paymentStatus: d.paidAmount > 0 ? "partial" : "unpaid"
            }));
            return apiSuccess(c, mapped);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve payables");
        }
    }

    async getPayableById(c: Context) {
        try {
            const id = c.req.param("id");
            const debts = await LiabilitiesService.getSupplierDebts();
            const payable = debts.find(d => d.purchaseId === id);
            if (!payable) return apiError(c, null, "Payable not found", 404);

            const mapped = {
                ...payable,
                totalPaid: payable.paidAmount,
                paymentStatus: payable.paidAmount > 0 ? "partial" : "unpaid"
            };
            return apiSuccess(c, mapped);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve payable details");
        }
    }

    async recordPayablePayment(c: Context) {
        try {
            const id = c.req.param("id");
            const { amount, accountId, notes, method } = await c.req.json();
            const userId = c.get("user")?.id;

            const result = await SupplierPaymentService.create({
                purchaseId: id,
                amount,
                method: method || "cash",
                accountId,
                reference: notes
            }, userId);

            return apiSuccess(c, { id: result }, "Payment recorded successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to record payment");
        }
    }

    // Revenue Targets
    async getTodayTargets(c: Context) {
        try {
            const progress = await RevenueTargetService.getTodayProgress();
            return apiSuccess(c, progress);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve today targets");
        }
    }

    async getMonthTargets(c: Context) {
        try {
            const month = c.req.param("month");
            const progress = await RevenueTargetService.getMonthProgress(month);
            return apiSuccess(c, progress);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve month targets");
        }
    }

    async setTarget(c: Context) {
        try {
            const month = c.req.param("month");
            const body = await c.req.json();
            const userId = c.get("user")?.id;
            await RevenueTargetService.calculateAndSet({
                month,
                workingDays: body.workingDays,
                profitMarginPercent: body.profitMarginPercent
            }, userId);
            return apiSuccess(c, null, "Target updated successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to update target");
        }
    }

    async getAuditLogs(c: Context) {
        try {
            const { limit, offset, entityType, entityId } = c.req.query();
            const filters = {
                limit: limit ? parseInt(limit) : 50,
                offset: offset ? parseInt(offset) : 0,
                entityType,
                entityId
            };
            const logs = await import("../services/audit.service").then(m => m.AuditService.getAll(filters));
            return apiSuccess(c, logs, "Audit logs retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve audit logs");
        }
    }
}
