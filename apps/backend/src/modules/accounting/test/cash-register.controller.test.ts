import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { CashRegisterController } from "../controllers/cash-register.controller";
import { CashRegisterService } from "../services/cash-register.service";
import { RevenueTargetService } from "../services/revenue-target.service";
import { createMockContext } from "../../../../test/factories";

describe("CashRegisterController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("getCurrent should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(CashRegisterService as any, "getCurrentRegister").mockResolvedValue(null);
        expect((await CashRegisterController.getCurrent(ctx)).status).toBe(200);
    });

    it("getStatus should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(CashRegisterService as any, "getTodayProgress").mockResolvedValue({});
        vi.spyOn(RevenueTargetService as any, "getTodayProgress").mockResolvedValue({ dailyBreakeven: 100 });
        const res = await CashRegisterController.getStatus(ctx);
        expect(res.status).toBe(200);
    });

    it("open should return 201 on success", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "json").mockResolvedValue({ openingBalance: 100 });
        vi.spyOn(ctx, "get").mockReturnValue({ id: "user-1" });
        vi.spyOn(CashRegisterService as any, "open").mockResolvedValue("1");
        expect((await CashRegisterController.open(ctx)).status).toBe(201);
    });

    it("close should return 200 on success", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "json").mockResolvedValue({ actualClosing: 200 });
        vi.spyOn(ctx, "get").mockReturnValue({ id: "user-1" });
        vi.spyOn(CashRegisterService as any, "close").mockResolvedValue({});
        expect((await CashRegisterController.close(ctx)).status).toBe(200);
    });

    it("getHistory should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "query").mockReturnValue({});
        vi.spyOn(CashRegisterService as any, "getHistory").mockResolvedValue([]);
        expect((await CashRegisterController.getHistory(ctx)).status).toBe(200);
    });

    it("should return 500 on error for any method", async () => {
        const ctx = createMockContext();
        vi.spyOn(CashRegisterService as any, "getCurrentRegister").mockRejectedValue(new Error("Err"));
        expect((await CashRegisterController.getCurrent(ctx)).status).toBe(500);
    });
});
