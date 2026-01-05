import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { suppliers } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const supplier = new Hono();

// Schema
const brandSchema = z.object({
    name: z.string(),
    category: z.string(),
});

const supplierSchema = z.object({
    name: z.string().min(1),
    contact: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    image: z.string().optional(),
    brands: z.array(brandSchema).optional(),
});

// GET / - List all
supplier.get("/", async (c) => {
    const all = await db.query.suppliers.findMany({
        orderBy: [desc(suppliers.createdAt)],
    });
    return c.json(all);
});

// POST / - Create
supplier.post("/", zValidator("json", supplierSchema), async (c) => {
    const data = c.req.valid("json");
    const id = "SUP-" + Date.now().toString().slice(-6);

    await db.insert(suppliers).values({
        id,
        name: data.name,
        contact: data.contact,
        phone: data.phone,
        address: data.address,
        image: data.image,
        brands: data.brands || [],
    });

    return c.json({ message: "Supplier created", id });
});

// PUT /:id - Update
supplier.put("/:id", zValidator("json", supplierSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    await db.update(suppliers)
        .set({
            name: data.name,
            contact: data.contact,
            phone: data.phone,
            address: data.address,
            image: data.image,
            brands: data.brands || [],
        })
        .where(eq(suppliers.id, id));

    return c.json({ message: "Supplier updated" });
});

// DELETE /:id - Delete
supplier.delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(suppliers).where(eq(suppliers.id, id));
    return c.json({ message: "Supplier deleted" });
});

export default supplier;
