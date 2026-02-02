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
    qty: z.number().min(1),
    buyPrice: z.number().min(0),
    sellPrice: z.number().min(0),
});

const purchaseSchema = z.object({
    supplierId: z.string(),
    userId: z.string().optional(),
    notes: z.string().optional(),
    date: z.string().optional(),
    items: z.array(purchaseItemSchema).min(1),
});

app.use("*", authMiddleware);

app.get("/", (c) => controller.getAll(c));
app.post("/", zValidator("json", purchaseSchema), (c) => controller.createPurchase(c));
app.get("/:id", (c) => controller.getById(c));
app.delete("/:id", (c) => controller.deletePurchase(c));

export default app;
