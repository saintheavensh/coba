import { Context } from "hono";
import { JournalService } from "../services/journal.service";

// Helper to extract user ID from JWT payload
function getUserId(c: any): string | undefined {
    const payload = c.get("jwtPayload") as any;
    return payload?.id || payload?.userId || payload?.sub;
}

export class JournalController {
    static async getAll(c: Context) {
        try {
            const { startDate, endDate, referenceType, status, limit, offset } = c.req.query();
            const journals = await JournalService.getAll({
                startDate,
                endDate,
                referenceType: referenceType as any,
                status: status as any,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined,
            });
            return c.json(journals);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async getById(c: Context) {
        try {
            const id = c.req.param("id");
            const journal = await JournalService.getById(id);
            if (!journal) return c.json({ error: "Journal not found" }, 404);
            return c.json(journal);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async void(c: Context) {
        try {
            const id = c.req.param("id");
            const { reason } = await c.req.json();
            const userId = getUserId(c);
            if (!userId) return c.json({ error: "Unauthorized" }, 401);
            await JournalService.void(id, reason, userId);
            return c.json({ success: true });
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }
}
