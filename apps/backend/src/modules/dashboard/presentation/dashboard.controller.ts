import { AppHonoContext } from "../../../shared/types/app-context";
import { dashboardFacade } from "../dashboard-container";
import { apiSuccess, apiError } from "../../../shared/application/middlewares/ResponseHelpers";

export class DashboardController {
    async getDashboardData(c: AppHonoContext) {
        try {
            const data = await dashboardFacade.getDashboardData();
            return apiSuccess(c, data, "Dashboard data retrieved");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve dashboard data", 500);
        }
    }

    async getRecentActivities(c: AppHonoContext) {
        try {
            const limitStr = c.req.query("limit");
            const limit = limitStr ? parseInt(limitStr) : 10;
            const data = await dashboardFacade.getRecentActivities(limit);
            return apiSuccess(c, data, "Recent activities retrieved");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve recent activities", 500);
        }
    }

    async getRecentServices(c: AppHonoContext) {
        try {
            const limitStr = c.req.query("limit");
            const limit = limitStr ? parseInt(limitStr) : 5;
            const data = await dashboardFacade.getRecentServices(limit);
            return apiSuccess(c, data, "Recent services retrieved");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve recent services", 500);
        }
    }

    async getUrgentServices(c: AppHonoContext) {
        try {
            const limitStr = c.req.query("limit");
            const limit = limitStr ? parseInt(limitStr) : 5;
            const data = await dashboardFacade.getUrgentServices(limit);
            return apiSuccess(c, data, "Urgent services retrieved");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve urgent services", 500);
        }
    }

    async getTechnicianDashboard(c: AppHonoContext) {
        try {
            const user = c.get("user");
            if (!user) return apiError(c, null, "Unauthorized", 401);
            const data = await dashboardFacade.getTechnicianDashboard(user.id);
            return apiSuccess(c, data, "Technician dashboard data retrieved");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve technician dashboard data", 500);
        }
    }

    async getCashierDashboard(c: AppHonoContext) {
        try {
            const data = await dashboardFacade.getCashierDashboard();
            return apiSuccess(c, data, "Cashier dashboard data retrieved");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve cashier dashboard data", 500);
        }
    }

    async getWarehouseDashboard(c: AppHonoContext) {
        try {
            const data = await dashboardFacade.getWarehouseDashboard();
            return apiSuccess(c, data, "Warehouse dashboard data retrieved");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve warehouse dashboard data", 500);
        }
    }

    async getProfitLoss(c: AppHonoContext) {
        try {
            const startDate = c.req.query("startDate");
            const endDate = c.req.query("endDate");
            const data = await dashboardFacade.getProfitLoss(startDate, endDate);
            return apiSuccess(c, data, "Profit & Loss data retrieved");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve profit & loss data", 500);
        }
    }
}
