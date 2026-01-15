
import { Hono } from "hono";
import { DashboardService } from "./dashboard.service";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { apiSuccess, apiError } from "../../lib/response";

const app = new Hono();
const dashboard = new DashboardService();

app.use("*", authMiddleware);

app.get("/", async (c) => {
    try {
        const data = await dashboard.getDashboardData();
        return apiSuccess(c, data, "Dashboard data retrieved");
    } catch (e) {
        return apiError(c, String(e));
    }
});

app.get("/activities", async (c) => {
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 10;
    try {
        const data = await dashboard.getRecentActivities(limit);
        return apiSuccess(c, data, "Recent activities retrieved");
    } catch (e) {
        return apiError(c, String(e));
    }
});

app.get("/recent-services", async (c) => {
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 5;
    try {
        const data = await dashboard.getRecentServices(limit);
        return apiSuccess(c, data, "Recent services retrieved");
    } catch (e) {
        return apiError(c, String(e));
    }
});

app.get("/urgent-services", async (c) => {
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 5;
    try {
        const data = await dashboard.getUrgentServices(limit);
        return apiSuccess(c, data, "Urgent services retrieved");
    } catch (e) {
        return apiError(c, String(e));
    }
});

export default app;
