import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../../middlewares/auth.middleware";

// Import Controllers
import { AccountsController } from "../controllers/accounts.controller";
import { JournalController } from "../controllers/journal.controller";
import { AssetsController } from "../controllers/assets.controller";
import { CashRegisterController } from "../controllers/cash-register.controller";
import { RevenueTargetController } from "../controllers/revenue-target.controller";
import { SupplierPaymentController } from "../controllers/supplier-payment.controller";
import { PeriodCloseController } from "../controllers/period-close.controller";
import { CommissionPaymentController } from "../controllers/commission-payment.controller";
import { AuditController } from "../controllers/audit.controller";
import { AccountingDashboardController } from "../controllers/accounting-dashboard.controller";

const accounting = new Hono();

// Apply auth middleware to all accounting routes
accounting.use("*", authMiddleware);

// ============================================
// DASHBOARD
// ============================================

accounting.get("/dashboard", async (c) => {
    return await AccountingDashboardController.getDashboard(c);
});

// ============================================
// ACCOUNTS
// ============================================

accounting.get("/accounts", AccountsController.getAll);
accounting.get("/accounts/tree", AccountsController.getTree);
accounting.get("/accounts/types", AccountsController.getTypes);
accounting.get("/accounts/balance-summary", AccountsController.getBalanceSummary);

const createAccountSchema = z.object({
    code: z.string().min(3),
    name: z.string().min(2),
    typeId: z.string(),
    parentId: z.string().optional(),
    description: z.string().optional(),
});
accounting.post("/accounts", zValidator("json", createAccountSchema), AccountsController.create);

accounting.post("/accounts/seed", AccountsController.seed);
accounting.delete("/accounts/reset", AccountsController.reset);

const transferFundsSchema = z.object({
    fromAccountId: z.string(),
    toAccountId: z.string(),
    amount: z.number().positive(),
    description: z.string().min(3),
});
accounting.post("/accounts/transfer", zValidator("json", transferFundsSchema), AccountsController.transfer);

// ============================================
// JOURNALS
// ============================================

accounting.get("/journals", JournalController.getAll);
accounting.get("/journals/:id", JournalController.getById);

const voidJournalSchema = z.object({
    reason: z.string().min(5),
});
accounting.post("/journals/:id/void", zValidator("json", voidJournalSchema), JournalController.void);

// ============================================
// ASSETS
// ============================================

accounting.get("/assets", AssetsController.getAll);
accounting.get("/assets/:id", AssetsController.getById);

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
accounting.post("/assets", zValidator("json", createAssetSchema), AssetsController.create);

const updateAssetSchema = z.object({
    name: z.string().min(2).optional(),
    category: z.enum(["tool", "equipment", "furniture", "vehicle", "building", "other"]).optional(),
    purchaseDate: z.coerce.date().optional(),
    purchaseCost: z.number().positive().optional(),
    salvageValue: z.number().min(0).optional(),
    usefulLifeMonths: z.number().positive().optional(),
    notes: z.string().optional(),
});
accounting.patch("/assets/:id", zValidator("json", updateAssetSchema), AssetsController.update);

accounting.delete("/assets/:id", AssetsController.delete);

const processDepreciationSchema = z.object({
    period: z.string().regex(/^\d{4}-\d{2}$/),
});
accounting.post("/assets/depreciation/process-all", zValidator("json", processDepreciationSchema), AssetsController.processDepreciation);

// ============================================
// CASH REGISTER
// ============================================

accounting.get("/register/current", CashRegisterController.getCurrent);
accounting.get("/register/status", CashRegisterController.getStatus);

const openRegisterSchema = z.object({
    openingBalance: z.number().min(0),
});
accounting.post("/register/open", zValidator("json", openRegisterSchema), CashRegisterController.open);

const closeRegisterSchema = z.object({
    actualClosing: z.number().min(0),
    notes: z.string().optional().default(""),
    reserveAmount: z.number().min(0).optional(),
    targetAccountId: z.string().optional(),
});
accounting.post("/register/close", zValidator("json", closeRegisterSchema), CashRegisterController.close);

accounting.get("/register/history", CashRegisterController.getHistory);

// ============================================
// REVENUE TARGETS
// ============================================

accounting.get("/targets/today", RevenueTargetController.getToday);
accounting.get("/targets/:month", RevenueTargetController.getMonth);

const setTargetSchema = z.object({
    workingDays: z.number().min(1).max(31),
    profitMarginPercent: z.number().min(0).max(100).optional(),
});
accounting.post("/targets/:month", zValidator("json", setTargetSchema), RevenueTargetController.setTarget);

// ============================================
// SUPPLIER PAYMENTS (AP)
// ============================================

accounting.get("/payables", SupplierPaymentController.getPayables);
accounting.get("/payables/summary", SupplierPaymentController.getSummary);

const createPaymentSchema = z.object({
    purchaseId: z.string(),
    amount: z.number().positive(),
    method: z.string(),
    reference: z.string().optional(),
});
accounting.post("/payables/pay", zValidator("json", createPaymentSchema), SupplierPaymentController.pay);

// ============================================
// PERIOD CLOSING
// ============================================

accounting.get("/periods", PeriodCloseController.getAll);
accounting.get("/periods/:period", PeriodCloseController.getSummary); // Note: Route param :period handling

accounting.post("/periods/:period/close", PeriodCloseController.close);

const reopenPeriodSchema = z.object({
    reason: z.string().min(10),
});
accounting.post("/periods/:period/reopen", zValidator("json", reopenPeriodSchema), PeriodCloseController.reopen);

// ============================================
// COMMISSION PAYMENTS
// ============================================

accounting.get("/commissions/pending/:period", CommissionPaymentController.getPending);
accounting.get("/commissions/summary/:period", CommissionPaymentController.getSummary);
accounting.get("/commissions/history", CommissionPaymentController.getHistory);

const payCommissionSchema = z.object({
    technicianId: z.string(),
    period: z.string().regex(/^\d{4}-\d{2}$/),
    serviceIds: z.array(z.number()),
    amount: z.number().positive(),
});
accounting.post("/commissions/pay", zValidator("json", payCommissionSchema), CommissionPaymentController.pay);

// ============================================
// AUDIT LOGS
// ============================================

accounting.get("/audit-logs", AuditController.getAll);
accounting.get("/audit-logs/:entityType/:entityId", AuditController.getByEntity);


// DASHBOARD CONTROLLER (Inline for now to avoid circular dependency or extra file, 
// or I'll create it right after this write).


export default accounting;
