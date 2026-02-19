import { Context } from "hono";
import { AccountsService } from "../services/accounts.service";
import { apiSuccess, apiError } from "../../../lib/response";

// Helper to extract user ID from JWT payload
function getUserId(c: any): string | undefined {
    const payload = c.get("jwtPayload") as any;
    return payload?.id || payload?.userId || payload?.sub;
}

export class AccountsController {
    static async getAll(c: Context) {
        try {
            const { typeId } = c.req.query();
            const accounts = await AccountsService.getAll({ typeId });
            return c.json(accounts);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async getTree(c: Context) {
        try {
            const tree = await AccountsService.getTree();
            return c.json(tree);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async getTypes(c: Context) {
        try {
            const types = await AccountsService.getAccountTypes();
            return c.json(types);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async getBalanceSummary(c: Context) {
        try {
            const summary = await AccountsService.getBalanceSummary();
            return c.json(summary);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async create(c: Context) {
        try {
            const data = await c.req.json();
            const userId = getUserId(c);
            const id = await AccountsService.create(data, userId);
            return c.json({ id }, 201);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async setOpeningBalance(c: Context) {
        try {
            const id = c.req.param("id");
            const { amount } = await c.req.json();
            const userId = getUserId(c);

            await AccountsService.setOpeningBalance(id, Number(amount), userId);
            return c.json({ success: true });
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async seed(c: Context) {
        try {
            const userId = getUserId(c);
            const result = await AccountsService.seedStandardAccounts(userId);
            return c.json(result, result.skipped ? 200 : 201);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async reset(c: Context) {
        try {
            const userId = getUserId(c);
            const result = await AccountsService.resetAllAccounts(userId);
            return c.json(result);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async transfer(c: Context) {
        try {
            const { fromAccountId, toAccountId, amount, description } = await c.req.json();
            const userId = getUserId(c);

            if (fromAccountId === toAccountId) {
                return c.json({ error: "Source and destination accounts must be different" }, 400);
            }

            // Using JournalService directly or via AccountsService? 
            // Original code used JournalService inside the route handler. 
            // Ideally this logic belongs in a Service, let's keep it here or delegate.
            // Delegate creation to JournalService as before, but maybe via AccountsService?
            // For now, I'll import JournalService here to mimic original logic.
            const { JournalService } = await import("../services/journal.service");

            const journalId = await JournalService.create({
                description,
                referenceType: "adjustment",
                lines: [
                    { accountId: toAccountId, debit: amount, credit: 0, description },
                    { accountId: fromAccountId, debit: 0, credit: amount, description },
                ],
            }, userId);

            return c.json({ id: journalId }, 201);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }
}
