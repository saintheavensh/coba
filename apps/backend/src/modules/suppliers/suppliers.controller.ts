import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { SuppliersService } from "./suppliers.service";
import { apiSuccess, apiError } from "../../lib/response";

const app = new Hono();
const service = new SuppliersService();

// Validation Schema
const supplierSchema = z.object({
    name: z.string().min(1),
    contact: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    image: z.string().optional(),
    brands: z.array(z.any()).optional()
});

app.get("/", async (c) => {
    try {
        const list = await service.getAll();
        return apiSuccess(c, list, "Suppliers retrieved successfully");
    } catch (e) {
        return apiError(c, e, "Failed to retrieve suppliers", 500);
    }
});

app.post("/", zValidator("json", supplierSchema), async (c) => {
    try {
        const data = c.req.valid("json");
        const result = await service.create(data);
        return apiSuccess(c, result, "Supplier created successfully", 201);
    } catch (e) {
        return apiError(c, e, "Failed to create supplier", 500);
    }
});

app.put("/:id", zValidator("json", supplierSchema), async (c) => {
    try {
        const id = c.req.param("id");
        const data = c.req.valid("json");
        await service.update(id, data);
        return apiSuccess(c, null, "Supplier updated successfully");
    } catch (e) {
        return apiError(c, e, "Failed to update supplier", 500);
    }
});

app.delete("/:id", async (c) => {
    try {
        const id = c.req.param("id");
        await service.delete(id);
        return apiSuccess(c, null, "Supplier deleted successfully");
    } catch (e) {
        return apiError(c, e, "Failed to delete supplier", 400);
    }
});

export default app;
