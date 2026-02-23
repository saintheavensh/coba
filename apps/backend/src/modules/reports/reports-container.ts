import { db } from "../../db";
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
    GetStockValueReportUseCase
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
}

/** Singleton instance */
export const reportsService = new ReportsService();
