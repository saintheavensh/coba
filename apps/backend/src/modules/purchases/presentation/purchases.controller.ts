import { AppHonoContext } from "../../../shared/types/app-context";
import { purchasesService } from "../purchases-container";
import { apiSuccess, apiError } from "../../../shared/application/middlewares/ResponseHelpers";

export class PurchasesController {
    async getAll(c: AppHonoContext) {
        try {
            const { search, startDate, endDate, mine, limit, status } = c.req.query();
            let userId: string | undefined = undefined;

            if (mine === "true") {
                const user = c.get("user");
                if (user) userId = user.id;
            }

            const list = await purchasesService.getAll({
                search,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                userId,
                status: status as any,
                limit: limit ? parseInt(limit) : undefined
            });
            const snapshots = list.map(p => (p as any).toSnapshot());
            return apiSuccess(c, snapshots, "Purchases retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, message || "Failed to retrieve purchases", 500);
        }
    }

    async getLowStockSummary(c: AppHonoContext) {
        try {
            const result = await purchasesService.getLowStockSummary();
            return apiSuccess(c, result, "Low stock summary retrieved successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, message || "Failed to retrieve low stock summary", 500);
        }
    }

    async createOrder(c: AppHonoContext<any>) {
        try {
            const data = c.req.valid("json" as any) as any;
            const user = c.get("user");
            if (user) {
                data.userId = user.id;
            }
            const result = await purchasesService.createOrder(data);
            return apiSuccess(c, result, "Order created successfully", 201);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, message || "Failed to create order", 400);
        }
    }

    async getById(c: AppHonoContext) {
        try {
            const id = c.req.param("id");
            const purchase = await purchasesService.getById(id);
            if (!purchase) return apiError(c, null, "Purchase not found", 404);
            return apiSuccess(c, (purchase as any).toSnapshot());
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, message || "Failed to retrieve purchase", 500);
        }
    }

    async deletePurchase(c: AppHonoContext) {
        try {
            const id = c.req.param("id");
            await purchasesService.deletePurchase(id);
            return apiSuccess(c, null, "Purchase deleted successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, message || "Failed to delete purchase", 500);
        }
    }

    async cancelOrder(c: AppHonoContext) {
        try {
            const id = c.req.param("id");
            const body = await c.req.json().catch(() => ({}));
            const reason = body.reason;
            const user = c.get("user");
            if (!user) return apiError(c, null, "Unauthorized", 401);

            const result = await purchasesService.cancelOrder(id, user.id, reason);
            return apiSuccess(c, result, "Purchase Order cancelled successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, message || "Failed to cancel order", 400);
        }
    }

    async receiveGoods(c: AppHonoContext<any>) {
        try {
            const id = c.req.param("id");
            const { items } = c.req.valid("json" as any) as any;
            const user = c.get("user");
            if (!user) return apiError(c, null, "Unauthorized", 401);

            const result = await purchasesService.receiveGoods(id, user.id, items);
            return apiSuccess(c, result, "Goods receipt logged successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, message || "Failed to log goods receipt", 400);
        }
    }

    async verifyGoods(c: AppHonoContext) {
        try {
            const id = c.req.param("id");
            const body = await c.req.json();
            const user = c.get("user");
            if (!user) return apiError(c, null, "Unauthorized", 401);

            const result = await purchasesService.verifyAndComplete(id, user.id, body.items, body);
            return apiSuccess(c, result, "Purchase verified and stocked successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, message || "Failed to verify purchase", 400);
        }
    }
}
