import { Context } from "hono";
import { CategoryManagementUseCase } from "../application/use-cases/category-management.use-case";
import { apiSuccess, apiError } from "../../../shared/application/middlewares/ResponseHelpers";

export class ServiceCategoryController {
    constructor(private readonly useCase: CategoryManagementUseCase) { }

    async getAll(c: Context) {
        try {
            const list = await this.useCase.getAll();
            return apiSuccess(c, list, "Categories retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve categories");
        }
    }

    async getById(c: Context) {
        try {
            const id = c.req.param("id");
            const item = await this.useCase.getById(id);
            if (!item) return apiError(c, "Category not found", "Not Found", 404);
            return apiSuccess(c, item, "Category retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve category");
        }
    }

    async create(c: Context) {
        try {
            const body = await c.req.json();
            const result = await this.useCase.create(body);
            return apiSuccess(c, result, "Category created successfully", 201);
        } catch (e: any) {
            return apiError(c, e, "Failed to create category");
        }
    }

    async update(c: Context) {
        try {
            const id = c.req.param("id");
            const body = await c.req.json();
            const result = await this.useCase.update(id, body);
            return apiSuccess(c, result, "Category updated successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to update category");
        }
    }

    async delete(c: Context) {
        try {
            const id = c.req.param("id");
            await this.useCase.delete(id);
            return apiSuccess(c, null, "Category deleted successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to delete category");
        }
    }
}
