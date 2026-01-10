import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { PurchasesService } from "./purchases.service";
import { authMiddleware } from "../../middlewares/auth.middleware";

const app = new Hono();
const service = new PurchasesService();

// Validation Schemas
const purchaseItemSchema = z.object({
    productId: z.string(),
    variant: z.string().optional(),
    qty: z.number().min(1),
    buyPrice: z.number().min(0),
    sellPrice: z.number().min(0),
});

const purchaseSchema = z.object({
    supplierId: z.string(),
    userId: z.string().optional(), // In real app, get from Context
    notes: z.string().optional(),
    date: z.string().optional(), // YYYY-MM-DD or ISO
    items: z.array(purchaseItemSchema).min(1),
});

import { apiSuccess, apiError } from "../../lib/response";

app.use("*", authMiddleware); // Protect all routes

app.get("/", async (c) => {
    try {
        const { search, startDate, endDate, mine, limit } = c.req.query();
        let userId = undefined;

        if (mine === "true") {
            const user = (c as any).get("user");
            console.log("[DEBUG] /purchases mine=true. User payload:", user);
            if (user) userId = user.id;
        }

        console.log("[DEBUG] /purchases Filters:", { search, startDate, endDate, userId, limit });
        const list = await service.getAll({
            search,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            userId,
            limit: limit ? parseInt(limit) : undefined
        });
        return apiSuccess(c, list, "Purchases retrieved successfully");
    } catch (e) {
        console.error("[PURCHASES_ERROR]", e);
        return apiError(c, e, "Failed to retrieve purchases", 500);
    }
});

app.post("/", zValidator("json", purchaseSchema), async (c) => {
    try {
        const data = c.req.valid("json");
        const user = (c as any).get("user");
        if (user) {
            data.userId = user.id;
        }

        // For now align with frontend which might send userId manually or logic
        const result = await service.createPurchase(data);
        return apiSuccess(c, result, "Purchase created successfully", 201);
    } catch (e) {
        return apiError(c, e, "Failed to create purchase"); // Default 500, could be 400
    }
});

app.get("/:id", async (c) => {
    try {
        const id = c.req.param("id");
        const purchase = await service.getById(id);
        if (!purchase) return apiError(c, null, "Purchase not found", 404);
        return apiSuccess(c, purchase);
    } catch (e) {
        return apiError(c, e, "Failed to retrieve purchase", 500);
    }
});

app.delete("/:id", async (c) => {
    try {
        const id = c.req.param("id");
        await service.deletePurchase(id);
        return apiSuccess(c, null, "Purchase deleted successfully");
    } catch (e) {
        return apiError(c, e, "Failed to delete purchase", 500);
    }
});

export default app;
