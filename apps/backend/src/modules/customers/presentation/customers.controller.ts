import { AppHonoContext } from "../../../shared/types/app-context";
import { customersService, CustomersService } from "../customers-container";
import { apiSuccess, apiError } from "../../../shared/application/middlewares/ResponseHelpers";

export class CustomersController {
    constructor(private readonly service: CustomersService = customersService) { }

    async getAll(c: AppHonoContext) {
        try {
            const query = c.req.query("q");
            const customers = await this.service.getAll(query);
            return apiSuccess(c, customers);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message);
        }
    }

    async getById(c: AppHonoContext) {
        try {
            const id = c.req.param("id");
            const customer = await this.service.getById(id);
            return apiSuccess(c, customer);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            const status = (e as any).status || 500;
            return apiError(c, message, message || "Failed to retrieve customer", status);
        }
    }

    async create(c: AppHonoContext<any>) {
        try {
            const data = c.req.valid("json" as any) as any;
            const customer = await this.service.create(data);
            return apiSuccess(c, customer, "Customer created successfully", 201);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            const status = (e as any).status || 500;
            return apiError(c, message, message || "Failed to create customer", status);
        }
    }

    async update(c: AppHonoContext<any>) {
        try {
            const id = c.req.param("id");
            const data = c.req.valid("json" as any) as any;
            const customer = await this.service.update(id, data);
            return apiSuccess(c, customer, "Customer updated successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            const status = (e as any).status || 500;
            return apiError(c, message, message || "Failed to update customer", status);
        }
    }

    async delete(c: AppHonoContext) {
        try {
            const id = c.req.param("id");
            await this.service.delete(id);
            return apiSuccess(c, null, "Customer deleted successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            const status = (e as any).status || 500;
            return apiError(c, message, message || "Failed to delete customer", status);
        }
    }

    async getSales(c: AppHonoContext) {
        try {
            const id = c.req.param("id");
            const sales = await this.service.getSales(id);
            return apiSuccess(c, sales);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message);
        }
    }

    async getUnpaidSales(c: AppHonoContext) {
        try {
            const id = c.req.param("id");
            const sales = await this.service.getUnpaidSales(id);
            return apiSuccess(c, sales);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message);
        }
    }

    async processPayment(c: AppHonoContext<any>) {
        try {
            const id = c.req.param("id");
            const body = c.req.valid("json" as any) as any;
            const customer = await this.service.processPayment({
                ...body,
                customerId: id
            });
            return apiSuccess(c, customer, "Payment processed successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            const status = (e as any).status || 500;
            return apiError(c, message, message || "Failed to process payment", status);
        }
    }
}
