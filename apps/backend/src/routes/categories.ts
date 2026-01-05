import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { categorySchema } from "@repo/shared";
import { db } from "../db";
import { categories } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const category = new Hono();

// GET / - List categories
category.get("/", async (c) => {
    const all = await db.query.categories.findMany({
        orderBy: [desc(categories.createdAt)]
    });
    return c.json(all);
});

// POST / - Create category
category.post("/", zValidator("json", categorySchema), async (c) => {
    const data = c.req.valid("json");
    const id = "CAT-" + Date.now().toString().slice(-6);

    await db.insert(categories).values({
        id,
        name: data.name,
        description: data.description
    });

    return c.json({ message: "Category created", id });
});

// PUT /:id - Update category
category.put("/:id", zValidator("json", categorySchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    await db.update(categories)
        .set({
            name: data.name,
            description: data.description
        })
        .where(eq(categories.id, id));

    return c.json({ message: "Category updated" });
});

// DELETE /:id
category.delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(categories).where(eq(categories.id, id));
    return c.json({ message: "Category deleted" });
});

export default category;
