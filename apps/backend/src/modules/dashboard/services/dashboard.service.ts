import { ReportsService } from "../../reports/services/reports.service";
import { SettingsService } from "../../settings/services/settings.service";
import { JournalService } from "../../accounting/services/journal.service";
import { CashRegisterService } from "../../accounting/services/cash-register.service";
import { DashboardModel } from "../models/dashboard.model";

export class DashboardService {
    private reports: ReportsService;
    private settings: SettingsService;
    private model: DashboardModel;

    constructor() {
        this.reports = new ReportsService();
        this.settings = new SettingsService();
        this.model = new DashboardModel();
    }

    async getDashboardData(dbOrTx?: any) {
        // Time Ranges
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 86400000 - 1);

        // 1. Cards Data
        // Revenue Today
        const salesStats = await this.reports.getSalesSummary({
            startDate: startOfDay.toISOString(),
            endDate: endOfDay.toISOString()
        }, dbOrTx);
        const serviceStats = await this.reports.getServiceStats({
            startDate: startOfDay.toISOString(),
            endDate: endOfDay.toISOString()
        }, dbOrTx);

        const totalRevenueToday = (salesStats?.totalRevenue || 0) + (serviceStats?.revenue || 0);

        const activeServices = await this.model.getActiveServicesCount(dbOrTx);
        const readyPickup = await this.model.getReadyPickupCount(dbOrTx);
        const lowStock = await this.model.getLowStockCount(dbOrTx);
        const pendingVerifications = await this.model.getPendingVerificationsCount(dbOrTx);

        // 2. Charts Data
        const topProducts = await this.model.getTopProducts(dbOrTx);
        const revenueTrend = await this.getRevenueTrend7Days(dbOrTx);
        const procurementTasks = await this.model.getProcurementTasks(5, dbOrTx);

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

    async getRevenueTrend7Days(dbOrTx?: any) {
        const result = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const startStr = d.toISOString().slice(0, 10);

            const sStart = new Date(d.setHours(0, 0, 0, 0)).toISOString();
            const sEnd = new Date(d.setHours(23, 59, 59, 999)).toISOString();

            const pSales = await this.reports.getSalesSummary({ startDate: sStart, endDate: sEnd }, dbOrTx);
            const pService = await this.reports.getServiceStats({ startDate: sStart, endDate: sEnd }, dbOrTx);

            result.push({
                date: startStr,
                revenue: (pSales?.totalRevenue || 0) + (pService?.revenue || 0)
            });
        }
        return result;
    }

    async getRecentActivities(limit = 10, dbOrTx?: any) {
        return await this.model.getRecentActivities(limit, dbOrTx);
    }

    async getRecentServices(limit = 5, dbOrTx?: any) {
        return await this.model.getRecentServices(limit, dbOrTx);
    }

    async getUrgentServices(limit = 5, dbOrTx?: any) {
        return await this.model.getUrgentServices(limit, dbOrTx);
    }

    async getTechnicianDashboard(technicianId: string, dbOrTx?: any) {
        const myJobs = await this.model.getTechnicianJobs(technicianId, dbOrTx);
        const queue = await this.model.getTechnicianQueue(dbOrTx);

        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const stats = await this.model.getTechnicianStats(technicianId, startOfDay, dbOrTx);

        return {
            myJobs,
            queue,
            stats: {
                completedToday: stats.completedToday,
                inProgress: stats.inProgress,
                totalQueue: (queue || []).length
            }
        };
    }

    async getCashierDashboard(dbOrTx?: any) {
        // Today's pickups
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const stats = await this.model.getCashierStats(startOfDay, dbOrTx);

        return {
            readyPickup: stats.readyPickup,
            stats: {
                readyCount: (stats.readyPickup || []).length,
                pickedUpToday: stats.pickedUpToday,
                revenueToday: stats.revenueToday,
                pendingConfirm: stats.pendingConfirm
            }
        };
    }

    async getWarehouseDashboard(dbOrTx?: any) {
        const stats = await this.model.getWarehouseStats(dbOrTx);
        const lowStockProducts = await this.model.getLowStockProducts(10, dbOrTx);
        const incomingOrders = await this.model.getIncomingOrders(5, dbOrTx);

        return {
            stats: {
                totalProducts: stats.totalProducts,
                lowStockCount: stats.lowStock,
                pendingPurchasesCount: stats.pendingPurchases
            },
            lowStockProducts: (lowStockProducts || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                stock: p.stock,
                minStock: p.minStock
            })),
            incomingOrders: incomingOrders || []
        };
    }

    async getProfitAndLoss(startDate?: string, endDate?: string, dbOrTx?: any) {
        const settings = await this.settings.getServiceSettings(dbOrTx);
        const commissionModel = settings?.commissionModel || 'completion';
        return await this.reports.getProfitAndLoss({ startDate, endDate, commissionModel }, dbOrTx);
    }
}
