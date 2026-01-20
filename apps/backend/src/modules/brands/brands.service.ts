import { db } from "../../db";
import { brands } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export class BrandsService {
    static async getAll() {
        return await db.select().from(brands).orderBy(desc(brands.createdAt));
    }

    static async create(data: { id: string; name: string; logo?: string }) {
        // Ensure ID is lowercase/slugified if not provided? 
        // For now assume controller handles or we take raw.
        // Let's enforce lowercase ID for consistency.
        const id = data.id.toLowerCase().replace(/\s+/g, '-');

        return await db.insert(brands).values({
            ...data,
            id,
        }).returning();
    }

    static async update(id: string, data: { name?: string; logo?: string }) {
        return await db
            .update(brands)
            .set(data)
            .where(eq(brands.id, id))
            .returning();
    }

    static async delete(id: string) {
        return await db.delete(brands).where(eq(brands.id, id)).returning();
    }
}
