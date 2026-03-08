import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import { AppHonoContext } from "../../../shared/types/app-context";
import { AccountingService } from "../services/index";
import { apiSuccess, apiError } from "../../../shared/application/middlewares/ResponseHelpers";
import { AccountingReportService } from "../services/accounting-reports.service";
import { LiabilitiesService } from "../services/liabilities.service";
import { SupplierPaymentService } from "../services/supplier-payment.service";
import { RevenueTargetService } from "../services/revenue-target.service";
import { AuditService } from "../services/audit.service";

@injectable()
export class AccountingController {
    constructor(
        @inject(TYPES.AccountingService) private readonly service: AccountingService,
        @inject(TYPES.AccountingReportService) private readonly reportService: AccountingReportService,
        @inject(TYPES.LiabilitiesService) private readonly liabilitiesService: LiabilitiesService,
        @inject(TYPES.SupplierPaymentService) private readonly paymentService: SupplierPaymentService,
        @inject(TYPES.RevenueTargetService) private readonly targetService: RevenueTargetService,
        @inject(TYPES.AuditService) private readonly auditService: AuditService
    ) { }

    // Dashboard Summary
    async getDashboard(c: AppHonoContext) {
        try {
            const todayProgress = await this.service.getTodayRegisterProgress();
            const yearStart = new Date(new Date().getFullYear(), 0, 1);
            const now = new Date();
            const incomeStatement = await this.reportService.getIncomeStatement(yearStart, now);
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
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve dashboard data");
        }
    }

    async getLiabilitiesSummary(c: AppHonoContext) {
        try {
            const summary = await this.liabilitiesService.getSummary();
            return apiSuccess(c, summary);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve liabilities summary");
        }
    }

    async getSupplierDebts(c: AppHonoContext) {
        try {
            const debts = await this.liabilitiesService.getSupplierDebts();
            return apiSuccess(c, debts);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve supplier debts");
        }
    }

    async getExpenseDebts(c: AppHonoContext) {
        try {
            const expenses = await this.liabilitiesService.getExpenseDebts();
            return apiSuccess(c, expenses);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve expense debts");
        }
    }

    async getCommissionDebts(c: AppHonoContext) {
        try {
            const { period } = c.req.query();
            const commissions = await this.liabilitiesService.getCommissionDebts(period);
            return apiSuccess(c, commissions);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve commission debts");
        }
    }

    async payExpenseDebt(c: AppHonoContext) {
        try {
            const id = c.req.param("id");
            if (!id) return apiError(c, null, "Expense ID is required", 400);
            const payload = await c.req.json();
            const user = c.get("user");
            if (!user?.id) return apiError(c, null, "Unauthorized", 401);
            const result = await this.liabilitiesService.payExpense(id!, payload, user.id!);
            return apiSuccess(c, result, "Expense paid successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to pay expense");
        }
    }

    async getAllAccounts(c: AppHonoContext) {
        try {
            const { typeId } = c.req.query();
            const accounts = await this.service.getAllAccounts({ typeId });
            return apiSuccess(c, accounts, "Accounts retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve accounts");
        }
    }

    async getAccountTree(c: AppHonoContext) {
        try {
            const { typeId } = c.req.query();
            const tree = await this.service.getAccountTree({ typeId });
            return apiSuccess(c, tree, "Account tree retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve account tree");
        }
    }

    async getAccountTypes(c: AppHonoContext) {
        try {
            const types = await this.service.getAccountTypes();
            return apiSuccess(c, types, "Account types retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve account types");
        }
    }

    async createAccount(c: AppHonoContext) {
        try {
            const body = await c.req.json();
            const user = c.get("user");
            if (!user) return apiError(c, null, "Unauthorized", 401);
            const id = await this.service.createAccount(body, user.id);
            return apiSuccess(c, { id }, "Account created successfully", 201);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to create account");
        }
    }

    async updateAccount(c: AppHonoContext) {
        try {
            const id = c.req.param("id");
            if (!id) return apiError(c, null, "Account ID is required", 400);
            const body = await c.req.json();
            const user = c.get("user");
            if (!user) return apiError(c, null, "Unauthorized", 401);
            await this.service.updateAccount(id!, body, user.id!);
            return apiSuccess(c, null, "Account updated successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to update account");
        }
    }

    async deleteAccount(c: AppHonoContext) {
        try {
            const id = c.req.param("id");
            if (!id) return apiError(c, null, "Account ID is required", 400);
            const user = c.get("user");
            if (!user) return apiError(c, null, "Unauthorized", 401);
            await this.service.deleteAccount(id!, user.id!);
            return apiSuccess(c, null, "Account deleted successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to delete account");
        }
    }

    async getAllJournals(c: AppHonoContext) {
        try {
            const filters = c.req.query() as any;
            const journals = await this.service.getAllJournals(filters);
            return apiSuccess(c, journals, "Journals retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve journals");
        }
    }

    async getJournalById(c: AppHonoContext) {
        try {
            const id = c.req.param("id");
            if (!id) return apiError(c, null, "Journal ID is required", 400);
            const journal = await this.service.getJournalById(id!);
            if (!journal) return apiError(c, null, "Journal not found", 404);
            return apiSuccess(c, journal, "Journal retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve journal");
        }
    }

    async getCurrentRegister(c: AppHonoContext) {
        try {
            const register = await this.service.getTodayRegisterProgress();
            return apiSuccess(c, register, "Current register status retrieved");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve register status");
        }
    }

    async openRegister(c: AppHonoContext) {
        try {
            const { openingBalance } = await c.req.json();
            const user = c.get("user");
            if (!user) return apiError(c, null, "Unauthorized", 401);
            const id = await this.service.openRegister(openingBalance, user.id);
            return apiSuccess(c, { id }, "Register opened successfully", 201);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to open register");
        }
    }

    async closeRegister(c: AppHonoContext) {
        try {
            const { actualClosing, notes, reservation } = await c.req.json();
            const user = c.get("user");
            if (!user) return apiError(c, null, "Unauthorized", 401);
            await this.service.closeRegister(actualClosing, notes, user.id, reservation);
            return apiSuccess(c, null, "Register closed successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to close register");
        }
    }

    async recordExpense(c: AppHonoContext) {
        try {
            const { amount, category, description, userRoles } = await c.req.json();
            const user = c.get("user");
            if (!user) return apiError(c, null, "Unauthorized", 401);
            await this.service.recordCashExpense(amount, category, description, user.id, userRoles);
            return apiSuccess(c, null, "Expense recorded successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to record expense");
        }
    }

    async getAllAssets(c: AppHonoContext) {
        try {
            const assets = await this.service.getAllAssets();
            return apiSuccess(c, assets, "Assets retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve assets");
        }
    }

    async createAsset(c: AppHonoContext) {
        try {
            const body = await c.req.json();
            const user = c.get("user");
            if (!user) return apiError(c, null, "Unauthorized", 401);
            const id = await this.service.createAsset(body, user.id);
            return apiSuccess(c, { id }, "Asset created successfully", 201);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to create asset");
        }
    }

    async getGeneralLedger(c: AppHonoContext) {
        try {
            const { accountId, startDate, endDate } = c.req.query();
            if (!accountId) return apiError(c, null, "accountId is required", 400);

            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;

            const report = await this.reportService.getGeneralLedger(accountId!, start, end);
            return apiSuccess(c, report, "General Ledger retrieved");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve General Ledger");
        }
    }

    async getIncomeStatement(c: AppHonoContext) {
        try {
            const { startDate, endDate } = c.req.query();
            const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
            const end = endDate ? new Date(endDate) : new Date();

            const report = await this.reportService.getIncomeStatement(start, end);
            return apiSuccess(c, report, "Income Statement retrieved");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve Income Statement");
        }
    }

    async getBalanceSheet(c: AppHonoContext) {
        try {
            const { date } = c.req.query();
            const asOfDate = date ? new Date(date) : new Date();

            const report = await this.reportService.getBalanceSheet(asOfDate);
            return apiSuccess(c, report, "Balance Sheet retrieved");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve Balance Sheet");
        }
    }

    async getPayablesSummary(c: AppHonoContext) {
        try {
            const debts = await this.liabilitiesService.getSupplierDebts();
            const bySupplier: Record<string, { name: string; total: number; count: number }> = {};

            for (const d of debts) {
                const supplier = bySupplier[d.supplierId];
                if (!supplier) {
                    bySupplier[d.supplierId] = { name: d.supplierName, total: d.outstanding, count: 1 };
                } else {
                    supplier.total += d.outstanding;
                    supplier.count++;
                }
            }

            const summary = {
                totalOutstanding: debts.reduce((s: number, d: any) => s + d.outstanding, 0),
                purchaseCount: debts.length,
                bySupplier: Object.values(bySupplier)
            };

            return apiSuccess(c, summary);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve payables summary");
        }
    }

    async getAllPayables(c: AppHonoContext) {
        try {
            const debts = await this.liabilitiesService.getSupplierDebts();
            const mapped = debts.map((d: any) => ({
                ...d,
                totalPaid: d.paidAmount,
                paymentStatus: d.paidAmount > 0 ? "partial" : "unpaid"
            }));
            return apiSuccess(c, mapped);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve payables");
        }
    }

    async getPayableById(c: AppHonoContext) {
        try {
            const id = c.req.param("id");
            const debts = await this.liabilitiesService.getSupplierDebts();
            const payable = debts.find((d: any) => d.purchaseId === id);
            if (!payable) return apiError(c, null, "Payable not found", 404);

            const mapped = {
                ...payable,
                totalPaid: payable.paidAmount,
                paymentStatus: payable.paidAmount > 0 ? "partial" : "unpaid"
            };
            return apiSuccess(c, mapped);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve payable details");
        }
    }

    async recordPayablePayment(c: AppHonoContext) {
        try {
            const id = c.req.param("id");
            const { amount, accountId, notes, method } = await c.req.json();
            const user = c.get("user");
            if (!user) return apiError(c, null, "Unauthorized", 401);

            if (!id) return apiError(c, null, "Payable ID is required", 400);
            const result = await this.paymentService.create({
                purchaseId: id,
                amount,
                method: method || "cash",
                accountId,
                reference: notes
            }, user.id);

            return apiSuccess(c, { id: result }, "Payment recorded successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to record payment");
        }
    }

    async getTodayTargets(c: AppHonoContext) {
        try {
            const progress = await this.targetService.getTodayProgress();
            return apiSuccess(c, progress);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve today targets");
        }
    }

    async getMonthTargets(c: AppHonoContext) {
        try {
            const month = c.req.param("month");
            if (!month) return apiError(c, null, "Month is required", 400);
            const progress = await this.targetService.getMonthProgress(month);
            return apiSuccess(c, progress);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve month targets");
        }
    }

    async setTarget(c: AppHonoContext) {
        try {
            const month = c.req.param("month");
            const body = await c.req.json();
            const user = c.get("user");
            if (!user?.id) return apiError(c, null, "Unauthorized", 401);
            if (!month) return apiError(c, null, "Month is required", 400);
            await this.targetService.calculateAndSet({
                month: month!,
                workingDays: body.workingDays,
                profitMarginPercent: body.profitMarginPercent
            }, user.id!);
            return apiSuccess(c, null, "Target updated successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to update target");
        }
    }

    async getAuditLogs(c: AppHonoContext) {
        try {
            const { limit, offset, entityType, entityId } = c.req.query();
            const filters = {
                limit: limit ? parseInt(limit) : 50,
                offset: offset ? parseInt(offset) : 0,
                entityType: entityType || undefined,
                entityId: entityId || undefined
            };
            const logs = await this.auditService.getAll(filters);
            return apiSuccess(c, logs, "Audit logs retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve audit logs");
        }
    }
}
