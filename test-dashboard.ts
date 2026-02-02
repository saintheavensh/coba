
import { RevenueTargetService } from "./apps/backend/src/modules/accounting/services/revenue-target.service";
import { CashRegisterService } from "./apps/backend/src/modules/accounting/services/cash-register.service";
import { AccountsService } from "./apps/backend/src/modules/accounting/services/accounts.service";

async function test() {
    console.log("Testing RevenueTargetService.getTodayProgress()...");
    try {
        const res = await RevenueTargetService.getTodayProgress();
        console.log("RevenueTarget result:", JSON.stringify(res));
    } catch (e) {
        console.error("RevenueTarget error:", e);
    }

    console.log("Testing CashRegisterService.getTodayProgress()...");
    try {
        const res = await CashRegisterService.getTodayProgress();
        console.log("CashRegister result:", JSON.stringify(res));
    } catch (e) {
        console.error("CashRegister error:", e);
    }

    console.log("Testing AccountsService.getBalanceSummary()...");
    try {
        const res = await AccountsService.getBalanceSummary();
        console.log("Accounts result:", JSON.stringify(res));
    } catch (e) {
        console.error("Accounts error:", e);
    }

    process.exit(0);
}

test();
