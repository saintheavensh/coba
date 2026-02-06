import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { PurchasesController } from "../controllers/purchases.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const app = new Hono();
const controller = new PurchasesController();

const purchaseItemSchema = z.object({
    productId: z.string(),
    variant: z.string().optional(),
    qtyOrdered: z.number().min(1),
    estimatedBuyPrice: z.number().min(0).optional(),
    targetSellPrice: z.number().min(0).optional(),
});

const purchaseSchema = z.object({
    supplierId: z.string(),
    userId: z.string().optional(),
    referenceNumber: z.string().optional(),
    notes: z.string().optional(),
    date: z.string().optional(),
    items: z.array(purchaseItemSchema).min(1),
});

const receiveItemSchema = z.object({
    productId: z.string(),
    variant: z.string().optional(),
    qtyReceived: z.number().min(0),
});

const receiveSchema = z.object({
    items: z.array(receiveItemSchema).min(1),
});

const verifyItemSchema = z.object({
    productId: z.string(),
    variant: z.string().optional(),
    buyPrice: z.number().min(0),
    sellPrice: z.number().min(0),
});

const verifySchema = z.object({
    items: z.array(verifyItemSchema).min(1),
});

app.use("*", authMiddleware);

app.get("/", (c) => controller.getAll(c));
app.post("/", zValidator("json", purchaseSchema), (c) => controller.createOrder(c));
app.get("/:id", (c) => controller.getById(c));
app.post("/:id/receive", zValidator("json", receiveSchema), (c) => controller.receiveGoods(c));
app.post("/:id/verify", zValidator("json", verifySchema), (c) => controller.verifyGoods(c));
app.delete("/:id", (c) => controller.deletePurchase(c));

export default app;
