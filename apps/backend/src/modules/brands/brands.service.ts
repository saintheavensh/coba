import { db } from "../../db";
import { brands } from "../../db/schema";
import { eq, desc, ilike } from "drizzle-orm";
import { sql } from "drizzle-orm";

/**
 * Normalize brand name: capitalize first letter, rest lowercase
 * Example: "realme" -> "Realme", "REALME" -> "Realme", "realMe" -> "Realme"
 */
function normalizeBrandName(name: string): string {
    if (!name || name.trim().length === 0) return name;
    const trimmed = name.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export class BrandsService {
    static async getAll() {
        return await db.select().from(brands).orderBy(desc(brands.createdAt));
    }

    /**
     * Find brand by name (case-insensitive)
     */
    static async findByName(name: string) {
        const normalized = normalizeBrandName(name);
        const results = await db
            .select()
            .from(brands)
            .where(ilike(brands.name, normalized));
        return results[0] || null;
    }

    static async create(data: { id: string; name: string; logo?: string }) {
        // Normalize brand name: capitalize first letter
        const normalizedName = normalizeBrandName(data.name);
        
        // Check if brand with same name (case-insensitive) already exists
        const existing = await this.findByName(normalizedName);
        if (existing) {
            // Return existing brand instead of creating duplicate
            return [existing];
        }

        // Ensure ID is lowercase/slugified
        const id = data.id.toLowerCase().replace(/\s+/g, '-');

        return await db.insert(brands).values({
            ...data,
            id,
            name: normalizedName, // Use normalized name
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
