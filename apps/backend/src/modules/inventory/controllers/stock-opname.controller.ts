import { Context } from "hono";
import { StockOpnameService } from "../services/stock-opname.service";
import { apiSuccess, apiError } from "../../../lib/response";
import { Logger } from "../../../lib/logger";

export class StockOpnameController {
    private service: StockOpnameService;

    constructor() {
        this.service = new StockOpnameService();
    }

    async getSessions(c: Context) {
        try {
            const data = await this.service.getSessions();
            return apiSuccess(c, data);
        } catch (e) {
            Logger.error("[GET_OPNAME_SESSIONS_ERROR]", e);
            return apiError(c, e, "Failed to get stock opname sessions");
        }
    }

    async getAdjustmentHistory(c: Context) {
        try {
            const data = await this.service.getAdjustmentHistory();
            return apiSuccess(c, data);
        } catch (e) {
            Logger.error("[GET_ADJUSTMENT_HISTORY_ERROR]", e);
            return apiError(c, e, "Failed to get adjustment history");
        }
    }

    async createSession(c: Context) {
        try {
            const user = c.get("jwtPayload") as any;
            const { notes, categoryId } = await c.req.json();
            const sessionId = await this.service.createSession(user.id, notes, categoryId);
            return apiSuccess(c, { id: sessionId }, "Stock opname session created", 201);
        } catch (e) {
            Logger.error("[CREATE_OPNAME_SESSION_ERROR]", e);
            return apiError(c, e, "Failed to create stock opname session");
        }
    }

    async getSessionDetails(c: Context) {
        try {
            const id = c.req.param("id");
            const data = await this.service.getSessionDetails(id);
            if (!data) return apiError(c, null, "Session not found", 404);
            return apiSuccess(c, data);
        } catch (e) {
            Logger.error("[GET_OPNAME_SESSION_DETAILS_ERROR]", e);
            return apiError(c, e, "Failed to get session details");
        }
    }

    async updateItem(c: Context) {
        try {
            const itemId = parseInt(c.req.param("itemId"));
            const { physicalStock, reason } = await c.req.json();
            const result = await this.service.updateItem(itemId, physicalStock, reason);
            return apiSuccess(c, result, "Item updated");
        } catch (e) {
            return apiError(c, e, "Failed to update item");
        }
    }

    async finalizeSession(c: Context) {
        try {
            const id = c.req.param("id");
            const user = c.get("jwtPayload") as any;
            const result = await this.service.finalizeSession(id, user.id);
            return apiSuccess(c, result, "Session finalized and stock adjusted");
        } catch (e) {
            return apiError(c, e, "Failed to finalize session");
        }
    }

    async cancelSession(c: Context) {
        try {
            const id = c.req.param("id");
            const user = c.get("jwtPayload") as any;
            await this.service.cancelSession(id, user.id);
            return apiSuccess(c, null, "Session cancelled");
        } catch (e) {
            return apiError(c, e, "Failed to cancel session");
        }
    }
}
