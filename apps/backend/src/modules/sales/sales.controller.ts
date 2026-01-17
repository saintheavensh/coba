import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { SalesService } from "./sales.service";
import { authMiddleware } from "../../middlewares/auth.middleware";

const app = new Hono();
const service = new SalesService();

const saleItemSchema = z.object({
    productId: z.string(),
    // batchId removed: System picks batch automatically (FIFO)
    variant: z.string().default("Standard"), // Default to Standard if handling old data? Or require it? 
    // Docs say variant is free text. Let's make it required but default capable.
    // Actually, if UI sends it, it sends it.
    qty: z.number().min(1),
    price: z.number().min(0)
});

const paymentSchema = z.object({
    method: z.string(), // Snapshot name (e.g. "Transfer Bank", "BCA")
    methodId: z.string().optional(), // ID (e.g. "PM-TRANSFER")
    variantId: z.string().optional(), // Variant ID (e.g. "VAR-BCA")
    variantName: z.string().optional(), // Snapshot Variant Name
    amount: z.number().min(0),
    reference: z.string().optional()
});

const saleSchema = z.object({
    memberId: z.string().optional(),
    customerName: z.string().optional(),
    // paymentMethod removed, replaced by payments array
    payments: z.array(paymentSchema).min(1),
    userId: z.string(),
    notes: z.string().optional(),
    items: z.array(saleItemSchema).min(1),
    discountAmount: z.number().optional()
});

app.use("*", authMiddleware);

app.get("/", async (c) => {
    const query = c.req.query();
    const list = await service.getAll(query);
    // Wrap in standard response
    return c.json({ data: list });
});

app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const item = await service.getOne(id);
    if (!item) return c.json({ message: "Not found" }, 404);
    return c.json({ data: item });
});

app.post("/", zValidator("json", saleSchema), async (c) => {
    const data = c.req.valid("json");
    try {
        const result = await service.createSale(data);
        return c.json({ data: result });
    } catch (e) {
        return c.json({ message: String(e) }, 400);
    }
});

export default app;
