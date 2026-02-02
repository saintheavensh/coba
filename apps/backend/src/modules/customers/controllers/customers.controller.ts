import { Context } from "hono";
import { CustomersService } from "../services/customers.service";
import { apiSuccess, apiError } from "../../../lib/response";

const membersService = new CustomersService();

export class CustomersController {
    static async getAll(c: Context) {
        try {
            const query = c.req.query("q");
            const customers = await membersService.getAll(query);
            return apiSuccess(c, customers);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async getById(c: Context) {
        try {
            const id = c.req.param("id");
            const customer = await membersService.getById(id);
            if (!customer) return apiError(c, null, "Customer not found", 404);
            return apiSuccess(c, customer);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async create(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const customer = await membersService.create(data);
            return apiSuccess(c, customer, "Customer created successfully", 201);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async update(c: Context) {
        try {
            const id = c.req.param("id");
            const data = (c.req as any).valid("json");
            const customer = await membersService.update(id, data);
            return apiSuccess(c, customer, "Customer updated successfully");
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async delete(c: Context) {
        try {
            const id = c.req.param("id");
            await membersService.delete(id);
            return apiSuccess(c, null, "Customer deleted successfully");
        } catch (e: any) {
            return apiError(c, e.message || String(e));
        }
    }

    static async getSales(c: Context) {
        try {
            const id = c.req.param("id");
            const sales = await membersService.getSales(id);
            return apiSuccess(c, sales);
        } catch (e: any) {
            return apiError(c, e.message || String(e));
        }
    }

    static async getUnpaidSales(c: Context) {
        try {
            const id = c.req.param("id");
            const sales = await membersService.getUnpaidSales(id);
            return apiSuccess(c, sales);
        } catch (e: any) {
            return apiError(c, e.message || String(e));
        }
    }

    static async processPayment(c: Context) {
        try {
            const id = c.req.param("id");
            const { amount, method, notes, saleId, proofImage } = (c.req as any).valid("json");
            const customer = await membersService.processPayment(id, amount, method, notes, saleId, proofImage);
            return apiSuccess(c, customer, "Payment processed successfully");
        } catch (e: any) {
            return apiError(c, e);
        }
    }
}
