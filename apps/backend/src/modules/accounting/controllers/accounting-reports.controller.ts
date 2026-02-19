import { Context } from "hono";
import { AccountingReportService } from "../services/accounting-reports.service";

export class AccountingReportsController {

    static async getGeneralLedger(c: Context) {
        const accountId = c.req.query("accountId");
        const startDate = c.req.query("startDate") ? new Date(c.req.query("startDate")!) : undefined;
        const endDate = c.req.query("endDate") ? new Date(c.req.query("endDate")!) : undefined;

        if (!accountId) {
            return c.json({ error: "accountId is required" }, 400);
        }

        const data = await AccountingReportService.getGeneralLedger(accountId, startDate, endDate);
        return c.json(data);
    }

    static async getIncomeStatement(c: Context) {
        // Default to current month if not provided
        const now = new Date();
        const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const startDate = c.req.query("startDate") ? new Date(c.req.query("startDate")!) : defaultStart;
        const endDate = c.req.query("endDate") ? new Date(c.req.query("endDate")!) : defaultEnd;

        const data = await AccountingReportService.getIncomeStatement(startDate, endDate);
        return c.json(data);
    }

    static async getBalanceSheet(c: Context) {
        const asOfDate = c.req.query("date") ? new Date(c.req.query("date")!) : new Date();
        const data = await AccountingReportService.getBalanceSheet(asOfDate);
        return c.json(data);
    }
}
