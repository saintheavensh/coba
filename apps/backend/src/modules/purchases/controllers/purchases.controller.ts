import { Context } from "hono";
import { PurchasesService } from "../services/purchases.service";
import { apiSuccess, apiError } from "../../../lib/response";
import { Logger } from "../../../lib/logger";

export class PurchasesController {
    private service: PurchasesService;

    constructor() {
        this.service = new PurchasesService();
    }

    async getAll(c: Context) {
        try {
            const { search, startDate, endDate, mine, limit, status } = c.req.query();
            let userId = undefined;

            if (mine === "true") {
                const user = (c as any).get("user");
                if (user) userId = user.id;
            }

            const list = await this.service.getAll({
                search,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                userId,
                status,
                limit: limit ? parseInt(limit) : undefined
            });
            return apiSuccess(c, list, "Purchases retrieved successfully");
        } catch (e) {
            return apiError(c, e, "Failed to retrieve purchases", 500);
        }
    }

    async getLowStockSummary(c: Context) {
        try {
            const list = await this.service.getLowStockSummary();
            return apiSuccess(c, list, "Low stock summary retrieved successfully");
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
            const result = await this.service.createOrder(data);
            return apiSuccess(c, result, "Order created successfully", 201);
        } catch (e) {
            console.error("[PURCHASES_CONTROLLER] createOrder failed:", e);
            return apiError(c, e, "Failed to create order", 400);
        }
    }

    async getById(c: Context) {
        try {
            const id = c.req.param("id");
            const purchase = await this.service.getById(id);
            if (!purchase) return apiError(c, null, "Purchase not found", 404);
            return apiSuccess(c, purchase);
        } catch (e) {
            return apiError(c, e, "Failed to retrieve purchase", 500);
        }
    }

    async deletePurchase(c: Context) {
        try {
            const id = c.req.param("id");
            const service = new PurchasesService();
            await service.deletePurchase(id);
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

            const result = await this.service.cancelOrder(id, user.id, reason);
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

            const result = await this.service.receiveGoods(id, user.id, items);
            return apiSuccess(c, result, "Goods receipt logged successfully");
        } catch (e) {
            return apiError(c, e, "Failed to log goods receipt", 400);
        }
    }

    async verifyGoods(c: Context) {
        try {
            const id = c.req.param("id");
            const { items, shippingFee, shippingExpenseAccountId, discountAmount, payment, referenceNumber, paymentDueDate } = await c.req.json();
            const user = (c as any).get("user");
            if (!user) return apiError(c, null, "Unauthorized", 401);

            const result = await this.service.verifyAndComplete(id, user.id, items, {
                shippingFee,
                shippingExpenseAccountId,
                discountAmount,
                payment,
                referenceNumber,
                paymentDueDate: paymentDueDate ? new Date(paymentDueDate) : undefined
            });
            return apiSuccess(c, result, "Purchase verified and stocked successfully");
        } catch (e) {
            return apiError(c, e, "Failed to verify purchase", 400);
        }
    }
}
