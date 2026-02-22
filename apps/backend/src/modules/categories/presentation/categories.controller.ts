import { Context } from "hono";
import { CategoriesService } from "../services/categories.service";
import { apiSuccess, apiError } from "../../../lib/response";

export class CategoriesController {
    private service: CategoriesService;

    constructor() {
        this.service = new CategoriesService();
    }

    async getAll(c: Context) {
        try {
            const list = await this.service.getAll();
            return apiSuccess(c, list, "Categories retrieved successfully");
        } catch (e) {
            return apiError(c, e, "Failed to retrieve categories", 500);
        }
    }

    async create(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const result = await this.service.create(data);
            return apiSuccess(c, result, "Category created successfully", 201);
        } catch (e) {
            return apiError(c, e, "Failed to create category", 500);
        }
    }

    async update(c: Context) {
        try {
            const id = c.req.param("id");
            const data = (c.req as any).valid("json");
            await this.service.update(id, data);
            return apiSuccess(c, null, "Category updated successfully");
        } catch (e) {
            return apiError(c, e, "Failed to update category", 500);
        }
    }

    async delete(c: Context) {
        try {
            const id = c.req.param("id");
            await this.service.delete(id);
            return apiSuccess(c, null, "Category deleted successfully");
        } catch (e) {
            return apiError(c, e, "Failed to delete category", 400);
        }
    }

    async addVariantTemplate(c: Context) {
        try {
            const categoryId = c.req.param("id");
            const { name, supplierId } = (c.req as any).valid("json");
            const result = await this.service.addVariantTemplate(categoryId, name, supplierId);
            return apiSuccess(c, result, "Variant template added");
        } catch (e) {
            return apiError(c, e, "Failed to add variant template", 500);
        }
    }

    async removeVariantTemplate(c: Context) {
        try {
            const variantId = parseInt(c.req.param("variantId"));
            await this.service.removeVariantTemplate(variantId);
            return apiSuccess(c, null, "Variant template removed");
        } catch (e) {
            return apiError(c, e, "Failed to remove variant template", 500);
        }
    }
}
