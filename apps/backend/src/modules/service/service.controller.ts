import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createServiceSchema, updateStatusSchema } from "@repo/shared";
import { ServiceService } from "./service.service";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { apiSuccess, apiError } from "../../lib/response";

const app = new Hono();
const service = new ServiceService();

app.use("*", authMiddleware);

app.get("/", async (c) => {
    try {
        const list = await service.getAll();
        return apiSuccess(c, list, "Services retrieved successfully");
    } catch (e) {
        return apiError(c, String(e));
    }
});

app.get("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return apiError(c, "Invalid ID", "Validation error", 400);

    try {
        const item = await service.getById(id);
        if (!item) return apiError(c, "Service not found", "Not found", 404);
        return apiSuccess(c, item, "Service retrieved successfully");
    } catch (e) {
        return apiError(c, String(e));
    }
});

app.post("/", zValidator("json", createServiceSchema), async (c) => {
    const data = c.req.valid("json");
    const user = (c.get as (key: string) => any)("user");

    try {
        const result = await service.createService(data, user?.id || "USR-000");
        return apiSuccess(c, result, "Service created successfully", 201);
    } catch (e) {
        return apiError(c, e, "Failed to create service", 400);
    }
});

app.put("/:id/status", zValidator("json", updateStatusSchema), async (c) => {
    const id = parseInt(c.req.param("id"));
    const data = c.req.valid("json");

    try {
        await service.updateStatus(id, data, data.userId);
        return apiSuccess(c, null, "Status updated successfully");
    } catch (e) {
        return apiError(c, e, "Failed to update status", 400);
    }
});

app.delete("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    try {
        await service.delete(id);
        return apiSuccess(c, null, "Service deleted successfully");
    } catch (e) {
        return apiError(c, e, "Failed to delete service", 500);
    }
});

import { PrintService } from "../../services/print.service";
const printer = new PrintService();

app.post("/:id/print", async (c) => {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return apiError(c, "Invalid ID", "Validation error", 400);

    try {
        const item = await service.getById(id);
        if (!item) return apiError(c, "Service not found", "Not found", 404);

        const result = await printer.printServiceNote(item);
        if (!result.success) {
            return apiError(c, result.error, "Print failed", 500);
        }

        return apiSuccess(c, null, "Print command sent to server printer");
    } catch (e) {
        return apiError(c, String(e), "Print failed", 500);
    }
});

export default app;

