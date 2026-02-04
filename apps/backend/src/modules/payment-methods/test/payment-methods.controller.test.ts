import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { PaymentMethodsController } from "../controllers/payment-methods.controller";
import { PaymentMethodsService } from "../services/payment-methods.service";
import { createMockContext } from "../../../../test/factories";

describe("PaymentMethodsController", () => {
    // Spies - PaymentMethodsService used via instance at top level of controller file
    let getAllSpy: any;
    let getEnabledSpy: any;
    let createSpy: any;
    let updateSpy: any;
    let disableSpy: any;
    let addVariantSpy: any;
    let updateVariantSpy: any;
    let disableVariantSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();

        getAllSpy = vi.spyOn(PaymentMethodsService.prototype, "getAll").mockResolvedValue([]);
        getEnabledSpy = vi.spyOn(PaymentMethodsService.prototype, "getEnabled").mockResolvedValue([]);
        createSpy = vi.spyOn(PaymentMethodsService.prototype, "create").mockResolvedValue({ id: "pm1" } as any);
        updateSpy = vi.spyOn(PaymentMethodsService.prototype, "update").mockResolvedValue({ id: "pm1" } as any);
        disableSpy = vi.spyOn(PaymentMethodsService.prototype, "disable").mockResolvedValue({ id: "pm1" } as any);
        addVariantSpy = vi.spyOn(PaymentMethodsService.prototype, "addVariant").mockResolvedValue({ id: "v1" } as any);
        updateVariantSpy = vi.spyOn(PaymentMethodsService.prototype, "updateVariant").mockResolvedValue({ id: "v1" } as any);
        disableVariantSpy = vi.spyOn(PaymentMethodsService.prototype, "disableVariant").mockResolvedValue({ id: "v1" } as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("Payment Methods", () => {
        it("getAll should return 200", async () => {
            const ctx = createMockContext();
            const res = await PaymentMethodsController.getAll(ctx);
            expect(res.status).toBe(200);
        });

        it("getEnabled should return 200", async () => {
            const ctx = createMockContext();
            const res = await PaymentMethodsController.getEnabled(ctx);
            expect(res.status).toBe(200);
        });

        it("create should return 200", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "json").mockResolvedValue({ name: "Cash" });
            const res = await PaymentMethodsController.create(ctx);
            expect(res.status).toBe(200);
        });
    });

    describe("Variants", () => {
        it("addVariant should return 200", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("pm1");
            vi.spyOn(ctx.req, "json").mockResolvedValue({ name: "V1" });
            const res = await PaymentMethodsController.addVariant(ctx);
            expect(res.status).toBe(200);
        });

        it("updateVariant should return 200", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("v1");
            vi.spyOn(ctx.req, "json").mockResolvedValue({ name: "V1 Updated" });
            const res = await PaymentMethodsController.updateVariant(ctx);
            expect(res.status).toBe(200);
        });
    });
});
