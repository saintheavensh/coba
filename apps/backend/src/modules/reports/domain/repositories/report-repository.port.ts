import { DBContext } from "../../../../shared/types/db-context";
import {
    SaleReportDTO,
    PurchaseReportDTO,
    InventoryReportDTO,
    ReportServiceDTO,
    ReportServiceWithTechnicianDTO,
    ReportTechnicianDTO,
    ReportActivityLogDTO,
    ReportOperationalCostDTO,
    ReportLowStockDTO,
    ReportSalePaymentDTO
} from "../../../../shared/dtos/repositories/reports";

export interface IReportRepository {
    getSalesData(conditions: any[], dbOrTx?: DBContext): Promise<SaleReportDTO[]>;
    getTransactions(conditions: any[], dbOrTx?: DBContext): Promise<SaleReportDTO[]>;
    getServices(conditions: any[], dbOrTx?: DBContext): Promise<ReportServiceDTO[]>;
    getServiceTransactions(conditions: any[], dbOrTx?: DBContext): Promise<ReportServiceDTO[]>;
    getPurchases(conditions: any[], dbOrTx?: DBContext): Promise<PurchaseReportDTO[]>;
    getTechnicians(dbOrTx?: DBContext): Promise<ReportTechnicianDTO[]>;
    getServicesWithTechnicians(conditions: any[], dbOrTx?: DBContext): Promise<ReportServiceWithTechnicianDTO[]>;
    getActivityLogs(conditions: any[], limit?: number, dbOrTx?: DBContext): Promise<ReportActivityLogDTO[]>;
    getOperationalCosts(conditions: any[], dbOrTx?: DBContext): Promise<ReportOperationalCostDTO[]>;
    getCategoriesWithStock(dbOrTx?: DBContext): Promise<InventoryReportDTO[]>;
    getLowStockItems(threshold: number, dbOrTx?: DBContext): Promise<ReportLowStockDTO[]>;
    getSalesPayments(conditions: any[], dbOrTx?: DBContext): Promise<ReportSalePaymentDTO[]>;
}
