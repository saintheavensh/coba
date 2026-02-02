import { Hono } from "hono";
import { PurchaseReturnsController } from "../controllers/purchase-returns.controller";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const purchaseReturns = new Hono();

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

purchaseReturns.get("/", PurchaseReturnsController.getAll);
purchaseReturns.get("/:id", PurchaseReturnsController.getById);
purchaseReturns.post("/", zValidator("json", createReturnSchema), PurchaseReturnsController.create);

export default purchaseReturns;
