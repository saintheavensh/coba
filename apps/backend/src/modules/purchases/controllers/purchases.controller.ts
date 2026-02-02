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
            const { search, startDate, endDate, mine, limit } = c.req.query();
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
                limit: limit ? parseInt(limit) : undefined
            });
            return apiSuccess(c, list, "Purchases retrieved successfully");
        } catch (e) {
            return apiError(c, e, "Failed to retrieve purchases", 500);
        }
    }

    async createPurchase(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const user = (c as any).get("user");
            if (user) {
                data.userId = user.id;
            }
            const result = await this.service.createPurchase(data);
            return apiSuccess(c, result, "Purchase created successfully", 201);
        } catch (e) {
            return apiError(c, e, "Failed to create purchase", 400); // 400 likely for validation/logic
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
            await this.service.deletePurchase(id);
            return apiSuccess(c, null, "Purchase deleted successfully");
        } catch (e) {
            return apiError(c, e, "Failed to delete purchase", 500);
        }
    }
}
