import { Context } from "hono";
import { BrandsService } from "../services/brands.service";
import { apiSuccess, apiError } from "../../../lib/response";

export class BrandsController {
    static async getAll(c: Context) {
        try {
            const brands = await BrandsService.getAll();
            return apiSuccess(c, brands);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch brands", 500);
        }
    }

    static async create(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const brand = await BrandsService.create(data);
            return apiSuccess(c, brand[0], "Brand created", 201);
        } catch (e: any) {
            if (e.code === '23505') { // Postgres duplicate key error
                return apiError(c, "Brand ID already exists", "Duplicate Brand ID", 409);
            }
            return apiError(c, e, "Failed to create brand", 500);
        }
    }

    static async update(c: Context) {
        try {
            const id = c.req.param("id");
            const data = (c.req as any).valid("json");
            const brand = await BrandsService.update(id, data);
            if (brand.length === 0) {
                return apiError(c, "Brand not found", "Brand not found", 404);
            }
            return apiSuccess(c, brand[0]);
        } catch (e: any) {
            return apiError(c, e, "Failed to update brand", 500);
        }
    }

    static async delete(c: Context) {
        try {
            const id = c.req.param("id");
            const brand = await BrandsService.delete(id);
            if (brand.length === 0) {
                return apiError(c, "Brand not found", "Brand not found", 404);
            }
            return apiSuccess(c, { deleted: true });
        } catch (e: any) {
            return apiError(c, e, "Failed to delete brand", 500);
        }
    }
}
