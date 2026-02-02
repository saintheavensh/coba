import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { CategoriesController } from "../controllers/categories.controller";

const app = new Hono();
const controller = new CategoriesController();

const categorySchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    parentId: z.string().optional().nullable(),
    variants: z.array(z.string()).optional() // Input: array of names
});

const variantSchema = z.object({ name: z.string(), supplierId: z.string().optional() });

app.get("/", (c) => controller.getAll(c));
app.post("/", zValidator("json", categorySchema), (c) => controller.create(c));
app.put("/:id", zValidator("json", categorySchema), (c) => controller.update(c));
app.delete("/:id", (c) => controller.delete(c));

// Variant Templates
app.post("/:id/variants", zValidator("json", variantSchema), (c) => controller.addVariantTemplate(c));
app.delete("/variants/:variantId", (c) => controller.removeVariantTemplate(c));

export default app;
