import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { ServiceToolsController } from "../controllers/service-tools.controller";
import { ServiceToolsService } from "../services/service-tools.service";
import { createMockContext } from "../../../../test/factories";

describe("ServiceToolsController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("getAll should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(ServiceToolsService.prototype, "getAll").mockResolvedValue([]);
        expect((await ServiceToolsController.getAll(ctx)).status).toBe(200);
    });

    it("getAll should return 500 on error", async () => {
        const ctx = createMockContext();
        vi.spyOn(ServiceToolsService.prototype, "getAll").mockRejectedValue(new Error("Err"));
        expect((await ServiceToolsController.getAll(ctx)).status).toBe(500);
    });

    it("create should return 201", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "json").mockResolvedValue({});
        vi.spyOn(ServiceToolsService.prototype, "create").mockResolvedValue({});
        expect((await ServiceToolsController.create(ctx)).status).toBe(201);
    });

    it("create should return 500 on error", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "json").mockResolvedValue({});
        vi.spyOn(ServiceToolsService.prototype, "create").mockRejectedValue("Err");
        expect((await ServiceToolsController.create(ctx)).status).toBe(500);
    });

    it("update should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("1");
        vi.spyOn(ctx.req, "json").mockResolvedValue({});
        vi.spyOn(ServiceToolsService.prototype, "update").mockResolvedValue({});
        expect((await ServiceToolsController.update(ctx)).status).toBe(200);
    });

    it("update should return 500 on error", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("1");
        vi.spyOn(ctx.req, "json").mockResolvedValue({});
        vi.spyOn(ServiceToolsService.prototype, "update").mockRejectedValue("Err");
        expect((await ServiceToolsController.update(ctx)).status).toBe(500);
    });

    it("delete should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("1");
        vi.spyOn(ServiceToolsService.prototype, "delete").mockResolvedValue({});
        expect((await ServiceToolsController.delete(ctx)).status).toBe(200);
    });
});
