import { DBContext } from "../../../../../shared/types/db-context";

export interface IDashboardRepository {
    getActiveServicesCount(dbOrTx?: DBContext): Promise<number>;
    getReadyPickupCount(dbOrTx?: DBContext): Promise<number>;
    getLowStockCount(dbOrTx?: DBContext): Promise<number>;
    getPendingVerificationsCount(dbOrTx?: DBContext): Promise<number>;
    getTopProducts(limit: number, dbOrTx?: DBContext): Promise<any[]>;
    getRecentActivities(limit: number, dbOrTx?: DBContext): Promise<any[]>;
    getRecentServices(limit: number, dbOrTx?: DBContext): Promise<any[]>;
    getUrgentServices(limit: number, dbOrTx?: DBContext): Promise<any[]>;
    getTechnicianJobs(technicianId: string, dbOrTx?: DBContext): Promise<any[]>;
    getTechnicianQueue(limit: number, dbOrTx?: DBContext): Promise<any[]>;
    getTechnicianStats(technicianId: string, startOfDay: Date, dbOrTx?: DBContext): Promise<{ completedToday: number; inProgress: number }>;
    getCashierStats(startOfDay: Date, dbOrTx?: DBContext): Promise<any>;
    getWarehouseStats(dbOrTx?: DBContext): Promise<any>;
    getIncomingOrders(limit: number, dbOrTx?: DBContext): Promise<any[]>;
    getLowStockProducts(limit: number, dbOrTx?: DBContext): Promise<any[]>;
    getProcurementTasks(limit: number, dbOrTx?: DBContext): Promise<any[]>;
}
