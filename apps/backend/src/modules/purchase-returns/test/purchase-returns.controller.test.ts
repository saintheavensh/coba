import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { PurchaseReturnsController } from "../controllers/purchase-returns.controller";
import { PurchaseReturnsService } from "../services/purchase-returns.service";
import { createMockContext } from "../../../../test/factories";

describe("PurchaseReturnsController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("getAll should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(PurchaseReturnsService.prototype, "getAll").mockResolvedValue([]);
        expect((await PurchaseReturnsController.getAll(ctx)).status).toBe(200);
    });

    it("getAll should return 500 on error", async () => {
        const ctx = createMockContext();
        vi.spyOn(PurchaseReturnsService.prototype, "getAll").mockRejectedValue(new Error("Err"));
        expect((await PurchaseReturnsController.getAll(ctx)).status).toBe(500);
    });

    it("getById should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("1");
        vi.spyOn(PurchaseReturnsService.prototype, "getById").mockResolvedValue({});
        expect((await PurchaseReturnsController.getById(ctx)).status).toBe(200);
    });

    it("getById should return 404 if not found", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("1");
        vi.spyOn(PurchaseReturnsService.prototype, "getById").mockResolvedValue(null);
        expect((await PurchaseReturnsController.getById(ctx)).status).toBe(404);
    });

    it("create should return 201", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "json").mockResolvedValue({});
        vi.spyOn(PurchaseReturnsService.prototype, "create").mockResolvedValue({});
        expect((await PurchaseReturnsController.create(ctx)).status).toBe(201);
    });

    it("create should return 500 on error", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "json").mockResolvedValue({});
        vi.spyOn(PurchaseReturnsService.prototype, "create").mockRejectedValue(new Error("Err"));
        expect((await PurchaseReturnsController.create(ctx)).status).toBe(500);
    });
});
