import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { AssetsController } from "../controllers/assets.controller";
import { AssetsService } from "../services/assets.service";
import { createMockContext } from "../../../../test/factories";

describe("AssetsController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("getAll should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "query").mockReturnValue({});
        vi.spyOn(AssetsService as any, "getAll").mockResolvedValue([]);
        expect((await AssetsController.getAll(ctx)).status).toBe(200);
    });

    it("getAll should return 500 on error", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "query").mockReturnValue({});
        vi.spyOn(AssetsService as any, "getAll").mockRejectedValue(new Error("Err"));
        expect((await AssetsController.getAll(ctx)).status).toBe(500);
    });

    it("getById should return 200 if found", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("1");
        vi.spyOn(AssetsService as any, "getById").mockResolvedValue({});
        expect((await AssetsController.getById(ctx)).status).toBe(200);
    });

    it("getById should return 404 if not found", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("1");
        vi.spyOn(AssetsService as any, "getById").mockResolvedValue(null);
        expect((await AssetsController.getById(ctx)).status).toBe(404);
    });

    it("create should return 201", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "json").mockResolvedValue({});
        vi.spyOn(AssetsService as any, "create").mockResolvedValue("1");
        expect((await AssetsController.create(ctx)).status).toBe(201);
    });

    it("update should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("1");
        vi.spyOn(ctx.req, "json").mockResolvedValue({});
        vi.spyOn(AssetsService as any, "update").mockResolvedValue({});
        expect((await AssetsController.update(ctx)).status).toBe(200);
    });

    it("delete should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("1");
        vi.spyOn(AssetsService as any, "delete").mockResolvedValue({});
        expect((await AssetsController.delete(ctx)).status).toBe(200);
    });

    it("processDepreciation should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "json").mockResolvedValue({ period: "2024-01" });
        vi.spyOn(AssetsService as any, "processAllDepreciation").mockResolvedValue({});
        expect((await AssetsController.processDepreciation(ctx)).status).toBe(200);
    });

    it("any method should return 500 on error", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("1");
        vi.spyOn(ctx.req, "json").mockResolvedValue({});
        vi.spyOn(AssetsService as any, "delete").mockRejectedValue(new Error("Err"));
        expect((await AssetsController.delete(ctx)).status).toBe(500);
    });
});
