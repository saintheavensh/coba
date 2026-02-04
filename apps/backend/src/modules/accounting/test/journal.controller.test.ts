import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { JournalController } from "../controllers/journal.controller";
import { JournalService } from "../services/journal.service";
import { createMockContext } from "../../../../test/factories";

describe("JournalController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("getAll should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "query").mockReturnValue({});
        vi.spyOn(JournalService as any, "getAll").mockResolvedValue([]);
        expect((await JournalController.getAll(ctx)).status).toBe(200);
    });

    it("getAll should return 500 on error", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "query").mockReturnValue({});
        vi.spyOn(JournalService as any, "getAll").mockRejectedValue(new Error("Err"));
        expect((await JournalController.getAll(ctx)).status).toBe(500);
    });

    it("getById should return 200 if found", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("1");
        vi.spyOn(JournalService as any, "getById").mockResolvedValue({});
        expect((await JournalController.getById(ctx)).status).toBe(200);
    });

    it("getById should return 404 if not found", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("1");
        vi.spyOn(JournalService as any, "getById").mockResolvedValue(null);
        expect((await JournalController.getById(ctx)).status).toBe(404);
    });

    it("getById should return 500 on error", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("1");
        vi.spyOn(JournalService as any, "getById").mockRejectedValue(new Error("Err"));
        expect((await JournalController.getById(ctx)).status).toBe(500);
    });

    it("void should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("1");
        vi.spyOn(ctx.req, "json").mockResolvedValue({ reason: "mistake" });
        vi.spyOn(ctx, "get").mockReturnValue({ id: "user-1" });
        vi.spyOn(JournalService as any, "void").mockResolvedValue({});
        expect((await JournalController.void(ctx)).status).toBe(200);
    });

    it("void should return 401 if unauthorized", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "json").mockResolvedValue({ reason: "mistake" });
        vi.spyOn(ctx, "get").mockReturnValue(null);
        expect((await JournalController.void(ctx)).status).toBe(401);
    });

    it("void should return 500 on error", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("1");
        vi.spyOn(ctx.req, "json").mockResolvedValue({ reason: "mistake" });
        vi.spyOn(ctx, "get").mockReturnValue({ id: "user-1" });
        vi.spyOn(JournalService as any, "void").mockRejectedValue(new Error("Err"));
        expect((await JournalController.void(ctx)).status).toBe(500);
    });
});
