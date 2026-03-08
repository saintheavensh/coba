import { AppHonoContext } from "../../../shared/types/app-context";
import { salesService, SalesService } from "../sales-container";
import { apiSuccess, apiError } from "../../../shared/application/middlewares/ResponseHelpers";

export class SalesController {
    constructor(private readonly service: SalesService = salesService) { }

    async getAll(c: AppHonoContext) {
        try {
            const query = c.req.query() as any;
            const list = await this.service.getAll(query);
            return apiSuccess(c, list);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to retrieve sales", 500);
        }
    }

    async getOne(c: AppHonoContext) {
        try {
            const id = c.req.param("id");
            const item = await this.service.getById(id);
            return apiSuccess(c, item);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            const status = (e as any).status || 500;
            return apiError(c, message, message || "Failed to retrieve sale", status);
        }
    }

    async createSale(c: AppHonoContext) {
        try {
            const data = c.req.valid("json" as any) as any;
            const result = await this.service.createSale(data);
            return apiSuccess(c, result, "Sale created successfully", 201);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            const status = (e as any).status || 400;
            return apiError(c, message, message || "Failed to create sale", status);
        }
    }
}
