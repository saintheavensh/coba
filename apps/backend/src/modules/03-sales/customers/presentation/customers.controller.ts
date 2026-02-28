import { Context } from "hono";
import { customersService, CustomersService } from "../customers-container";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";

export class CustomersController {
    constructor(private readonly service: CustomersService = customersService) { }

    async getAll(c: Context) {
        try {
            const query = c.req.query("q");
            const customers = await this.service.getAll(query);
            return apiSuccess(c, customers);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    async getById(c: Context) {
        try {
            const id = c.req.param("id");
            const customer = await this.service.getById(id);
            return apiSuccess(c, customer);
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to retrieve customer", status);
        }
    }

    async create(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const customer = await this.service.create(data);
            return apiSuccess(c, customer, "Customer created successfully", 201);
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to create customer", status);
        }
    }

    async update(c: Context) {
        try {
            const id = c.req.param("id");
            const data = (c.req as any).valid("json");
            const customer = await this.service.update(id, data);
            return apiSuccess(c, customer, "Customer updated successfully");
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to update customer", status);
        }
    }

    async delete(c: Context) {
        try {
            const id = c.req.param("id");
            await this.service.delete(id);
            return apiSuccess(c, null, "Customer deleted successfully");
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to delete customer", status);
        }
    }

    async getSales(c: Context) {
        try {
            const id = c.req.param("id");
            const sales = await this.service.getSales(id);
            return apiSuccess(c, sales);
        } catch (e: any) {
            return apiError(c, e.message || String(e));
        }
    }

    async getUnpaidSales(c: Context) {
        try {
            const id = c.req.param("id");
            const sales = await this.service.getUnpaidSales(id);
            return apiSuccess(c, sales);
        } catch (e: any) {
            return apiError(c, e.message || String(e));
        }
    }

    async processPayment(c: Context) {
        try {
            const id = c.req.param("id");
            const body = (c.req as any).valid("json");
            const customer = await this.service.processPayment({
                ...body,
                customerId: id
            });
            return apiSuccess(c, customer, "Payment processed successfully");
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to process payment", status);
        }
    }
}
