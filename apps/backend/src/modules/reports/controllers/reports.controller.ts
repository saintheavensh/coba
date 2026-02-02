import { Context } from "hono";
import { ReportsService } from "../services/reports.service";
import { apiSuccess, apiError } from "../../../lib/response";

const service = new ReportsService();

export class ReportsController {
    static async getSummary(c: Context) {
        try {
            const { startDate, endDate } = c.req.query();
            const summary = await service.getSalesSummary({ startDate, endDate });
            return apiSuccess(c, summary);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async getTransactions(c: Context) {
        try {
            const { startDate, endDate } = c.req.query();
            const transactions = await service.getTransactions({ startDate, endDate });
            return apiSuccess(c, transactions);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async getServiceStats(c: Context) {
        try {
            const { startDate, endDate } = c.req.query();
            const stats = await service.getServiceStats({ startDate, endDate });
            return apiSuccess(c, stats);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async getServiceTransactions(c: Context) {
        try {
            const { startDate, endDate } = c.req.query();
            const transactions = await service.getServiceTransactions({ startDate, endDate });
            return apiSuccess(c, transactions);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async getPurchasesSummary(c: Context) {
        try {
            const { startDate, endDate } = c.req.query();
            const summary = await service.getPurchasesSummary({ startDate, endDate });
            return apiSuccess(c, summary);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async getPurchaseTransactions(c: Context) {
        try {
            const { startDate, endDate } = c.req.query();
            const transactions = await service.getPurchaseTransactions({ startDate, endDate });
            return apiSuccess(c, transactions);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async getTechnicianStats(c: Context) {
        try {
            const { startDate, endDate } = c.req.query();
            const stats = await service.getTechnicianStats({ startDate, endDate });
            return apiSuccess(c, stats);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async getPartsUsageReport(c: Context) {
        try {
            const { startDate, endDate } = c.req.query();
            const report = await service.getPartsUsageReport({ startDate, endDate });
            return apiSuccess(c, report);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async getActivityLogs(c: Context) {
        try {
            const { startDate, endDate, userId, action, entityType, limit } = c.req.query();
            const logs = await service.getActivityLogs({
                startDate,
                endDate,
                userId,
                action,
                entityType,
                limit: limit ? parseInt(limit) : undefined
            });
            return apiSuccess(c, logs);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async getProfitAndLoss(c: Context) {
        try {
            const { startDate, endDate, commissionModel } = c.req.query();
            const data = await service.getProfitAndLoss({
                startDate,
                endDate,
                commissionModel: commissionModel as any
            });
            return apiSuccess(c, data);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async getStockValueReport(c: Context) {
        try {
            const data = await service.getStockValueReport();
            return apiSuccess(c, data);
        } catch (e: any) {
            return apiError(c, e);
        }
    }
}
