import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { products, productBatches } from "../db/schema";
import { eq } from "drizzle-orm";

const inventory = new Hono();

// Schemas
const productSchema = z.object({
    name: z.string().min(1),
    minStock: z.number().default(5)
});

const batchSchema = z.object({
    productId: z.string(),
    supplier: z.string().optional(),
    buyPrice: z.number(),
    sellPrice: z.number(),
    stock: z.number()
});

// GET /products - List all products with their total stock
inventory.get("/", async (c) => {
    const allProducts = await db.select().from(products);
    // TODO: Fetch batches related if needed, or join
    // For now simple listing
    return c.json(allProducts);
});

// POST /products - Create new product
inventory.post("/", zValidator("json", productSchema), async (c) => {
    const data = c.req.valid("json");
    const id = "PRD-" + Date.now().toString().slice(-6); // Simple ID gen

    await db.insert(products).values({
        id,
        name: data.name,
        minStock: data.minStock,
        stock: 0 // Initial stock 0
    });

    return c.json({ message: "Product created", id });
});

// GET /products/:id - Get detail
inventory.get("/:id", async (c) => {
    const id = c.req.param("id");
    const product = await db.query.products.findFirst({
        where: eq(products.id, id),
        with: {
            // If we had relationship defined in schema we could import relations
            // For now we query separate or just return product
        }
    });

    if (!product) return c.json({ message: "Not found" }, 404);

    return c.json(product);
});

// POST /batch - Add stock batch
inventory.post("/batch", zValidator("json", batchSchema), async (c) => {
    const data = c.req.valid("json");
    const batchId = "B-" + Date.now().toString().slice(-6);

    // Transaction to add batch and update product total stock
    await db.transaction(async (tx) => {
        await tx.insert(productBatches).values({
            id: batchId,
            productId: data.productId,
            supplier: data.supplier,
            buyPrice: data.buyPrice,
            sellPrice: data.sellPrice,
            initialStock: data.stock,
            currentStock: data.stock
        });

        // Update product total stock
        const product = await tx.query.products.findFirst({
            where: eq(products.id, data.productId)
        });

        if (product) {
            await tx.update(products)
                .set({ stock: (product.stock || 0) + data.stock })
                .where(eq(products.id, data.productId));
        }
    });

    return c.json({ message: "Batch added", id: batchId });
});

export default inventory;
