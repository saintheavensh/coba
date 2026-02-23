import { Context } from "hono";
import { defectiveItemsApplicationService, DefectiveItemsApplicationService } from "../defective-items-container";
import { apiSuccess, apiError } from "../../../lib/response";

export class DefectiveItemsController {
    constructor(
        private readonly service: DefectiveItemsApplicationService = defectiveItemsApplicationService
    ) { }

    async getPending(c: Context) {
        try {
            const list = await this.service.getPendingItems();
            return apiSuccess(c, list, "Pending defective items retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve pending defective items");
        }
    }

    async getProcessed(c: Context) {
        try {
            const list = await this.service.getProcessedItems();
            return apiSuccess(c, list, "Processed defective items retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve processed defective items");
        }
    }

    async createItem(c: Context) {
        try {
            const data = await c.req.json();
            const result = await this.service.addItem(data);
            return apiSuccess(c, result, "Defective item added successfully", 201);
        } catch (e: any) {
            return apiError(c, e, e.message || "Failed to add defective item", (e as any).status || 400);
        }
    }

    async processReturn(c: Context) {
        try {
            const user = c.get("user");
            const { itemIds } = await c.req.json();
            const result = await this.service.processReturn(user.id, itemIds);
            return apiSuccess(c, result, "Purchase return created successfully", 201);
        } catch (e: any) {
            return apiError(c, e, e.message || "Failed to process return", (e as any).status || 400);
        }
    }
}
