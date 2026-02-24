import { Context } from "hono";
import { operationalCostsService, OperationalCostsService } from "../operational-costs-container";
import { apiSuccess, apiError } from "../../../shared/application/middlewares/ResponseHelpers";

export class OperationalCostsController {
    constructor(
        private readonly service: OperationalCostsService = operationalCostsService
    ) { }

    async getAll(c: Context) {
        try {
            const data = await this.service.getAll();
            return apiSuccess(c, data, "Operational costs retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve operational costs");
        }
    }

    async create(c: Context) {
        try {
            const body = await c.req.json();
            const user = c.get("user");
            const result = await this.service.create(body, user?.id);
            return apiSuccess(c, result, "Operational cost created successfully", 201);
        } catch (e: any) {
            return apiError(c, e, e.message || "Failed to create operational cost", (e as any).status || 400);
        }
    }

    async delete(c: Context) {
        try {
            const id = c.req.param("id");
            const result = await this.service.delete(id);
            return apiSuccess(c, result, "Operational cost deleted successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to delete operational cost");
        }
    }
}
