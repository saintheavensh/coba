import { Hono } from "hono";
import { AppVariables } from "../../../shared/types/app-context";
import { DashboardController } from "./dashboard.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const dashboard = new Hono<{ Variables: AppVariables }>();
const controller = new DashboardController();

dashboard.use("*", authMiddleware);

dashboard.get("/", (c) => controller.getDashboardData(c));
dashboard.get("/activities", (c) => controller.getRecentActivities(c));
dashboard.get("/recent-services", (c) => controller.getRecentServices(c));
dashboard.get("/urgent-services", (c) => controller.getUrgentServices(c));
dashboard.get("/technician", (c) => controller.getTechnicianDashboard(c));
dashboard.get("/cashier", (c) => controller.getCashierDashboard(c));
dashboard.get("/warehouse", (c) => controller.getWarehouseDashboard(c));
dashboard.get("/profit-loss", (c) => controller.getProfitLoss(c));

export default dashboard;
