import { Context } from "hono";
import { PurchaseReturnsService } from "../services/purchase-returns.service";
import { apiSuccess, apiError } from "../../../lib/response";

const service = new PurchaseReturnsService();

export class PurchaseReturnsController {
    static async getAll(c: Context) {
        try {
            const data = await service.getAll();
            return apiSuccess(c, data);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async getById(c: Context) {
        try {
            const id = c.req.param("id");
            const data = await service.getById(id);
            return apiSuccess(c, data);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async create(c: Context) {
        try {
            const payload = await c.req.json();
            const data = await service.create(payload);
            return apiSuccess(c, data, "Purchase return created", 201);
        } catch (e: any) {
            return apiError(c, e);
        }
    }
}
