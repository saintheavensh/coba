import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { AccountsController } from "../controllers/accounts.controller";
import { AccountsService } from "../services/accounts.service";
import { JournalService } from "../services/journal.service";
import { createMockContext } from "../../../../test/factories";

describe("AccountsController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("getAll should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(AccountsService as any, "getAll").mockResolvedValue([]);
        expect((await AccountsController.getAll(ctx)).status).toBe(200);
    });

    it("getAll should return 500 on error", async () => {
        const ctx = createMockContext();
        vi.spyOn(AccountsService as any, "getAll").mockRejectedValue(new Error("Err"));
        expect((await AccountsController.getAll(ctx)).status).toBe(500);
    });

    it("getTree should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(AccountsService as any, "getTree").mockResolvedValue([]);
        expect((await AccountsController.getTree(ctx)).status).toBe(200);
    });

    it("getTree should return 500 on error", async () => {
        const ctx = createMockContext();
        vi.spyOn(AccountsService as any, "getTree").mockRejectedValue(new Error("Err"));
        expect((await AccountsController.getTree(ctx)).status).toBe(500);
    });

    it("getTypes should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(AccountsService as any, "getAccountTypes").mockResolvedValue([]);
        expect((await AccountsController.getTypes(ctx)).status).toBe(200);
    });

    it("getBalanceSummary should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(AccountsService as any, "getBalanceSummary").mockResolvedValue({});
        expect((await AccountsController.getBalanceSummary(ctx)).status).toBe(200);
    });

    it("create should return 201 on success", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "json").mockResolvedValue({ name: "Acc" });
        vi.spyOn(AccountsService as any, "create").mockResolvedValue("1");
        expect((await AccountsController.create(ctx)).status).toBe(201);
    });

    it("create should return 500 on error", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "json").mockResolvedValue({});
        vi.spyOn(AccountsService as any, "create").mockRejectedValue(new Error("Err"));
        expect((await AccountsController.create(ctx)).status).toBe(500);
    });

    it("seed should return 201", async () => {
        const ctx = createMockContext();
        vi.spyOn(AccountsService as any, "seedStandardAccounts").mockResolvedValue({ created: 1 });
        expect((await AccountsController.seed(ctx)).status).toBe(201);
    });

    it("reset should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(AccountsService as any, "resetAllAccounts").mockResolvedValue({ success: true });
        expect((await AccountsController.reset(ctx)).status).toBe(200);
    });

    describe("transfer", () => {
        it("201 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "json").mockResolvedValue({ fromAccountId: "1", toAccountId: "2", amount: 10 });
            vi.spyOn(JournalService as any, "create").mockResolvedValue("j1");
            expect((await AccountsController.transfer(ctx)).status).toBe(201);
        });
        it("400 if same accounts", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "json").mockResolvedValue({ fromAccountId: "1", toAccountId: "1", amount: 10 });
            expect((await AccountsController.transfer(ctx)).status).toBe(400);
        });
        it("500 on error", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "json").mockResolvedValue({ fromAccountId: "1", toAccountId: "2", amount: 10 });
            vi.spyOn(JournalService as any, "create").mockRejectedValue(new Error("Err"));
            expect((await AccountsController.transfer(ctx)).status).toBe(500);
        });
    });
});
