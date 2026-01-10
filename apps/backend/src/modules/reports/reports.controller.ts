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

export default app;
