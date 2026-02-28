import { IDashboardRepository } from "../../domain/repositories/dashboard.repository.port";
import { DBContext } from "../../../../../shared/types/db-context";

// We'll define a simple interface for the reports service to avoid direct dependency on the facade if possible,
// but for now, we'll assume the facade is passed in.
interface IReportsFacade {
    getSalesSummary(filters: any, dbOrTx?: any): Promise<any>;
    getServiceStats(filters: any, dbOrTx?: any): Promise<any>;
}

export class GetDashboardDataUseCase {
    constructor(
        private repository: IDashboardRepository,
        private reportsFacade: IReportsFacade
    ) { }

    async execute(dbOrTx?: DBContext) {
        // Time Ranges
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 86400000 - 1);

        // 1. Cards Data
        const salesStats = await this.reportsFacade.getSalesSummary({
            startDate: startOfDay.toISOString(),
            endDate: endOfDay.toISOString()
        }, dbOrTx);
        const serviceStats = await this.reportsFacade.getServiceStats({
            startDate: startOfDay.toISOString(),
            endDate: endOfDay.toISOString()
        }, dbOrTx);

        const totalRevenueToday = (salesStats?.totalRevenue || 0) + (serviceStats?.revenue || 0);

        const activeServices = await this.repository.getActiveServicesCount(dbOrTx);
        const readyPickup = await this.repository.getReadyPickupCount(dbOrTx);
        const lowStock = await this.repository.getLowStockCount(dbOrTx);
        const pendingVerifications = await this.repository.getPendingVerificationsCount(dbOrTx);

        // 2. Charts Data
        const topProducts = await this.repository.getTopProducts(10, dbOrTx);
        const revenueTrend = await this.getRevenueTrend7Days(dbOrTx);
        const procurementTasks = await this.repository.getProcurementTasks(5, dbOrTx);

        return {
            cards: {
                revenueToday: totalRevenueToday,
                activeServices,
                readyPickup,
                lowStock,
                pendingVerifications
            },
            charts: {
                revenueTrend,
                topProducts: (topProducts || []).map((p: any) => ({ name: p.name, value: p.sold }))
            },
            procurementTasks
        };
    }

    private async getRevenueTrend7Days(dbOrTx?: DBContext) {
        const result = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const startStr = d.toISOString().slice(0, 10);

            const sStart = new Date(d.setHours(0, 0, 0, 0)).toISOString();
            const sEnd = new Date(d.setHours(23, 59, 59, 999)).toISOString();

            const pSales = await this.reportsFacade.getSalesSummary({ startDate: sStart, endDate: sEnd }, dbOrTx);
            const pService = await this.reportsFacade.getServiceStats({ startDate: sStart, endDate: sEnd }, dbOrTx);

            result.push({
                date: startStr,
                revenue: (pSales?.totalRevenue || 0) + (pService?.revenue || 0)
            });
        }
        return result;
    }
}
