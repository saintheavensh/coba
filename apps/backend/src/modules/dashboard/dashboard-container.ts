import { DashboardRepositoryAdapter } from "./infrastructure";
import { reportsService } from "../reports/reports-container";
import { settingsService } from "../settings/settings-container";
import {
    GetDashboardDataUseCase,
    GetRecentActivitiesUseCase,
    GetRecentServicesUseCase,
    GetUrgentServicesUseCase,
    GetTechnicianDashboardUseCase,
    GetCashierDashboardUseCase,
    GetWarehouseDashboardUseCase,
    GetProfitLossUseCase
} from "./application";

// Adapters
const dashboardRepository = new DashboardRepositoryAdapter();

// Use Cases
const getDashboardDataUseCase = new GetDashboardDataUseCase(dashboardRepository, reportsService);
const getRecentActivitiesUseCase = new GetRecentActivitiesUseCase(dashboardRepository);
const getRecentServicesUseCase = new GetRecentServicesUseCase(dashboardRepository);
const getUrgentServicesUseCase = new GetUrgentServicesUseCase(dashboardRepository);
const getTechnicianDashboardUseCase = new GetTechnicianDashboardUseCase(dashboardRepository);
const getCashierDashboardUseCase = new GetCashierDashboardUseCase(dashboardRepository);
const getWarehouseDashboardUseCase = new GetWarehouseDashboardUseCase(dashboardRepository);
const getProfitLossUseCase = new GetProfitLossUseCase(settingsService, reportsService);

/**
 * DashboardFacade — Single entry point for the Dashboard module.
 * Wires internal use cases and provides a clean interface for external layers.
 */
export class DashboardFacade {
    async getDashboardData() {
        return await getDashboardDataUseCase.execute();
    }

    async getRecentActivities(limit: number) {
        return await getRecentActivitiesUseCase.execute(limit);
    }

    async getRecentServices(limit: number) {
        return await getRecentServicesUseCase.execute(limit);
    }

    async getUrgentServices(limit: number) {
        return await getUrgentServicesUseCase.execute(limit);
    }

    async getTechnicianDashboard(technicianId: string) {
        return await getTechnicianDashboardUseCase.execute(technicianId);
    }

    async getCashierDashboard() {
        return await getCashierDashboardUseCase.execute();
    }

    async getWarehouseDashboard() {
        return await getWarehouseDashboardUseCase.execute();
    }

    async getProfitLoss(startDate?: string, endDate?: string) {
        return await getProfitLossUseCase.execute(startDate, endDate);
    }
}

/** Singleton instance */
export const dashboardFacade = new DashboardFacade();
