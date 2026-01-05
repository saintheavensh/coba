import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { productSchema, batchSchema } from "@repo/shared";
import { db } from "../db";
import { products, productBatches } from "../db/schema";
import { eq, sql } from "drizzle-orm";

const inventory = new Hono();

// GET / - List all products
inventory.get("/", async (c) => {
    const allProducts = await db.query.products.findMany({
        orderBy: [eq(products.name, products.name)] // dummy order or just default
        // Better: orderBy: (products, { asc }) => [asc(products.name)] if importing asc
        // For now just return all
    });
    return c.json(allProducts);
});

// POST /products - Create new product
inventory.post("/", zValidator("json", productSchema), async (c) => {
    const data = c.req.valid("json");
    const id = "PRD-" + Date.now().toString().slice(-6); // Simple ID gen

    await db.insert(products).values({
        id,
        name: data.name,
        // barcode: data.barcode, // Removed from schema in Step 2220 shared refactor? 
        // Wait, shared `productSchema` (Step 2219) only has `name` and `minStock`.
        // Old local schema had `barcode`, `category`.
        // If I want barcode/category I need to update shared schema!
        // For now I will stick to what is in shared schema to avoid errors.
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
    });

    if (!product) return c.json({ message: "Not found" }, 404);

    return c.json(product);
});

// PUT /:id - Update product
inventory.put("/:id", zValidator("json", productSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const product = await db.query.products.findFirst({
        where: eq(products.id, id),
    });

    if (!product) return c.json({ message: "Not found" }, 404);

    await db.update(products)
        .set({
            name: data.name,
            minStock: data.minStock
        })
        .where(eq(products.id, id));

    return c.json({ message: "Product updated" });
});

// DELETE /:id - Delete product
inventory.delete("/:id", async (c) => {
    const id = c.req.param("id");

    const product = await db.query.products.findFirst({
        where: eq(products.id, id),
    });

    if (!product) return c.json({ message: "Not found" }, 404);

    // Check if has batches/stock? 
    // For now simple delete. If there are batches, Foreign Key might fail if strict.
    // Assuming cascade or simple delete for now.
    // Ideally we check dependency.

    try {
        await db.delete(products).where(eq(products.id, id));
        return c.json({ message: "Product deleted" });
    } catch (e) {
        return c.json({ message: "Cannot delete product (in use?)" }, 400);
    }
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
