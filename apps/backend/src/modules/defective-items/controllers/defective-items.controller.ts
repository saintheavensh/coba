import { Context } from "hono";
import { DefectiveItemsService } from "../services/defective-items.service";
import { apiSuccess, apiError } from "../../../lib/response";

const service = new DefectiveItemsService();

export class DefectiveItemsController {
    static async getPendingItems(c: Context) {
        try {
            const data = await service.getPendingItems();
            return apiSuccess(c, data);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async addItem(c: Context) {
        try {
            const body = await c.req.json(); // Validator handles shape, but we cast or trust middleware
            const result = await service.addItem({
                ...body,
                source: "manual"
            });
            return apiSuccess(c, result);
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    static async createReturn(c: Context) {
        try {
            const body = await c.req.json();
            const result = await service.createReturnFromItems(body.userId, body.itemIds);
            return apiSuccess(c, result);
        } catch (e: any) {
            return apiError(c, e);
        }
    }
}
