import { AppHonoContext } from "../../../shared/types/app-context";
import { brandsFacade } from "../brands-container";
import { apiSuccess, apiError } from "../../../shared/application/middlewares/ResponseHelpers";

export class BrandsController {
    async getAll(c: AppHonoContext) {
        try {
            const brands = await brandsFacade.getAll();
            return apiSuccess(c, brands);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to fetch brands", 500);
        }
    }

    async create(c: AppHonoContext<any>) {
        try {
            const data = c.req.valid("json" as any);
            const brand = await brandsFacade.create(data);
            return apiSuccess(c, brand[0], "Brand created", 201);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            if ((e as any).code === '23505') { // Postgres duplicate key error
                return apiError(c, "Brand ID already exists", "Duplicate Brand ID", 409);
            }
            return apiError(c, message, "Failed to create brand", 500);
        }
    }

    async update(c: AppHonoContext<any>) {
        try {
            const id = c.req.param("id");
            const data = c.req.valid("json" as any);
            const brand = await brandsFacade.update(id, data);
            if (brand.length === 0) {
                return apiError(c, "Brand not found", "Brand not found", 404);
            }
            return apiSuccess(c, brand[0]);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to update brand", 500);
        }
    }

    async delete(c: AppHonoContext) {
        try {
            const id = c.req.param("id");
            const brand = await brandsFacade.delete(id);
            if (brand.length === 0) {
                return apiError(c, "Brand not found", "Brand not found", 404);
            }
            return apiSuccess(c, { deleted: true });
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to delete brand", 500);
        }
    }
}
