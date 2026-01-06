import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { SalesService } from "./sales.service";
import { authMiddleware } from "../../middlewares/auth.middleware";

const app = new Hono();
const service = new SalesService();

const saleItemSchema = z.object({
    productId: z.string(),
    batchId: z.string(),
    variant: z.string().optional(),
    qty: z.number().min(1),
    price: z.number().min(0)
});

const saleSchema = z.object({
    memberId: z.string().optional(),
    customerName: z.string().optional(),
    paymentMethod: z.enum(["cash", "transfer", "qris"]),
    userId: z.string(),
    notes: z.string().optional(),
    items: z.array(saleItemSchema).min(1),
    discountAmount: z.number().optional()
});

app.use("*", authMiddleware);

app.get("/", async (c) => {
    const list = await service.getAll();
    return c.json(list);
});

app.post("/", zValidator("json", saleSchema), async (c) => {
    const data = c.req.valid("json");
    try {
        const result = await service.createSale(data);
        return c.json(result);
    } catch (e) {
        return c.json({ message: String(e) }, 400);
    }
});

export default app;
