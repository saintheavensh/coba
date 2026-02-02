import { Hono } from "hono";
import { DashboardController } from "../controllers/dashboard.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const dashboard = new Hono();

dashboard.use("*", authMiddleware);

dashboard.get("/", DashboardController.getDashboardData);
dashboard.get("/activities", DashboardController.getRecentActivities);
dashboard.get("/recent-services", DashboardController.getRecentServices);
dashboard.get("/urgent-services", DashboardController.getUrgentServices);
dashboard.get("/technician", DashboardController.getTechnicianDashboard);
dashboard.get("/cashier", DashboardController.getCashierDashboard);
dashboard.get("/profit-loss", DashboardController.getProfitLoss);

export default dashboard;
