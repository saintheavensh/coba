import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { AccountingDashboardController } from "../controllers/accounting-dashboard.controller";
import { RevenueTargetService } from "../services/revenue-target.service";
import { CashRegisterService } from "../services/cash-register.service";
import { AccountsService } from "../services/accounts.service";
import { createMockContext } from "../../../../test/factories";

describe("AccountingDashboardController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("getDashboard should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(RevenueTargetService as any, "getTodayProgress").mockResolvedValue({});
        vi.spyOn(CashRegisterService as any, "getTodayProgress").mockResolvedValue({});
        vi.spyOn(AccountsService as any, "getBalanceSummary").mockResolvedValue({});

        const res = await AccountingDashboardController.getDashboard(ctx);
        expect(res.status).toBe(200);
    });
});
