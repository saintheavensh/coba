import { Context } from "hono";
import { suppliersFacade, SuppliersFacade } from "../suppliers-container";
import { apiSuccess, apiError } from "../../../lib/response";

export class SuppliersController {
    constructor(
        private readonly facade: SuppliersFacade = suppliersFacade
    ) { }

    async getAll(c: Context) {
        try {
            const list = await this.facade.getAll();
            return apiSuccess(c, list, "Suppliers retrieved successfully");
        } catch (e) {
            return apiError(c, e, "Failed to retrieve suppliers", 500);
        }
    }

    async getLinkedCategories(c: Context) {
        try {
            const id = c.req.param("id");
            const list = await this.facade.getLinkedCategories(id);
            return apiSuccess(c, list, "Supplier categories retrieved successfully");
        } catch (e) {
            return apiError(c, e, "Failed to retrieve supplier categories", 500);
        }
    }

    async create(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const result = await this.facade.create(data);
            return apiSuccess(c, result, "Supplier created successfully", 201);
        } catch (e: any) {
            if (e.message && e.message.includes("Validation") || e.name === "ZodError") {
                return apiError(c, e, "Validation failed", 400);
            }
            return apiError(c, e, "Failed to create supplier", 500);
        }
    }

    async update(c: Context) {
        try {
            const id = c.req.param("id");
            const data = (c.req as any).valid("json");
            await this.facade.update(id, data);
            return apiSuccess(c, null, "Supplier updated successfully");
        } catch (e: any) {
            if (e.message && e.message.includes("Validation") || e.name === "ZodError") {
                return apiError(c, e, "Validation failed", 400);
            }
            return apiError(c, e, "Failed to update supplier", 500);
        }
    }

    async delete(c: Context) {
        try {
            const id = c.req.param("id");
            await this.facade.delete(id);
            return apiSuccess(c, null, "Supplier deleted successfully");
        } catch (e) {
            return apiError(c, e, "Failed to delete supplier", 400);
        }
    }

    async linkCategory(c: Context) {
        try {
            const id = c.req.param("id");
            const { categoryId } = (c.req as any).valid("json");
            await this.facade.linkCategory(id, categoryId);
            return apiSuccess(c, null, "Category linked successfully");
        } catch (e) {
            return apiError(c, e, "Failed to link category", 500);
        }
    }

    async unlinkCategory(c: Context) {
        try {
            const id = c.req.param("id");
            const categoryId = c.req.param("categoryId");
            await this.facade.unlinkCategory(id, categoryId);
            return apiSuccess(c, null, "Category unlinked successfully");
        } catch (e) {
            return apiError(c, e, "Failed to unlink category", 500);
        }
    }
}
