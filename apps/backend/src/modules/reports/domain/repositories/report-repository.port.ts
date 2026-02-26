import { DBContext } from "../../../../shared/types/db-context";

export interface IReportRepository {
    getSalesData(conditions: any[], dbOrTx?: DBContext): Promise<any[]>;
    getTransactions(conditions: any[], dbOrTx?: DBContext): Promise<any[]>;
    getServices(conditions: any[], dbOrTx?: DBContext): Promise<any[]>;
    getServiceTransactions(conditions: any[], dbOrTx?: DBContext): Promise<any[]>;
    getPurchases(conditions: any[], dbOrTx?: DBContext): Promise<any[]>;
    getTechnicians(dbOrTx?: DBContext): Promise<any[]>;
    getServicesWithTechnicians(conditions: any[], dbOrTx?: DBContext): Promise<any[]>;
    getActivityLogs(conditions: any[], limit?: number, dbOrTx?: DBContext): Promise<any[]>;
    getOperationalCosts(conditions: any[], dbOrTx?: DBContext): Promise<any[]>;
    getCategoriesWithStock(dbOrTx?: DBContext): Promise<any[]>;
    getLowStockItems(threshold: number, dbOrTx?: DBContext): Promise<any[]>;
    getSalesPayments(conditions: any[], dbOrTx?: DBContext): Promise<any[]>;
}
