import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { CommissionPaymentController } from "../controllers/commission-payment.controller";
import { CommissionPaymentService } from "../services/commission-payment.service";
import { createMockContext } from "../../../../test/factories";

describe("CommissionPaymentController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("getPending should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("2024-01");
        vi.spyOn(CommissionPaymentService as any, "getPendingCommissions").mockResolvedValue([]);
        expect((await CommissionPaymentController.getPending(ctx)).status).toBe(200);
    });

    it("getSummary should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("2024-01");
        vi.spyOn(CommissionPaymentService as any, "getPeriodSummary").mockResolvedValue({});
        expect((await CommissionPaymentController.getSummary(ctx)).status).toBe(200);
    });

    it("getHistory should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "query").mockReturnValue({});
        vi.spyOn(CommissionPaymentService as any, "getPaymentHistory").mockResolvedValue([]);
        expect((await CommissionPaymentController.getHistory(ctx)).status).toBe(200);
    });

    it("pay should return 201 on success", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "json").mockResolvedValue({ technicianId: "t1" });
        vi.spyOn(ctx, "get").mockReturnValue({ id: "user-1" });
        vi.spyOn(CommissionPaymentService as any, "payCommission").mockResolvedValue("1");
        expect((await CommissionPaymentController.pay(ctx)).status).toBe(201);
    });

    it("any error should return 500", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("2024-01");
        vi.spyOn(CommissionPaymentService as any, "getPendingCommissions").mockRejectedValue(new Error("Err"));
        expect((await CommissionPaymentController.getPending(ctx)).status).toBe(500);
    });
});
