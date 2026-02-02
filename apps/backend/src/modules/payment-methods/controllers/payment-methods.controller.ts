import { Context } from "hono";
import { PaymentMethodsService } from "../services/payment-methods.service";
import { apiSuccess, apiError } from "../../../lib/response";

const service = new PaymentMethodsService();

export class PaymentMethodsController {
    static async getAll(c: Context) {
        try {
            const data = await service.getAll();
            return apiSuccess(c, data);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async getEnabled(c: Context) {
        try {
            const data = await service.getEnabled();
            return apiSuccess(c, data);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async create(c: Context) {
        try {
            const body = await c.req.json();
            const data = await service.create(body);
            return apiSuccess(c, data);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async update(c: Context) {
        try {
            const id = c.req.param("id");
            const body = await c.req.json();
            const data = await service.update(id, body);
            return apiSuccess(c, data);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async disable(c: Context) {
        try {
            const id = c.req.param("id");
            const data = await service.disable(id);
            return apiSuccess(c, data);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async addVariant(c: Context) {
        try {
            const id = c.req.param("id");
            const body = await c.req.json();
            const data = await service.addVariant(id, body);
            return apiSuccess(c, data);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async updateVariant(c: Context) {
        try {
            const id = c.req.param("id"); // variant id
            const body = await c.req.json();
            await service.updateVariant(id, body);
            return apiSuccess(c, { message: "Updated" });
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async disableVariant(c: Context) {
        try {
            const id = c.req.param("id"); // variant id
            const data = await service.disableVariant(id);
            return apiSuccess(c, data);
        } catch (e: any) {
            return apiError(c, e);
        }
    }
}
