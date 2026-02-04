import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { UsersController } from "../controllers/users.controller";
import { UsersService } from "../services/users.service";
import { createMockContext } from "../../../../test/factories";

describe("UsersController", () => {
    let findAllSpy: any;
    let getByIdSpy: any;
    let createSpy: any;
    let updateSpy: any;
    let deleteSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        findAllSpy = vi.spyOn(UsersService.prototype, "findAll").mockResolvedValue([]);
        getByIdSpy = vi.spyOn(UsersService.prototype, "getById").mockResolvedValue(null);
        createSpy = vi.spyOn(UsersService.prototype, "create").mockResolvedValue({} as any);
        updateSpy = vi.spyOn(UsersService.prototype, "update").mockResolvedValue({} as any);
        deleteSpy = vi.spyOn(UsersService.prototype, "delete").mockResolvedValue({} as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("getAll", () => {
        it("should return 200 and list", async () => {
            const ctx = createMockContext();
            findAllSpy.mockResolvedValue([{ id: "u1" }]);
            const res = await UsersController.getAll(ctx);
            expect(res.status).toBe(200);
        });
        it("should return 500 on error", async () => {
            const ctx = createMockContext();
            findAllSpy.mockRejectedValue(new Error("Err"));
            const res = await UsersController.getAll(ctx);
            expect(res.status).toBe(500);
        });
    });

    describe("getById", () => {
        it("should return 200 if found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("u1");
            getByIdSpy.mockResolvedValue({ id: "u1" });
            const res = await UsersController.getById(ctx);
            expect(res.status).toBe(200);
        });
        it("should return 404 if not found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("u1");
            const res = await UsersController.getById(ctx);
            expect(res.status).toBe(404);
        });
        it("should return 500 on error", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("u1");
            getByIdSpy.mockRejectedValue(new Error("Err"));
            const res = await UsersController.getById(ctx);
            expect(res.status).toBe(500);
        });
    });

    describe("create", () => {
        it("should return 201 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "json").mockResolvedValue({ username: "u" });
            const res = await UsersController.create(ctx);
            expect(res.status).toBe(201);
        });
        it("should return 500 on error", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "json").mockResolvedValue({ username: "u" });
            createSpy.mockRejectedValue(new Error("Err"));
            const res = await UsersController.create(ctx);
            expect(res.status).toBe(500);
        });
    });

    describe("update", () => {
        it("should return 200 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("u1");
            vi.spyOn(ctx.req, "json").mockResolvedValue({ name: "U" });
            const res = await UsersController.update(ctx);
            expect(res.status).toBe(200);
        });
        it("should return 500 on error", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("u1");
            vi.spyOn(ctx.req, "json").mockResolvedValue({ name: "U" });
            updateSpy.mockRejectedValue(new Error("Err"));
            const res = await UsersController.update(ctx);
            expect(res.status).toBe(500);
        });
    });

    describe("delete", () => {
        it("should return 200 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("u1");
            const res = await UsersController.delete(ctx);
            expect(res.status).toBe(200);
        });
        it("should return 500 on error", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("u1");
            deleteSpy.mockRejectedValue(new Error("Err"));
            const res = await UsersController.delete(ctx);
            expect(res.status).toBe(500);
        });
    });
});
