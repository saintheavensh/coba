import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { BrandsController } from "../controllers/brands.controller";
import { BrandsService } from "../services/brands.service";
import { createMockContext } from "../../../../test/factories";

describe("BrandsController", () => {
    // Spies - BrandsService methods are static
    let getAllSpy: any;
    let createSpy: any;
    let updateSpy: any;
    let deleteSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();

        getAllSpy = vi.spyOn(BrandsService, "getAll").mockResolvedValue([]);
        createSpy = vi.spyOn(BrandsService, "create").mockResolvedValue([{ id: "apple", name: "Apple" }] as any);
        updateSpy = vi.spyOn(BrandsService, "update").mockResolvedValue([{ id: "apple", name: "Apple Updated" }] as any);
        deleteSpy = vi.spyOn(BrandsService, "delete").mockResolvedValue([{ id: "apple" }] as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("getAll", () => {
        it("should return 200 and list", async () => {
            const ctx = createMockContext();
            const res = await BrandsController.getAll(ctx);
            expect(res.status).toBe(200);
        });

        it("should return 500 on error", async () => {
            const ctx = createMockContext();
            getAllSpy.mockRejectedValue(new Error("Err"));
            const res = await BrandsController.getAll(ctx);
            expect(res.status).toBe(500);
        });
    });

    describe("create", () => {
        it("should return 201 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "json").mockResolvedValue({ name: "Apple", id: "apple" });
            (ctx.req as any).valid = vi.fn().mockReturnValue({ name: "Apple", id: "apple" });
            const res = await BrandsController.create(ctx);
            expect(res.status).toBe(201);
        });

        it("should return 409 on duplicate key", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "json").mockResolvedValue({ name: "Apple", id: "apple" });
            (ctx.req as any).valid = vi.fn().mockReturnValue({ name: "Apple", id: "apple" });
            createSpy.mockRejectedValue({ code: '23505' });
            const res = await BrandsController.create(ctx);
            expect(res.status).toBe(409);
        });

        it("should return 500 on error", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "json").mockResolvedValue({ name: "Apple" });
            (ctx.req as any).valid = vi.fn().mockReturnValue({ name: "Apple" });
            createSpy.mockRejectedValue(new Error("Err"));
            const res = await BrandsController.create(ctx);
            expect(res.status).toBe(500);
        });
    });

    describe("update", () => {
        it("should return 200 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("apple");
            (ctx.req as any).valid = vi.fn().mockReturnValue({ name: "Apple Updated" });
            const res = await BrandsController.update(ctx);
            expect(res.status).toBe(200);
        });

        it("should return 404 if not found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("apple");
            (ctx.req as any).valid = vi.fn().mockReturnValue({ name: "Apple Updated" });
            updateSpy.mockResolvedValue([]);
            const res = await BrandsController.update(ctx);
            expect(res.status).toBe(404);
        });
    });

    describe("delete", () => {
        it("should return 200 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("apple");
            const res = await BrandsController.delete(ctx);
            expect(res.status).toBe(200);
        });

        it("should return 404 if not found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("apple");
            deleteSpy.mockResolvedValue([]);
            const res = await BrandsController.delete(ctx);
            expect(res.status).toBe(404);
        });

        it("should return 500 on error", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("apple");
            deleteSpy.mockRejectedValue(new Error("Err"));
            const res = await BrandsController.delete(ctx);
            expect(res.status).toBe(500);
        });
    });
});
