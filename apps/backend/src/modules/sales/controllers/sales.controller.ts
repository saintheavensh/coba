import { Context } from "hono";
import { SalesService } from "../services/sales.service";
import { apiSuccess, apiError } from "../../../lib/response";

export class SalesController {
    private service: SalesService;

    constructor() {
        this.service = new SalesService();
    }

    async getAll(c: Context) {
        try {
            const query = c.req.query();
            // Cast limit since query params are strings
            const formattedQuery = {
                ...query,
                limit: query.limit // Service parses string
            };
            const list = await this.service.getAll(formattedQuery);
            return apiSuccess(c, list);
        } catch (e) {
            return apiError(c, e, "Failed to retrieve sales", 500);
        }
    }

    async getOne(c: Context) {
        try {
            const id = c.req.param("id");
            const item = await this.service.getOne(id);
            if (!item) return apiError(c, null, "Sale not found", 404);
            return apiSuccess(c, item);
        } catch (e) {
            return apiError(c, e, "Failed to retrieve sale", 500);
        }
    }

    async createSale(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const result = await this.service.createSale(data);
            return apiSuccess(c, result, "Sale created successfully", 201);
        } catch (e) {
            return apiError(c, e, "Failed to create sale", 400);
        }
    }
}
