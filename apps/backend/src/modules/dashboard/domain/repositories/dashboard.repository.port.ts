import { DBContext } from "../../../../shared/types/db-context";
import {
    RecentActivityDTO,
    DashboardServiceTicketDTO,
    CashierDashboardStatsDTO,
    WarehouseDashboardStatsDTO,
    DashboardTopProductDTO,
    DashboardPurchaseDTO,
    DashboardProductDTO
} from "../../../../shared/dtos/repositories/dashboard";

export interface IDashboardRepository {
    getActiveServicesCount(dbOrTx?: DBContext): Promise<number>;
    getReadyPickupCount(dbOrTx?: DBContext): Promise<number>;
    getLowStockCount(dbOrTx?: DBContext): Promise<number>;
    getPendingVerificationsCount(dbOrTx?: DBContext): Promise<number>;
    getTopProducts(limit: number, dbOrTx?: DBContext): Promise<DashboardTopProductDTO[]>;
    getRecentActivities(limit: number, dbOrTx?: DBContext): Promise<RecentActivityDTO[]>;
    getRecentServices(limit: number, dbOrTx?: DBContext): Promise<DashboardServiceTicketDTO[]>;
    getUrgentServices(limit: number, dbOrTx?: DBContext): Promise<DashboardServiceTicketDTO[]>;
    getTechnicianJobs(technicianId: string, dbOrTx?: DBContext): Promise<DashboardServiceTicketDTO[]>;
    getTechnicianQueue(limit: number, dbOrTx?: DBContext): Promise<DashboardServiceTicketDTO[]>;
    getTechnicianStats(technicianId: string, startOfDay: Date, dbOrTx?: DBContext): Promise<{ completedToday: number; inProgress: number }>;
    getCashierStats(startOfDay: Date, dbOrTx?: DBContext): Promise<CashierDashboardStatsDTO>;
    getWarehouseStats(dbOrTx?: DBContext): Promise<WarehouseDashboardStatsDTO>;
    getIncomingOrders(limit: number, dbOrTx?: DBContext): Promise<DashboardPurchaseDTO[]>;
    getLowStockProducts(limit: number, dbOrTx?: DBContext): Promise<DashboardProductDTO[]>;
    getProcurementTasks(limit: number, dbOrTx?: DBContext): Promise<DashboardPurchaseDTO[]>;
}
