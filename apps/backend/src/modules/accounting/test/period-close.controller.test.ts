import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { PeriodCloseController } from "../controllers/period-close.controller";
import { PeriodCloseService } from "../services/period-close.service";
import { createMockContext } from "../../../../test/factories";

describe("PeriodCloseController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("getAll should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(PeriodCloseService as any, "getAllPeriods").mockResolvedValue([]);
        expect((await PeriodCloseController.getAll(ctx)).status).toBe(200);
    });

    it("getSummary should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("2024-01");
        vi.spyOn(PeriodCloseService as any, "getPeriodSummary").mockResolvedValue({});
        expect((await PeriodCloseController.getSummary(ctx)).status).toBe(200);
    });

    it("close should return 200 on success", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("2024-01");
        vi.spyOn(ctx, "get").mockReturnValue({ id: "user-1" });
        vi.spyOn(PeriodCloseService as any, "closePeriod").mockResolvedValue({});
        expect((await PeriodCloseController.close(ctx)).status).toBe(200);
    });

    it("reopen should return 200 on success", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("2024-01");
        vi.spyOn(ctx.req, "json").mockResolvedValue({ reason: "mistake" });
        vi.spyOn(ctx, "get").mockReturnValue({ id: "user-1" });
        vi.spyOn(PeriodCloseService as any, "reopenPeriod").mockResolvedValue({});
        expect((await PeriodCloseController.reopen(ctx)).status).toBe(200);
    });

    it("any error should return 500", async () => {
        const ctx = createMockContext();
        vi.spyOn(PeriodCloseService as any, "getAllPeriods").mockRejectedValue(new Error("Err"));
        expect((await PeriodCloseController.getAll(ctx)).status).toBe(500);
    });
});
