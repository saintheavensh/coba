import { Context } from "hono";
import { categoriesFacade } from "../categories-container";
import { apiSuccess, apiError } from "../../../lib/response";

export class CategoriesController {
    async getAll(c: Context) {
        try {
            const list = await categoriesFacade.getAll();
            return apiSuccess(c, list, "Categories retrieved successfully");
        } catch (e) {
            return apiError(c, e, "Failed to retrieve categories", 500);
        }
    }

    async create(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const result = await categoriesFacade.create(data);
            return apiSuccess(c, result, "Category created successfully", 201);
        } catch (e) {
            return apiError(c, e, "Failed to create category", 500);
        }
    }

    async update(c: Context) {
        try {
            const id = c.req.param("id");
            const data = (c.req as any).valid("json");
            await categoriesFacade.update(id, data);
            return apiSuccess(c, null, "Category updated successfully");
        } catch (e) {
            return apiError(c, e, "Failed to update category", 500);
        }
    }

    async delete(c: Context) {
        try {
            const id = c.req.param("id");
            await categoriesFacade.delete(id);
            return apiSuccess(c, null, "Category deleted successfully");
        } catch (e) {
            return apiError(c, e, "Failed to delete category", 400);
        }
    }

    async addVariantTemplate(c: Context) {
        try {
            const categoryId = c.req.param("id");
            const { name, supplierId } = (c.req as any).valid("json");
            const result = await categoriesFacade.addVariantTemplate(categoryId, name, supplierId);
            return apiSuccess(c, result, "Variant template added");
        } catch (e) {
            return apiError(c, e, "Failed to add variant template", 500);
        }
    }

    async removeVariantTemplate(c: Context) {
        try {
            const variantId = c.req.param("variantId");
            await categoriesFacade.removeVariantTemplate(variantId);
            return apiSuccess(c, null, "Variant template removed");
        } catch (e) {
            return apiError(c, e, "Failed to remove variant template", 500);
        }
    }
}
