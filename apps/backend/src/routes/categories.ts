import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { categorySchema } from "@repo/shared";
import { db } from "../db";
import { categories, products } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const app = new Hono();

// GET / - List all categories
app.get("/", async (c) => {
    const allCategories = await db.query.categories.findMany({
        orderBy: [desc(categories.createdAt)],
    });
    return c.json(allCategories);
});

// POST / - Create category
app.post("/", zValidator("json", categorySchema), async (c) => {
    const data = c.req.valid("json");
    const id = crypto.randomUUID();

    await db.insert(categories).values({
        id,
        name: data.name,
        description: data.description,
    });

    return c.json({ message: "Category created", id });
});

// PUT /:id - Update category
app.put("/:id", zValidator("json", categorySchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    await db.update(categories)
        .set({
            name: data.name,
            description: data.description,
        })
        .where(eq(categories.id, id));

    return c.json({ message: "Category updated" });
});

// DELETE /:id - Delete category
app.delete("/:id", async (c) => {
    const id = c.req.param("id");

    // Check if used
    const inUse = await db.query.products.findFirst({
        where: eq(products.categoryId, id)
    });

    if (inUse) {
        return c.json({ message: "Category is in use by products" }, 400);
    }

    await db.delete(categories).where(eq(categories.id, id));
    return c.json({ message: "Category deleted" });
});

export default app;
