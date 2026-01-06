import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { CategoriesService } from "./categories.service";
import { apiSuccess, apiError } from "../../lib/response";

const app = new Hono();
const service = new CategoriesService();

const categorySchema = z.object({
    name: z.string().min(1),
    description: z.string().optional()
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

export default app;
