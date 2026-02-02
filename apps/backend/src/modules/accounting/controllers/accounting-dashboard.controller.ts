import { Context } from "hono";
import { RevenueTargetService } from "../services/revenue-target.service";
import { CashRegisterService } from "../services/cash-register.service";
import { AccountsService } from "../services/accounts.service";

export class AccountingDashboardController {
    static async getDashboard(c: Context) {
        const [todayProgress, registerStatus, balanceSummary] = await Promise.all([
            RevenueTargetService.getTodayProgress(),
            CashRegisterService.getTodayProgress(),
            AccountsService.getBalanceSummary(),
        ]);

        return c.json({
            todayProgress,
            registerStatus,
            balanceSummary,
        });
    }
}
