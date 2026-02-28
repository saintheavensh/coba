import { Context } from "hono";
import { TypeManagementUseCase } from "../application/use-cases/type-management.use-case";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";

export class ServiceTypeController {
    constructor(private readonly useCase: TypeManagementUseCase) { }

    async getAll(c: Context) {
        try {
            const categoryId = c.req.query("categoryId");
            const list = await this.useCase.getAll(categoryId);
            return apiSuccess(c, list, "Types retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve types");
        }
    }

    async getById(c: Context) {
        try {
            const id = c.req.param("id");
            const item = await this.useCase.getById(id);
            if (!item) return apiError(c, "Type not found", "Not Found", 404);
            return apiSuccess(c, item, "Type retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve type");
        }
    }

    async create(c: Context) {
        try {
            const body = await c.req.json();
            const result = await this.useCase.create(body);
            return apiSuccess(c, result, "Type created successfully", 201);
        } catch (e: any) {
            return apiError(c, e, "Failed to create type");
        }
    }

    async update(c: Context) {
        try {
            const id = c.req.param("id");
            const body = await c.req.json();
            const result = await this.useCase.update(id, body);
            return apiSuccess(c, result, "Type updated successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to update type");
        }
    }

    async delete(c: Context) {
        try {
            const id = c.req.param("id");
            await this.useCase.delete(id);
            return apiSuccess(c, null, "Type deleted successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to delete type");
        }
    }
}
