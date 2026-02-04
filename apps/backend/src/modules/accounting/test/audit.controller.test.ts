import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { AuditController } from "../controllers/audit.controller";
import { AuditService } from "../services/audit.service";
import { createMockContext } from "../../../../test/factories";

describe("AuditController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("getAll should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "query").mockReturnValue({});
        vi.spyOn(AuditService as any, "getLogs").mockResolvedValue([]);
        expect((await AuditController.getAll(ctx)).status).toBe(200);
    });

    it("getAll should return 500 on error", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "query").mockReturnValue({});
        vi.spyOn(AuditService as any, "getLogs").mockRejectedValue(new Error("Err"));
        expect((await AuditController.getAll(ctx)).status).toBe(500);
    });

    it("getByEntity should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue({ entityType: "user", entityId: "1" });
        vi.spyOn(AuditService as any, "getByEntity").mockResolvedValue([]);
        expect((await AuditController.getByEntity(ctx)).status).toBe(200);
    });

    it("getByEntity should return 500 on error", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue({ entityType: "user", entityId: "1" });
        vi.spyOn(AuditService as any, "getByEntity").mockRejectedValue(new Error("Err"));
        expect((await AuditController.getByEntity(ctx)).status).toBe(500);
    });
});
