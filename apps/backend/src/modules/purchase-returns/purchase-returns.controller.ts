import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { PurchaseReturnsService } from "./purchase-returns.service";

const purchaseReturnsController = new Hono();
const service = new PurchaseReturnsService();

const createReturnSchema = z.object({
    supplierId: z.string().min(1),
    userId: z.string().min(1),
    notes: z.string().optional(),
    items: z.array(z.object({
        batchId: z.string().min(1),
        qty: z.number().min(1),
        reason: z.string().optional()
    })).min(1)
});

purchaseReturnsController.get("/", async (c) => {
    const data = await service.getAll();
    return c.json({ success: true, data });
});

purchaseReturnsController.get("/:id", async (c) => {
    const id = c.req.param("id");
    const data = await service.getById(id);
    return c.json({ success: true, data });
});

purchaseReturnsController.post("/", zValidator("json", createReturnSchema), async (c) => {
    const payload = c.req.valid("json");
    try {
        const data = await service.create(payload);
        return c.json({ success: true, data }, 201);
    } catch (e: any) {
        return c.json({ success: false, message: e.message }, e.status || 500);
    }
});

export default purchaseReturnsController;
