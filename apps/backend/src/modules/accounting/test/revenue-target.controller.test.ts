import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { RevenueTargetController } from "../controllers/revenue-target.controller";
import { RevenueTargetService } from "../services/revenue-target.service";
import { createMockContext } from "../../../../test/factories";

describe("RevenueTargetController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("getToday should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(RevenueTargetService as any, "getTodayProgress").mockResolvedValue({});
        expect((await RevenueTargetController.getToday(ctx)).status).toBe(200);
    });

    it("getMonth should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("2024-01");
        vi.spyOn(RevenueTargetService as any, "getMonthProgress").mockResolvedValue({});
        expect((await RevenueTargetController.getMonth(ctx)).status).toBe(200);
    });

    it("setTarget should return 200 on success", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("2024-01");
        vi.spyOn(ctx.req, "json").mockResolvedValue({ targetAmount: 1000 });
        vi.spyOn(ctx, "get").mockReturnValue({ id: "user-1" });
        vi.spyOn(RevenueTargetService as any, "calculateAndSet").mockResolvedValue({});
        expect((await RevenueTargetController.setTarget(ctx)).status).toBe(200);
    });

    it("any error should return 500", async () => {
        const ctx = createMockContext();
        vi.spyOn(RevenueTargetService as any, "getTodayProgress").mockRejectedValue(new Error("Err"));
        expect((await RevenueTargetController.getToday(ctx)).status).toBe(500);
    });
});
