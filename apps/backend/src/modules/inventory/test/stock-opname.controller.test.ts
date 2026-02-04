import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { StockOpnameController } from "../controllers/stock-opname.controller";
import { StockOpnameService } from "../services/stock-opname.service";
import { createMockContext, createMockUser } from "../../../../test/factories";

describe("StockOpnameController", () => {
    let controller: StockOpnameController;

    // Spies - StockOpnameService is instance-based
    let createSessionSpy: any;
    let getSessionsSpy: any;
    let getSessionDetailsSpy: any;
    let updateItemSpy: any;
    let finalizeSessionSpy: any;
    let cancelSessionSpy: any;
    let getAdjustmentHistorySpy: any;

    beforeEach(() => {
        vi.clearAllMocks();

        createSessionSpy = vi.spyOn(StockOpnameService.prototype, "createSession").mockResolvedValue("SO-123");
        getSessionsSpy = vi.spyOn(StockOpnameService.prototype, "getSessions").mockResolvedValue([]);
        getSessionDetailsSpy = vi.spyOn(StockOpnameService.prototype, "getSessionDetails").mockResolvedValue(null);
        updateItemSpy = vi.spyOn(StockOpnameService.prototype, "updateItem").mockResolvedValue({ difference: 0 } as any);
        finalizeSessionSpy = vi.spyOn(StockOpnameService.prototype, "finalizeSession").mockResolvedValue({ success: true } as any);
        cancelSessionSpy = vi.spyOn(StockOpnameService.prototype, "cancelSession").mockResolvedValue(undefined);
        getAdjustmentHistorySpy = vi.spyOn(StockOpnameService.prototype, "getAdjustmentHistory").mockResolvedValue([]);

        controller = new StockOpnameController();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const mockAuth = (ctx: any) => {
        vi.spyOn(ctx, "get").mockReturnValue(createMockUser({ id: "user-1" }));
    };

    describe("createSession", () => {
        it("should return 201 and session ID", async () => {
            const ctx = createMockContext();
            mockAuth(ctx);
            vi.spyOn(ctx.req, "json").mockResolvedValue({ notes: "Opname 1", categoryId: "cat-1" });

            const res = await controller.createSession(ctx);

            expect(res.status).toBe(201);
            const json = await res.json() as any;
            expect(json.data).toEqual({ id: "SO-123" });
        });

        it("should return 500 on error", async () => {
            const ctx = createMockContext();
            mockAuth(ctx);
            vi.spyOn(ctx.req, "json").mockResolvedValue({});
            createSessionSpy.mockRejectedValue(new Error("Err"));

            const res = await controller.createSession(ctx);
            expect(res.status).toBe(500);
        });
    });

    describe("getSessions", () => {
        it("should return 200 and list", async () => {
            const ctx = createMockContext();
            const res = await controller.getSessions(ctx);
            expect(res.status).toBe(200);
        });
    });

    describe("getSessionDetails", () => {
        it("should return 200 and details if found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("SO-1");
            getSessionDetailsSpy.mockResolvedValue({ id: "SO-1", items: [] });
            const res = await controller.getSessionDetails(ctx);
            expect(res.status).toBe(200);
        });

        it("should return 404 if not found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("SO-1");
            getSessionDetailsSpy.mockResolvedValue(null);
            const res = await controller.getSessionDetails(ctx);
            expect(res.status).toBe(404);
        });
    });

    describe("updateItem", () => {
        it("should return 200 and result", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("123");
            vi.spyOn(ctx.req, "json").mockResolvedValue({ physicalStock: 10, reason: "Count" });
            const res = await controller.updateItem(ctx);
            expect(res.status).toBe(200);
        });
    });

    describe("finalizeSession", () => {
        it("should return 200 on success", async () => {
            const ctx = createMockContext();
            mockAuth(ctx);
            vi.spyOn(ctx.req, "param").mockReturnValue("SO-1");
            const res = await controller.finalizeSession(ctx);
            expect(res.status).toBe(200);
        });
    });

    describe("cancelSession", () => {
        it("should return 200 on success", async () => {
            const ctx = createMockContext();
            mockAuth(ctx);
            vi.spyOn(ctx.req, "param").mockReturnValue("SO-1");
            const res = await controller.cancelSession(ctx);
            expect(res.status).toBe(200);
        });
    });

    describe("getAdjustmentHistory", () => {
        it("should return 200 and history", async () => {
            const ctx = createMockContext();
            const res = await controller.getAdjustmentHistory(ctx);
            expect(res.status).toBe(200);
        });
    });
});
