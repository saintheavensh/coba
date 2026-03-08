/**
 * Stock Opname controller — delegates to StockOpnameService via DI.
 * Updated to use new service facade instead of the old application service global.
 */
import { AppHonoContext } from "../../../shared/types/app-context";
import { stockOpnameService } from "../inventory-container";

export class StockOpnameController {
    async createSession(c: AppHonoContext) {
        try {
            const user = c.get("user");
            if (!user) return c.json({ error: "Unauthorized" }, 401);
            const body = await c.req.json();
            const sessionId = await stockOpnameService.createSession(
                user.id,
                body.notes,
                body.categoryId
            );
            return c.json({ id: sessionId }, 201);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return c.json({ error: message }, 500);
        }
    }

    async getSessions(c: AppHonoContext) {
        try {
            const sessions = await stockOpnameService.getSessions();
            return c.json(sessions);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return c.json({ error: message }, 500);
        }
    }

    async getSessionDetails(c: AppHonoContext) {
        try {
            const id = c.req.param("id");
            const session = await stockOpnameService.getSessionDetails(id);
            if (!session) return c.json({ error: "Session not found" }, 404);
            return c.json(session);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return c.json({ error: message }, 500);
        }
    }

    async updateItem(c: AppHonoContext) {
        try {
            const itemId = parseInt(c.req.param("itemId"));
            const body = await c.req.json();
            const result = await stockOpnameService.updateItem(
                itemId,
                body.physicalStock,
                body.adjustmentReason
            );
            return c.json(result);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return c.json({ error: message }, 500);
        }
    }

    async finalizeSession(c: AppHonoContext) {
        try {
            const id = c.req.param("id");
            const user = c.get("user");
            if (!user) return c.json({ error: "Unauthorized" }, 401);
            const result = await stockOpnameService.finalizeSession(id, user.id);
            return c.json(result);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return c.json({ error: message }, 500);
        }
    }

    async cancelSession(c: AppHonoContext) {
        try {
            const id = c.req.param("id");
            const user = c.get("user");
            if (!user) return c.json({ error: "Unauthorized" }, 401);
            await stockOpnameService.cancelSession(id, user.id);
            return c.json({ message: "Session cancelled" });
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return c.json({ error: message }, 500);
        }
    }

    async getAdjustmentHistory(c: AppHonoContext) {
        try {
            const history = await stockOpnameService.getAdjustmentHistory();
            return c.json(history);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return c.json({ error: message }, 500);
        }
    }
}
