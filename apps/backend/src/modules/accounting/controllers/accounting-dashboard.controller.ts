import { Context } from "hono";
import { RevenueTargetService } from "../services/revenue-target.service";
import { CashRegisterService } from "../services/cash-register.service";
import { AccountsService } from "../services/accounts.service";
import { AssetsService } from "../services/assets.service";

export class AccountingDashboardController {
    static async getDashboard(c: Context) {
        const [todayProgress, registerStatus, balanceSummary, assetCount] = await Promise.all([
            RevenueTargetService.getTodayProgress(),
            CashRegisterService.getTodayProgress(),
            AccountsService.getBalanceSummary(),
            AssetsService.countAll(),
        ]);

        const checklist = {
            hasOpeningBalance: balanceSummary.EQUITY.total !== 0,
            hasAssets: assetCount > 0,
            hasTarget: todayProgress.hasTarget,
            isRegisterOpen: registerStatus.isOpen,
        };

        return c.json({
            todayProgress,
            registerStatus,
            balanceSummary,
            checklist,
        });
    }
}
