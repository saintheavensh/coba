import { db } from "../../../shared/infrastructure/database/client";
import { ReportRepositoryAdapter } from "./infrastructure";
import {
    GetSalesSummaryUseCase,
    GetTransactionsUseCase,
    GetServiceStatsUseCase,
    GetServiceTransactionsUseCase,
    GetPurchasesSummaryUseCase,
    GetPurchaseTransactionsUseCase,
    GetTechnicianStatsUseCase,
    GetPartsUsageReportUseCase,
    GetActivityLogsUseCase,
    GetProfitAndLossUseCase,
    GetStockValueReportUseCase,
    GetStockAdjustmentsUseCase,
    GetLowStockReportUseCase,
    GetKasirDailyReportUseCase
} from "./application";

// Adapters
const repository = new ReportRepositoryAdapter();

// Use Cases
const getSalesSummaryUC = new GetSalesSummaryUseCase(repository);
const getTransactionsUC = new GetTransactionsUseCase(repository);
const getServiceStatsUC = new GetServiceStatsUseCase(repository);
const getServiceTransactionsUC = new GetServiceTransactionsUseCase(repository);
const getPurchasesSummaryUC = new GetPurchasesSummaryUseCase(repository);
const getPurchaseTransactionsUC = new GetPurchaseTransactionsUseCase(repository);
const getTechnicianStatsUC = new GetTechnicianStatsUseCase(repository);
const getPartsUsageReportUC = new GetPartsUsageReportUseCase(repository);
const getActivityLogsUC = new GetActivityLogsUseCase(repository);
const getProfitAndLossUC = new GetProfitAndLossUseCase(repository);
const getStockValueReportUC = new GetStockValueReportUseCase(repository);
const getStockAdjustmentsUC = new GetStockAdjustmentsUseCase(repository);
const getLowStockReportUC = new GetLowStockReportUseCase(repository);
const getKasirDailyReportUC = new GetKasirDailyReportUseCase(repository);

/**
 * ReportsService — Facade for external and presentation layers.
 */
export class ReportsService {
    async getSalesSummary(filters: any) {
        return await getSalesSummaryUC.execute(filters);
    }

    async getTransactions(filters: any) {
        return await getTransactionsUC.execute(filters);
    }

    async getServiceStats(filters: any) {
        return await getServiceStatsUC.execute(filters);
    }

    async getServiceTransactions(filters: any) {
        return await getServiceTransactionsUC.execute(filters);
    }

    async getPurchasesSummary(filters: any) {
        return await getPurchasesSummaryUC.execute(filters);
    }

    async getPurchaseTransactions(filters: any) {
        return await getPurchaseTransactionsUC.execute(filters);
    }

    async getTechnicianStats(filters: any) {
        return await getTechnicianStatsUC.execute(filters);
    }

    async getPartsUsageReport(filters: any) {
        return await getPartsUsageReportUC.execute(filters);
    }

    async getActivityLogs(filters: any) {
        return await getActivityLogsUC.execute(filters);
    }

    async getProfitAndLoss(filters: any) {
        return await getProfitAndLossUC.execute(filters);
    }

    async getStockValueReport() {
        return await getStockValueReportUC.execute();
    }

    async getStockAdjustments() {
        return await getStockAdjustmentsUC.execute();
    }

    async getLowStockReport(threshold?: number) {
        return await getLowStockReportUC.execute(threshold);
    }

    async getKasirDailyReport(filters: any) {
        return await getKasirDailyReportUC.execute(filters);
    }
}

/** Singleton instance */
export const reportsService = new ReportsService();
