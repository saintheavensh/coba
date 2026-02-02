import { Context } from "hono";
import { DashboardService } from "../services/dashboard.service";
import { apiSuccess, apiError } from "../../../lib/response";

const dashboard = new DashboardService();

export class DashboardController {
    static async getDashboardData(c: Context) {
        try {
            const data = await dashboard.getDashboardData();
            return apiSuccess(c, data, "Dashboard data retrieved");
        } catch (e: any) {
            return apiError(c, String(e));
        }
    }

    static async getRecentActivities(c: Context) {
        const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 10;
        try {
            const data = await dashboard.getRecentActivities(limit);
            return apiSuccess(c, data, "Recent activities retrieved");
        } catch (e: any) {
            return apiError(c, String(e));
        }
    }

    static async getRecentServices(c: Context) {
        const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 5;
        try {
            const data = await dashboard.getRecentServices(limit);
            return apiSuccess(c, data, "Recent services retrieved");
        } catch (e: any) {
            return apiError(c, String(e));
        }
    }

    static async getUrgentServices(c: Context) {
        const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 5;
        try {
            const data = await dashboard.getUrgentServices(limit);
            return apiSuccess(c, data, "Urgent services retrieved");
        } catch (e: any) {
            return apiError(c, String(e));
        }
    }

    static async getTechnicianDashboard(c: Context) {
        try {
            const user = (c.get as (key: string) => any)("user");
            const data = await dashboard.getTechnicianDashboard(user.id);
            return apiSuccess(c, data, "Technician dashboard data retrieved");
        } catch (e: any) {
            return apiError(c, String(e));
        }
    }

    static async getCashierDashboard(c: Context) {
        try {
            const data = await dashboard.getCashierDashboard();
            return apiSuccess(c, data, "Cashier dashboard data retrieved");
        } catch (e: any) {
            return apiError(c, String(e));
        }
    }

    static async getProfitLoss(c: Context) {
        const startDate = c.req.query("startDate");
        const endDate = c.req.query("endDate");
        try {
            const data = await dashboard.getProfitAndLoss(startDate, endDate);
            return apiSuccess(c, data, "Profit & Loss data retrieved");
        } catch (e: any) {
            return apiError(c, String(e));
        }
    }
}
