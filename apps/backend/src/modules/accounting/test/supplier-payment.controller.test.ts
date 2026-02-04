import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { SupplierPaymentController } from "../controllers/supplier-payment.controller";
import { SupplierPaymentService } from "../services/supplier-payment.service";
import { createMockContext } from "../../../../test/factories";

describe("SupplierPaymentController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("getPayables should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(SupplierPaymentService as any, "getOutstandingPayables").mockResolvedValue([]);
        expect((await SupplierPaymentController.getPayables(ctx)).status).toBe(200);
    });

    it("getSummary should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(SupplierPaymentService as any, "getPayablesSummary").mockResolvedValue({});
        expect((await SupplierPaymentController.getSummary(ctx)).status).toBe(200);
    });

    it("pay should return 201 on success", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "json").mockResolvedValue({ purchaseId: "1" });
        vi.spyOn(ctx, "get").mockReturnValue({ id: "user-1" });
        vi.spyOn(SupplierPaymentService as any, "create").mockResolvedValue("1");
        expect((await SupplierPaymentController.pay(ctx)).status).toBe(201);
    });

    it("any error should return 500", async () => {
        const ctx = createMockContext();
        vi.spyOn(SupplierPaymentService as any, "getOutstandingPayables").mockRejectedValue(new Error("Err"));
        expect((await SupplierPaymentController.getPayables(ctx)).status).toBe(500);
    });
});
