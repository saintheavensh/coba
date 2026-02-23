import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { CategoriesController } from "./categories.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { permissionGuard } from "../../../middlewares/permission.middleware";

const app = new Hono();
const controller = new CategoriesController();

const categorySchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    parentId: z.string().optional().nullable(),
    variants: z.array(z.string()).optional() // Input: array of names
});

const variantSchema = z.object({ name: z.string(), supplierId: z.string().optional() });

app.use("*", authMiddleware);

app.get("/", (c) => controller.getAll(c));
app.post("/", permissionGuard("inventory.manage"), zValidator("json", categorySchema), (c) => controller.create(c));
app.put("/:id", permissionGuard("inventory.manage"), zValidator("json", categorySchema), (c) => controller.update(c));
app.delete("/:id", permissionGuard("inventory.manage"), (c) => controller.delete(c));

// Variant Templates
app.post("/:id/variants", permissionGuard("inventory.manage"), zValidator("json", variantSchema), (c) => controller.addVariantTemplate(c));
app.delete("/variants/:variantId", permissionGuard("inventory.manage"), (c) => controller.removeVariantTemplate(c));

export default app;
