import { Hono } from "hono";
import { ReportsController } from "../controllers/reports.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const reports = new Hono();

reports.use("*", authMiddleware);

reports.get("/summary", ReportsController.getSummary);
reports.get("/transactions", ReportsController.getTransactions);
reports.get("/services", ReportsController.getServiceStats);
reports.get("/services/transactions", ReportsController.getServiceTransactions);
reports.get("/purchases/summary", ReportsController.getPurchasesSummary);
reports.get("/purchases/transactions", ReportsController.getPurchaseTransactions);
reports.get("/technicians", ReportsController.getTechnicianStats);
reports.get("/parts", ReportsController.getPartsUsageReport);
reports.get("/logs", ReportsController.getActivityLogs);
reports.get("/profit-loss", ReportsController.getProfitAndLoss);
reports.get("/stock-value", ReportsController.getStockValueReport);

export default reports;
