import { Context } from "hono";
import { SuppliersService } from "../services/suppliers.service";
import { apiSuccess, apiError } from "../../../lib/response";

export class SuppliersController {
    private service: SuppliersService;

    constructor() {
        this.service = new SuppliersService();
    }

    async getAll(c: Context) {
        try {
            const list = await this.service.getAll();
            return apiSuccess(c, list, "Suppliers retrieved successfully");
        } catch (e) {
            return apiError(c, e, "Failed to retrieve suppliers", 500);
        }
    }

    async create(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const result = await this.service.create(data);
            return apiSuccess(c, result, "Supplier created successfully", 201);
        } catch (e) {
            return apiError(c, e, "Failed to create supplier", 500);
        }
    }

    async update(c: Context) {
        try {
            const id = c.req.param("id");
            const data = (c.req as any).valid("json");
            await this.service.update(id, data);
            return apiSuccess(c, null, "Supplier updated successfully");
        } catch (e) {
            return apiError(c, e, "Failed to update supplier", 500);
        }
    }

    async delete(c: Context) {
        try {
            const id = c.req.param("id");
            await this.service.delete(id);
            return apiSuccess(c, null, "Supplier deleted successfully");
        } catch (e) {
            return apiError(c, e, "Failed to delete supplier", 400);
        }
    }
}
