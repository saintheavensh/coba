import { AppHonoContext } from "../../../shared/types/app-context";
import { reportsService, ReportsService } from "../reports-container";
import { apiSuccess, apiError } from "../../../shared/application/middlewares/ResponseHelpers";

export class ReportsController {
    constructor(
        private readonly service: ReportsService = reportsService
    ) { }

    async getSummary(c: AppHonoContext) {
        try {
            const { startDate, endDate } = c.req.query();
            const summary = await this.service.getSalesSummary({ startDate, endDate });
            return apiSuccess(c, summary, "Sales summary retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve sales summary");
        }
    }

    async getTransactions(c: AppHonoContext) {
        try {
            const { startDate, endDate } = c.req.query();
            const transactions = await this.service.getTransactions({ startDate, endDate });
            return apiSuccess(c, transactions, "Transactions retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve transactions");
        }
    }

    async getServiceStats(c: AppHonoContext) {
        try {
            const { startDate, endDate } = c.req.query();
            const stats = await this.service.getServiceStats({ startDate, endDate });
            return apiSuccess(c, stats, "Service stats retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve service stats");
        }
    }

    async getServiceTransactions(c: AppHonoContext) {
        try {
            const { startDate, endDate } = c.req.query();
            const transactions = await this.service.getServiceTransactions({ startDate, endDate });
            return apiSuccess(c, transactions, "Service transactions retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve service transactions");
        }
    }

    async getPurchasesSummary(c: AppHonoContext) {
        try {
            const { startDate, endDate } = c.req.query();
            const summary = await this.service.getPurchasesSummary({ startDate, endDate });
            return apiSuccess(c, summary, "Purchases summary retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve purchases summary");
        }
    }

    async getPurchaseTransactions(c: AppHonoContext) {
        try {
            const { startDate, endDate } = c.req.query();
            const transactions = await this.service.getPurchaseTransactions({ startDate, endDate });
            return apiSuccess(c, transactions, "Purchase transactions retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve purchase transactions");
        }
    }

    async getTechnicianStats(c: AppHonoContext) {
        try {
            const { startDate, endDate } = c.req.query();
            const stats = await this.service.getTechnicianStats({ startDate, endDate });
            return apiSuccess(c, stats, "Technician stats retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve technician stats");
        }
    }

    async getPartsUsageReport(c: AppHonoContext) {
        try {
            const { startDate, endDate } = c.req.query();
            const report = await this.service.getPartsUsageReport({ startDate, endDate });
            return apiSuccess(c, report, "Parts usage report retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve parts usage report");
        }
    }

    async getActivityLogs(c: AppHonoContext) {
        try {
            const { startDate, endDate, userId, action, entityType, limit } = c.req.query();
            const logs = await this.service.getActivityLogs({
                startDate,
                endDate,
                userId,
                action,
                entityType,
                limit: limit ? parseInt(limit) : undefined
            });
            return apiSuccess(c, logs, "Activity logs retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve activity logs");
        }
    }

    async getProfitAndLoss(c: AppHonoContext) {
        try {
            const { startDate, endDate, commissionModel } = c.req.query();
            const data = await this.service.getProfitAndLoss({
                startDate,
                endDate,
                commissionModel: commissionModel as any
            });
            return apiSuccess(c, data, "Profit and loss report retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve profit and loss report");
        }
    }

    async getStockValueReport(c: AppHonoContext) {
        try {
            const data = await this.service.getStockValueReport();
            return apiSuccess(c, data, "Stock value report retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve stock value report");
        }
    }

    async getStockAdjustments(c: AppHonoContext) {
        try {
            const data = await this.service.getStockAdjustments();
            return apiSuccess(c, data, "Stock adjustments retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve stock adjustments");
        }
    }

    async getKasirDailyReport(c: AppHonoContext) {
        try {
            const { startDate, endDate } = c.req.query();
            const data = await this.service.getKasirDailyReport({ startDate, endDate });
            return apiSuccess(c, data, "Daily cashier report retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve daily cashier report");
        }
    }

    async getLowStockReport(c: AppHonoContext) {
        try {
            const { threshold } = c.req.query();
            const data = await this.service.getLowStockReport(threshold ? parseInt(threshold) : undefined);
            return apiSuccess(c, data, "Low stock report retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve low stock report");
        }
    }
}
