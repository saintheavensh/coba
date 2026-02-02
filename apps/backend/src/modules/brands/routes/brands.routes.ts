import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { BrandsController } from "../controllers/brands.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { permissionGuard } from "../../../middlewares/permission.middleware";

export const brands = new Hono();

const createBrandSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    logo: z.string().optional(),
});

const updateBrandSchema = z.object({
    name: z.string().optional(),
    logo: z.string().optional(),
});

brands.get("/", BrandsController.getAll);

brands.post(
    "/",
    authMiddleware,
    permissionGuard("inventory.manage"),
    zValidator("json", createBrandSchema),
    BrandsController.create
);

brands.patch(
    "/:id",
    authMiddleware,
    permissionGuard("inventory.manage"),
    zValidator("json", updateBrandSchema),
    BrandsController.update
);

brands.delete(
    "/:id",
    authMiddleware,
    permissionGuard("inventory.manage"),
    BrandsController.delete
);

export default brands;
