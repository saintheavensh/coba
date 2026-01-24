import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { CategoriesService } from "./categories.service";
import { apiSuccess, apiError } from "../../lib/response";

const app = new Hono();
const service = new CategoriesService();

const categorySchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    parentId: z.string().optional().nullable(),
    variants: z.array(z.string()).optional() // Input: array of names
});

app.get("/", async (c) => {
    try {
        const list = await service.getAll();
        return apiSuccess(c, list, "Categories retrieved successfully");
    } catch (e) {
        return apiError(c, e, "Failed to retrieve categories", 500);
    }
});

app.post("/", zValidator("json", categorySchema), async (c) => {
    try {
        const data = c.req.valid("json");
        const result = await service.create(data);
        return apiSuccess(c, result, "Category created successfully", 201);
    } catch (e) {
        return apiError(c, e, "Failed to create category", 500);
    }
});

app.put("/:id", zValidator("json", categorySchema), async (c) => {
    try {
        const id = c.req.param("id");
        const data = c.req.valid("json");
        await service.update(id, data);
        return apiSuccess(c, null, "Category updated successfully");
    } catch (e) {
        return apiError(c, e, "Failed to update category", 500);
    }
});

app.delete("/:id", async (c) => {
    try {
        const id = c.req.param("id");
        await service.delete(id);
        return apiSuccess(c, null, "Category deleted successfully");
    } catch (e) {
        return apiError(c, e, "Failed to delete category", 400);
    }
});

// Variant Templates
app.post("/:id/variants", zValidator("json", z.object({ name: z.string(), supplierId: z.string().optional() })), async (c) => {
    try {
        const categoryId = c.req.param("id");
        const { name, supplierId } = c.req.valid("json");
        const result = await service.addVariantTemplate(categoryId, name, supplierId);
        return apiSuccess(c, result, "Variant template added");
    } catch (e) {
        return apiError(c, e, "Failed to add variant template", 500);
    }
});

app.delete("/variants/:variantId", async (c) => {
    try {
        const variantId = parseInt(c.req.param("variantId"));
        await service.removeVariantTemplate(variantId);
        return apiSuccess(c, null, "Variant template removed");
    } catch (e) {
        return apiError(c, e, "Failed to remove variant template", 500);
    }
});

export default app;
