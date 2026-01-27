import { Hono } from "hono";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { apiSuccess, apiError } from "../../lib/response";
import { ReportsService } from "./reports.service";

const app = new Hono();
const reportsService = new ReportsService();

app.use("*", authMiddleware);

/**
 * GET /reports/summary
 * Get sales summary with revenue, HPP, profit totals
 */
app.get("/summary", async (c) => {
    try {
        const { startDate, endDate } = c.req.query();
        const summary = await reportsService.getSalesSummary({ startDate, endDate });
        return apiSuccess(c, summary, "Summary retrieved successfully");
    } catch (e) {
        return apiError(c, e, "Failed to get summary");
    }
});

/**
 * GET /reports/transactions
 * Get list of transactions with profit details
 */
app.get("/transactions", async (c) => {
    try {
        const { startDate, endDate } = c.req.query();
        const transactions = await reportsService.getTransactions({ startDate, endDate });
        return apiSuccess(c, transactions, "Transactions retrieved successfully");
    } catch (e) {
        return apiError(c, e, "Failed to get transactions");
    }
});

/**
 * GET /reports/services
 * Get service statistics
 */
app.get("/services", async (c) => {
    try {
        const { startDate, endDate } = c.req.query();
        const stats = await reportsService.getServiceStats({ startDate, endDate });
        return apiSuccess(c, stats, "Service stats retrieved successfully");
    } catch (e) {
        return apiError(c, e, "Failed to get service stats");
    }
});

/**
 * GET /reports/services/transactions
 * Get service transactions list
 */
app.get("/services/transactions", async (c) => {
    try {
        const { startDate, endDate } = c.req.query();
        const transactions = await reportsService.getServiceTransactions({ startDate, endDate });
        return apiSuccess(c, transactions, "Service transactions retrieved successfully");
    } catch (e) {
        return apiError(c, e, "Failed to get service transactions");
    }
});

/**
 * GET /reports/purchases/summary
 * Get purchases summary
 */
app.get("/purchases/summary", async (c) => {
    try {
        const { startDate, endDate } = c.req.query();
        const summary = await reportsService.getPurchasesSummary({ startDate, endDate });
        return apiSuccess(c, summary, "Purchases summary retrieved successfully");
    } catch (e) {
        return apiError(c, e, "Failed to get purchases summary");
    }
});

/**
 * GET /reports/purchases/transactions
 * Get purchase transactions list
 */
app.get("/purchases/transactions", async (c) => {
    try {
        const { startDate, endDate } = c.req.query();
        const transactions = await reportsService.getPurchaseTransactions({ startDate, endDate });
        return apiSuccess(c, transactions, "Purchase transactions retrieved successfully");
    } catch (e) {
        return apiError(c, e, "Failed to get purchase transactions");
    }
});

/**
 * GET /reports/technicians
 * Get technician performance statistics
 */
app.get("/technicians", async (c) => {
    try {
        const { startDate, endDate } = c.req.query();
        const stats = await reportsService.getTechnicianStats({ startDate, endDate });
        return apiSuccess(c, stats, "Technician stats retrieved successfully");
    } catch (e) {
        return apiError(c, e, "Failed to get technician stats");
    }
});

/**
 * GET /reports/parts
 * Get parts usage report
 */
app.get("/parts", async (c) => {
    try {
        const { startDate, endDate } = c.req.query();
        const report = await reportsService.getPartsUsageReport({ startDate, endDate });
        return apiSuccess(c, report, "Parts usage report retrieved successfully");
    } catch (e) {
        return apiError(c, e, "Failed to get parts usage report");
    }
});

/**
 * GET /reports/logs
 * Get activity logs
 */
app.get("/logs", async (c) => {
    try {
        const { startDate, endDate, userId, action, entityType, limit } = c.req.query();
        const logs = await reportsService.getActivityLogs({
            startDate,
            endDate,
            userId,
            action,
            entityType,
            limit: limit ? parseInt(limit) : undefined
        });
        return apiSuccess(c, logs, "Activity logs retrieved successfully");
    } catch (e) {
        return apiError(c, e, "Failed to get activity logs");
    }
});

/**
 * GET /reports/profit-loss
 * Get Profit and Loss summary
 */
app.get("/profit-loss", async (c) => {
    try {
        const { startDate, endDate } = c.req.query();
        const data = await reportsService.getProfitAndLoss({ startDate, endDate });
        return apiSuccess(c, data, "Profit & Loss retrieved successfully");
    } catch (e) {
        return apiError(c, e, "Failed to get Profit & Loss");
    }
});

/**
 * GET /reports/stock-value
 * Get current stock value report
 */
app.get("/stock-value", async (c) => {
    try {
        const data = await reportsService.getStockValueReport();
        return apiSuccess(c, data, "Stock value report retrieved successfully");
    } catch (e) {
        return apiError(c, e, "Failed to get stock value report");
    }
});

export default app;


