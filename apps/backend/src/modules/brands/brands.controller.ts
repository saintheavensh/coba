import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { BrandsService } from "./brands.service";
import { apiSuccess, apiError } from "../../lib/response";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { permissionGuard } from "../../middlewares/permission.middleware";

export const brandsController = new Hono();

const createBrandSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    logo: z.string().optional(),
});

const updateBrandSchema = z.object({
    name: z.string().optional(),
    logo: z.string().optional(),
});

brandsController.get("/", async (c) => {
    try {
        const brands = await BrandsService.getAll();
        return apiSuccess(c, brands);
    } catch (e: any) {
        return apiError(c, e, "Failed to fetch brands", 500);
    }
});

brandsController.post(
    "/",
    authMiddleware,
    permissionGuard("inventory.manage"),
    zValidator("json", createBrandSchema),
    async (c) => {
        try {
            const data = c.req.valid("json");
            const brand = await BrandsService.create(data);
            return apiSuccess(c, brand[0], "Brand created", 201);
        } catch (e: any) {
            if (e.code === '23505') { // Postgres duplicate key error
                return apiError(c, "Brand ID already exists", "Duplicate Brand ID", 409);
            }
            return apiError(c, e, "Failed to create brand", 500);
        }
    });

brandsController.patch(
    "/:id",
    authMiddleware,
    permissionGuard("inventory.manage"),
    zValidator("json", updateBrandSchema),
    async (c) => {
        try {
            const id = c.req.param("id");
            const data = c.req.valid("json");
            const brand = await BrandsService.update(id, data);
            if (brand.length === 0) {
                return apiError(c, "Brand not found", "Brand not found", 404);
            }
            return apiSuccess(c, brand[0]);
        } catch (e: any) {
            return apiError(c, e, "Failed to update brand", 500);
        }
    });

brandsController.delete(
    "/:id",
    authMiddleware,
    permissionGuard("inventory.manage"),
    async (c) => {
        try {
            const id = c.req.param("id");
            // TODO: Check if any devices use this brand before deleting?
            // Current schema doesn't enforce FK strictly on devices.brand (it's text),
            // but it's good practice. For now, we allow delete.
            const brand = await BrandsService.delete(id);
            if (brand.length === 0) {
                return apiError(c, "Brand not found", "Brand not found", 404);
            }
            return apiSuccess(c, { deleted: true });
        } catch (e: any) {
            return apiError(c, e, "Failed to delete brand", 500);
        }
    });
