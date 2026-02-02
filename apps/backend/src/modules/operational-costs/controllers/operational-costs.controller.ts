import { Context } from "hono";
import { OperationalCostsService } from "../services/operational-costs.service";
import { apiSuccess, apiError } from "../../../lib/response";

const service = new OperationalCostsService();

export class OperationalCostsController {
    static async getAll(c: Context) {
        try {
            const data = await service.getAll();
            return apiSuccess(c, data);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async create(c: Context) {
        try {
            const body = await c.req.json();
            const userId = (c.get as any)("user")?.id;
            const result = await service.create(body, userId);
            return apiSuccess(c, result);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async delete(c: Context) {
        try {
            const id = parseInt(c.req.param("id"));
            const result = await service.delete(id);
            return apiSuccess(c, result);
        } catch (e: any) {
            return apiError(c, e);
        }
    }
}
