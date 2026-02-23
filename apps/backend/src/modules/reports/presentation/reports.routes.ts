import { Hono } from "hono";
import { ReportsController } from "./reports.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/permission.middleware";

const app = new Hono();
const controller = new ReportsController();

app.use("*", authMiddleware);
app.use("*", requirePermission("report.read", "analytics.view"));

app.get("/summary", (c) => controller.getSummary(c));
app.get("/transactions", (c) => controller.getTransactions(c));
app.get("/services", (c) => controller.getServiceStats(c));
app.get("/services/transactions", (c) => controller.getServiceTransactions(c));
app.get("/purchases/summary", (c) => controller.getPurchasesSummary(c));
app.get("/purchases/transactions", (c) => controller.getPurchaseTransactions(c));
app.get("/technicians", (c) => controller.getTechnicianStats(c));
app.get("/parts", (c) => controller.getPartsUsageReport(c));
app.get("/logs", (c) => controller.getActivityLogs(c));
app.get("/profit-loss", (c) => controller.getProfitAndLoss(c));
app.get("/stock-value", (c) => controller.getStockValueReport(c));

export default app;
