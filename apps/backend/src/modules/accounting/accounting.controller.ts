import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { AccountsService } from "./accounts.service";
import { JournalService } from "./journal.service";
import { AssetsService } from "./assets.service";
import { CashRegisterService } from "./cash-register.service";
import { RevenueTargetService } from "./revenue-target.service";
import { SupplierPaymentService } from "./supplier-payment.service";
import { PeriodCloseService } from "./period-close.service";
import { CommissionPaymentService } from "./commission-payment.service";
import { AuditService } from "./audit.service";
import { authMiddleware } from "../../middlewares/auth.middleware";

// Helper to extract user ID from JWT payload
function getUserId(c: any): string | undefined {
    const payload = c.get("jwtPayload") as any;
    return payload?.id || payload?.userId || payload?.sub;
}

const accounting = new Hono();

// Apply auth middleware to all accounting routes
accounting.use("*", authMiddleware);

// ============================================
// DASHBOARD
// ============================================

accounting.get("/dashboard", async (c) => {
    const [todayProgress, registerStatus, balanceSummary] = await Promise.all([
        RevenueTargetService.getTodayProgress(),
        CashRegisterService.getTodayProgress(),
        AccountsService.getBalanceSummary(),
    ]);

    return c.json({
        todayProgress,
        registerStatus,
        balanceSummary,
    });
});

// ============================================
// ACCOUNTS
// ============================================

accounting.get("/accounts", async (c) => {
    const accounts = await AccountsService.getAll();
    return c.json(accounts);
});

accounting.get("/accounts/tree", async (c) => {
    const tree = await AccountsService.getTree();
    return c.json(tree);
});

accounting.get("/accounts/types", async (c) => {
    const types = await AccountsService.getAccountTypes();
    return c.json(types);
});

accounting.get("/accounts/balance-summary", async (c) => {
    const summary = await AccountsService.getBalanceSummary();
    return c.json(summary);
});

const createAccountSchema = z.object({
    code: z.string().min(3),
    name: z.string().min(2),
    typeId: z.string(),
    parentId: z.string().optional(),
    description: z.string().optional(),
});

accounting.post("/accounts", zValidator("json", createAccountSchema), async (c) => {
    const data = c.req.valid("json");
    const userId = getUserId(c);
    const id = await AccountsService.create(data, userId);
    return c.json({ id }, 201);
});

// Seed standard Chart of Accounts (for new installations)
accounting.post("/accounts/seed", async (c) => {
    const userId = getUserId(c);
    const result = await AccountsService.seedStandardAccounts(userId);
    return c.json(result, result.skipped ? 200 : 201);
});

const transferFundsSchema = z.object({
    fromAccountId: z.string(),
    toAccountId: z.string(),
    amount: z.number().positive(),
    description: z.string().min(3),
});

accounting.post("/accounts/transfer", zValidator("json", transferFundsSchema), async (c) => {
    const { fromAccountId, toAccountId, amount, description } = c.req.valid("json");
    const userId = getUserId(c);

    if (fromAccountId === toAccountId) {
        return c.json({ error: "Source and destination accounts must be different" }, 400);
    }

    const journalId = await JournalService.create({
        description,
        referenceType: "adjustment",
        lines: [
            { accountId: toAccountId, debit: amount, credit: 0, description },
            { accountId: fromAccountId, debit: 0, credit: amount, description },
        ],
    }, userId);

    return c.json({ id: journalId }, 201);
});

// ============================================
// JOURNALS
// ============================================

accounting.get("/journals", async (c) => {
    const { startDate, endDate, referenceType, status, limit, offset } = c.req.query();
    const journals = await JournalService.getAll({
        startDate,
        endDate,
        referenceType: referenceType as any,
        status: status as any,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
    });
    return c.json(journals);
});

accounting.get("/journals/:id", async (c) => {
    const id = c.req.param("id");
    const journal = await JournalService.getById(id);
    if (!journal) return c.json({ error: "Journal not found" }, 404);
    return c.json(journal);
});

const voidJournalSchema = z.object({
    reason: z.string().min(5),
});

accounting.post("/journals/:id/void", zValidator("json", voidJournalSchema), async (c) => {
    const id = c.req.param("id");
    const { reason } = c.req.valid("json");
    const userId = getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);
    await JournalService.void(id, reason, userId);
    return c.json({ success: true });
});

// ============================================
// ASSETS
// ============================================

accounting.get("/assets", async (c) => {
    const { category, status, limit, offset } = c.req.query();
    const assets = await AssetsService.getAll({
        category: category as any,
        status: status as any,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
    });
    return c.json(assets);
});

accounting.get("/assets/:id", async (c) => {
    const id = c.req.param("id");
    const asset = await AssetsService.getById(id);
    if (!asset) return c.json({ error: "Asset not found" }, 404);
    return c.json(asset);
});

const createAssetSchema = z.object({
    name: z.string().min(2),
    category: z.enum(["tool", "equipment", "furniture", "vehicle", "building", "other"]),
    purchaseDate: z.coerce.date(),
    purchaseCost: z.number().positive(),
    salvageValue: z.number().min(0),
    usefulLifeMonths: z.number().positive(),
    notes: z.string().optional(),
    sourceAccountId: z.string().optional(),
});

accounting.post("/assets", zValidator("json", createAssetSchema), async (c) => {
    const data = c.req.valid("json");
    const userId = getUserId(c);
    const id = await AssetsService.create(data, userId);
    return c.json({ id }, 201);
});

const processDepreciationSchema = z.object({
    period: z.string().regex(/^\d{4}-\d{2}$/),
});

const updateAssetSchema = z.object({
    name: z.string().min(2).optional(),
    category: z.enum(["tool", "equipment", "furniture", "vehicle", "building", "other"]).optional(),
    purchaseDate: z.coerce.date().optional(),
    purchaseCost: z.number().positive().optional(),
    salvageValue: z.number().min(0).optional(),
    usefulLifeMonths: z.number().positive().optional(),
    notes: z.string().optional(),
});

accounting.patch("/assets/:id", zValidator("json", updateAssetSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const userId = getUserId(c);
    await AssetsService.update(id, data, userId);
    return c.json({ success: true });
});

accounting.delete("/assets/:id", async (c) => {
    const id = c.req.param("id");
    const userId = getUserId(c);
    await AssetsService.delete(id, userId);
    return c.json({ success: true });
});

accounting.post("/assets/depreciation/process-all", zValidator("json", processDepreciationSchema), async (c) => {
    const { period } = c.req.valid("json");
    const userId = getUserId(c);
    const result = await AssetsService.processAllDepreciation(period, userId);
    return c.json(result);
});

// ============================================
// CASH REGISTER
// ============================================

accounting.get("/register/current", async (c) => {
    const register = await CashRegisterService.getCurrentRegister();
    return c.json(register);
});

accounting.get("/register/status", async (c) => {
    const [status, progress] = await Promise.all([
        CashRegisterService.getTodayProgress(),
        RevenueTargetService.getTodayProgress(),
    ]);
    return c.json({
        ...status,
        dailyBreakeven: progress.dailyBreakeven || 0
    });
});

const openRegisterSchema = z.object({
    openingBalance: z.number().min(0),
});

accounting.post("/register/open", zValidator("json", openRegisterSchema), async (c) => {
    const { openingBalance } = c.req.valid("json");
    const userId = getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);
    const id = await CashRegisterService.open(openingBalance, userId);
    return c.json({ id }, 201);
});

const closeRegisterSchema = z.object({
    actualClosing: z.number().min(0),
    notes: z.string().optional().default(""),
    reserveAmount: z.number().min(0).optional(),
    targetAccountId: z.string().optional(),
});

accounting.post("/register/close", zValidator("json", closeRegisterSchema), async (c) => {
    const { actualClosing, notes, reserveAmount, targetAccountId } = c.req.valid("json");
    const userId = getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const result = await CashRegisterService.close(
        actualClosing,
        notes,
        userId,
        reserveAmount && targetAccountId ? { amount: reserveAmount, targetAccountId } : undefined
    );
    return c.json(result);
});

accounting.get("/register/history", async (c) => {
    const { startDate, endDate, limit } = c.req.query();
    const history = await CashRegisterService.getHistory(startDate, endDate, limit ? parseInt(limit) : undefined);
    return c.json(history);
});

// ============================================
// REVENUE TARGETS
// ============================================

accounting.get("/targets/today", async (c) => {
    const progress = await RevenueTargetService.getTodayProgress();
    return c.json(progress);
});

accounting.get("/targets/:month", async (c) => {
    const month = c.req.param("month");
    const progress = await RevenueTargetService.getMonthProgress(month);
    return c.json(progress);
});

const setTargetSchema = z.object({
    workingDays: z.number().min(1).max(31),
    profitMarginPercent: z.number().min(0).max(100).optional(),
});

accounting.post("/targets/:month", zValidator("json", setTargetSchema), async (c) => {
    const month = c.req.param("month");
    const data = c.req.valid("json");
    const userId = getUserId(c);
    await RevenueTargetService.calculateAndSet({ month, ...data }, userId);
    return c.json({ success: true });
});

// ============================================
// SUPPLIER PAYMENTS (AP)
// ============================================

accounting.get("/payables", async (c) => {
    const payables = await SupplierPaymentService.getOutstandingPayables();
    return c.json(payables);
});

accounting.get("/payables/summary", async (c) => {
    const summary = await SupplierPaymentService.getPayablesSummary();
    return c.json(summary);
});

const createPaymentSchema = z.object({
    purchaseId: z.string(),
    amount: z.number().positive(),
    method: z.string(),
    reference: z.string().optional(),
});

accounting.post("/payables/pay", zValidator("json", createPaymentSchema), async (c) => {
    const data = c.req.valid("json");
    const userId = getUserId(c);
    const id = await SupplierPaymentService.create(data, userId);
    return c.json({ id }, 201);
});

// ============================================
// PERIOD CLOSING
// ============================================

accounting.get("/periods", async (c) => {
    const periods = await PeriodCloseService.getAllPeriods();
    return c.json(periods);
});

accounting.get("/periods/:period", async (c) => {
    const period = c.req.param("period");
    const summary = await PeriodCloseService.getPeriodSummary(period);
    return c.json(summary);
});

accounting.post("/periods/:period/close", async (c) => {
    const period = c.req.param("period");
    const userId = getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);
    await PeriodCloseService.closePeriod(period, userId);
    return c.json({ success: true });
});

const reopenPeriodSchema = z.object({
    reason: z.string().min(10),
});

accounting.post("/periods/:period/reopen", zValidator("json", reopenPeriodSchema), async (c) => {
    const period = c.req.param("period");
    const { reason } = c.req.valid("json");
    const userId = getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);
    await PeriodCloseService.reopenPeriod(period, reason, userId);
    return c.json({ success: true });
});

// ============================================
// COMMISSION PAYMENTS
// ============================================

accounting.get("/commissions/pending/:period", async (c) => {
    const period = c.req.param("period");
    const pending = await CommissionPaymentService.getPendingCommissions(period);
    return c.json(pending);
});

accounting.get("/commissions/summary/:period", async (c) => {
    const period = c.req.param("period");
    const summary = await CommissionPaymentService.getPeriodSummary(period);
    return c.json(summary);
});

accounting.get("/commissions/history", async (c) => {
    const { technicianId, period } = c.req.query();
    const history = await CommissionPaymentService.getPaymentHistory(technicianId, period);
    return c.json(history);
});

const payCommissionSchema = z.object({
    technicianId: z.string(),
    period: z.string().regex(/^\d{4}-\d{2}$/),
    serviceIds: z.array(z.number()),
    amount: z.number().positive(),
});

accounting.post("/commissions/pay", zValidator("json", payCommissionSchema), async (c) => {
    const data = c.req.valid("json");
    const userId = getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);
    const id = await CommissionPaymentService.payCommission(data, userId);
    return c.json({ id }, 201);
});

// ============================================
// AUDIT LOGS
// ============================================

accounting.get("/audit-logs", async (c) => {
    const { startDate, endDate, userId, entityType, action, limit, offset } = c.req.query();
    const logs = await AuditService.getAll({
        startDate,
        endDate,
        userId,
        entityType,
        action: action as any,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
    });
    return c.json(logs);
});

accounting.get("/audit-logs/:entityType/:entityId", async (c) => {
    const { entityType, entityId } = c.req.param();
    const logs = await AuditService.getByEntity(entityType, entityId);
    return c.json(logs);
});

export default accounting;
