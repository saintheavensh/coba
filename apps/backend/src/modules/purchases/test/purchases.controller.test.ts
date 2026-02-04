import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { PurchasesController } from "../controllers/purchases.controller";
import { PurchasesService } from "../services/purchases.service";
import { createMockContext, createMockUser } from "../../../../test/factories";

describe("PurchasesController", () => {
    let controller: PurchasesController;

    // Spies
    let getAllSpy: any;
    let getByIdSpy: any;
    let createSpy: any;
    let deleteSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();

        getAllSpy = vi.spyOn(PurchasesService.prototype, "getAll").mockResolvedValue([]);
        getByIdSpy = vi.spyOn(PurchasesService.prototype, "getById").mockResolvedValue(null);
        createSpy = vi.spyOn(PurchasesService.prototype, "createPurchase").mockResolvedValue({} as any);
        deleteSpy = vi.spyOn(PurchasesService.prototype, "deletePurchase").mockResolvedValue({} as any);

        controller = new PurchasesController();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("getAll", () => {
        it("should return 200 and list", async () => {
            const ctx = createMockContext();
            const mockData = [{ id: "p-1" }];
            getAllSpy.mockResolvedValue(mockData);
            const res = await controller.getAll(ctx);
            expect(res.status).toBe(200);
            const json = await res.json() as any;
            expect(json.data).toEqual(mockData);
        });

        it("should return 500 on error", async () => {
            const ctx = createMockContext();
            getAllSpy.mockRejectedValue(new Error("Err"));
            const res = await controller.getAll(ctx);
            expect(res.status).toBe(500);
        });
    });

    describe("getById", () => {
        it("should return 200 and data if found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("p-1");
            getByIdSpy.mockResolvedValue({ id: "p-1" });
            const res = await controller.getById(ctx);
            expect(res.status).toBe(200);
        });

        it("should return 404 if not found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("p-1");
            getByIdSpy.mockResolvedValue(null);
            const res = await controller.getById(ctx);
            expect(res.status).toBe(404);
        });

        it("should return 500 on error", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("p-1");
            getByIdSpy.mockRejectedValue(new Error("Err"));
            const res = await controller.getById(ctx);
            expect(res.status).toBe(500);
        });
    });

    describe("createPurchase", () => {
        it("should return 201 on success", async () => {
            const ctx = createMockContext();
            const input = { supplierId: "s-1", items: [] };
            vi.spyOn(ctx.req as any, "valid").mockReturnValue(input);
            createSpy.mockResolvedValue({ id: "p-1" });
            const res = await controller.createPurchase(ctx);
            expect(res.status).toBe(201);
            expect(createSpy).toHaveBeenCalledWith(input);
        });

        it("should return 400 on error", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req as any, "valid").mockReturnValue({});
            createSpy.mockRejectedValue(new Error("Err"));
            const res = await controller.createPurchase(ctx);
            expect(res.status).toBe(400);
        });
    });

    describe("deletePurchase", () => {
        it("should return 200 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("p-1");
            const res = await controller.deletePurchase(ctx);
            expect(res.status).toBe(200);
        });

        it("should return 500 on error", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("p-1");
            deleteSpy.mockRejectedValue(new Error("Err"));
            const res = await controller.deletePurchase(ctx);
            expect(res.status).toBe(500);
        });
    });
});
