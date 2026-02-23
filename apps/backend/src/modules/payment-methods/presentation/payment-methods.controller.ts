import { Context } from "hono";
import { paymentMethodsService, PaymentMethodsService } from "../payment-methods-container";
import { apiSuccess, apiError } from "../../../lib/response";

export class PaymentMethodsController {
    constructor(private readonly service: PaymentMethodsService = paymentMethodsService) { }

    async getAll(c: Context) {
        try {
            const data = await this.service.getAll();
            return apiSuccess(c, data);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    async getEnabled(c: Context) {
        try {
            const data = await this.service.getEnabled();
            return apiSuccess(c, data);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    async getById(c: Context) {
        try {
            const id = c.req.param("id");
            const data = await this.service.getById(id);
            return apiSuccess(c, data);
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to retrieve payment method", status);
        }
    }

    async create(c: Context) {
        try {
            const body = await c.req.json();
            const data = await this.service.create(body);
            return apiSuccess(c, data, "Payment method created successfully", 201);
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to create payment method", status);
        }
    }

    async update(c: Context) {
        try {
            const id = c.req.param("id");
            const body = await c.req.json();
            const data = await this.service.update(id, body);
            return apiSuccess(c, data, "Payment method updated successfully");
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to update payment method", status);
        }
    }

    async disable(c: Context) {
        try {
            const id = c.req.param("id");
            await this.service.disable(id);
            return apiSuccess(c, null, "Payment method disabled successfully");
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to disable payment method", status);
        }
    }

    async addVariant(c: Context) {
        try {
            const id = c.req.param("id");
            const body = await c.req.json();
            const data = await this.service.addVariant(id, body);
            return apiSuccess(c, data, "Variant added successfully", 201);
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to add variant", status);
        }
    }

    async updateVariant(c: Context) {
        try {
            const id = c.req.param("id"); // variant id
            const body = await c.req.json();
            await this.service.updateVariant(id, body);
            return apiSuccess(c, null, "Variant updated successfully");
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to update variant", status);
        }
    }

    async disableVariant(c: Context) {
        try {
            const id = c.req.param("id"); // variant id
            await this.service.disableVariant(id);
            return apiSuccess(c, null, "Variant disabled successfully");
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to disable variant", status);
        }
    }
}
