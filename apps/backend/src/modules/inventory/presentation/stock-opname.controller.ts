/**
 * Stock Opname controller — delegates to StockOpnameService via DI.
 * Updated to use new service facade instead of the old application service global.
 */
import type { Context } from "hono";
import { stockOpnameService } from "../inventory-container";

export class StockOpnameController {
    async createSession(c: Context) {
        try {
            const user = c.get("user") as { id: string };
            const body = await c.req.json();
            const sessionId = await stockOpnameService.createSession(
                user.id,
                body.notes,
                body.categoryId
            );
            return c.json({ id: sessionId }, 201);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    async getSessions(c: Context) {
        try {
            const sessions = await stockOpnameService.getSessions();
            return c.json(sessions);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    async getSessionDetails(c: Context) {
        try {
            const id = c.req.param("id");
            const session = await stockOpnameService.getSessionDetails(id);
            if (!session) return c.json({ error: "Session not found" }, 404);
            return c.json(session);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    async updateItem(c: Context) {
        try {
            const itemId = parseInt(c.req.param("itemId"));
            const body = await c.req.json();
            const result = await stockOpnameService.updateItem(
                itemId,
                body.physicalStock,
                body.adjustmentReason
            );
            return c.json(result);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    async finalizeSession(c: Context) {
        try {
            const id = c.req.param("id");
            const user = c.get("user") as { id: string };
            const result = await stockOpnameService.finalizeSession(id, user.id);
            return c.json(result);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    async cancelSession(c: Context) {
        try {
            const id = c.req.param("id");
            const user = c.get("user") as { id: string };
            await stockOpnameService.cancelSession(id, user.id);
            return c.json({ message: "Session cancelled" });
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    async getAdjustmentHistory(c: Context) {
        try {
            const history = await stockOpnameService.getAdjustmentHistory();
            return c.json(history);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }
}
