import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { SalesController } from "../controllers/sales.controller";
import { SalesService } from "../services/sales.service";
import { createMockContext, createMockUser } from "../../../../test/factories";

describe("SalesController", () => {
    let controller: SalesController;

    // Spies
    let getAllSpy: any;
    let createSaleSpy: any;
    let getOneSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        getAllSpy = vi.spyOn(SalesService.prototype, "getAll").mockResolvedValue([]);
        createSaleSpy = vi.spyOn(SalesService.prototype, "createSale").mockResolvedValue({ id: "S1" } as any);
        getOneSpy = vi.spyOn(SalesService.prototype, "getOne").mockResolvedValue(null);
        controller = new SalesController();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const mockAuth = (ctx: any) => {
        vi.spyOn(ctx, "get").mockReturnValue(createMockUser());
    };

    describe("General", () => {
        it("getAll should return 200", async () => {
            const ctx = createMockContext();
            expect((await controller.getAll(ctx)).status).toBe(200);
        });
        it("getAll 500 on error", async () => {
            const ctx = createMockContext();
            getAllSpy.mockRejectedValue(new Error("Err"));
            expect((await controller.getAll(ctx)).status).toBe(500);
        });
    });

    describe("CRUD", () => {
        it("getOne 200 if found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("1");
            getOneSpy.mockResolvedValue({ id: "1" });
            expect((await controller.getOne(ctx)).status).toBe(200);
        });
        it("getOne 404 if not found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("1");
            expect((await controller.getOne(ctx)).status).toBe(404);
        });
        it("createSale 201 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req as any, "valid").mockReturnValue({ items: [] });
            expect((await controller.createSale(ctx)).status).toBe(201);
        });
        it("createSale 400 on error", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req as any, "valid").mockReturnValue({ items: [] });
            createSaleSpy.mockRejectedValue(new Error("Err"));
            expect((await controller.createSale(ctx)).status).toBe(400);
        });
    });
});
