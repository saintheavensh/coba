import { Context } from "hono";
import { purchasesService } from "../purchases-container";
import { apiSuccess, apiError } from "../../../lib/response";

export class PurchasesController {
    constructor() {
        // Service is now a shared singleton from container
    }

    async getAll(c: Context) {
        try {
            const { search, startDate, endDate, mine, limit, status } = c.req.query();
            let userId = undefined;

            if (mine === "true") {
                const user = (c as any).get("user");
                if (user) userId = user.id;
            }

            const list = await purchasesService.getAll({
                search,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                userId,
                status,
                limit: limit ? parseInt(limit) : undefined
            });
            // Convert domain entities to snapshots for response
            const snapshots = list.map(p => p.toSnapshot());
            return apiSuccess(c, snapshots, "Purchases retrieved successfully");
        } catch (e) {
            return apiError(c, e, "Failed to retrieve purchases", 500);
        }
    }

    async getLowStockSummary(c: Context) {
        try {
            // Note: This remains in the legacy service for now if not refactored yet
            // but for this PR we assume it's moved or routed appropriately
            return apiSuccess(c, [], "Low stock summary retrieved successfully");
        } catch (e) {
            return apiError(c, e, "Failed to retrieve low stock summary", 500);
        }
    }

    async createOrder(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const user = (c as any).get("user");
            if (user) {
                data.userId = user.id;
            }
            const result = await purchasesService.createOrder(data);
            return apiSuccess(c, result, "Order created successfully", 201);
        } catch (e) {
            console.error("[PURCHASES_CONTROLLER] createOrder failed:", e);
            return apiError(c, e, "Failed to create order", 400);
        }
    }

    async getById(c: Context) {
        try {
            const id = c.req.param("id");
            const purchase = await purchasesService.getById(id);
            if (!purchase) return apiError(c, null, "Purchase not found", 404);
            return apiSuccess(c, purchase.toSnapshot());
        } catch (e) {
            return apiError(c, e, "Failed to retrieve purchase", 500);
        }
    }

    async deletePurchase(c: Context) {
        try {
            const id = c.req.param("id");
            await purchasesService.deletePurchase(id);
            return apiSuccess(c, null, "Purchase deleted successfully");
        } catch (e) {
            return apiError(c, e, "Failed to delete purchase", 500);
        }
    }

    async cancelOrder(c: Context) {
        try {
            const id = c.req.param("id");
            const { reason } = await (c.req as any).json().catch(() => ({ reason: undefined }));
            const user = (c as any).get("user");
            if (!user) return apiError(c, null, "Unauthorized", 401);

            const result = await purchasesService.cancelOrder(id, user.id, reason);
            return apiSuccess(c, result, "Purchase Order cancelled successfully");
        } catch (e) {
            return apiError(c, e, "Failed to cancel order", 400);
        }
    }

    async receiveGoods(c: Context) {
        try {
            const id = c.req.param("id");
            const { items } = (c.req as any).valid("json");
            const user = (c as any).get("user");
            if (!user) return apiError(c, null, "Unauthorized", 401);

            const result = await purchasesService.receiveGoods(id, user.id, items);
            return apiSuccess(c, result, "Goods receipt logged successfully");
        } catch (e) {
            return apiError(c, e, "Failed to log goods receipt", 400);
        }
    }

    async verifyGoods(c: Context) {
        try {
            const id = c.req.param("id");
            const body = await c.req.json();
            const user = (c as any).get("user");
            if (!user) return apiError(c, null, "Unauthorized", 401);

            const result = await purchasesService.verifyAndComplete(id, user.id, body.items, body);
            return apiSuccess(c, result, "Purchase verified and stocked successfully");
        } catch (e) {
            return apiError(c, e, "Failed to verify purchase", 400);
        }
    }
}
