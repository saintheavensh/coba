import { db } from "../../db";
import { devices, productDeviceCompatibility } from "../../db/schema";
import { eq, desc, ilike, or, inArray, and, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { BrandsService } from "../brands/brands.service";

/**
 * Normalize brand name: capitalize first letter, rest lowercase
 */
function normalizeBrandName(name: string): string {
    if (!name || name.trim().length === 0) return name;
    const trimmed = name.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export class DevicesService {
    static async getAll(search?: string, limit: number = 50, offset: number = 0, brand?: string) {
        let query = db
            .select()
            .from(devices);

        const conditions = [];
        let term = search?.trim();

        if (term) {
            conditions.push(
                or(
                    // Combined Search (Brand + Model)
                    sql`${devices.brand} || ' ' || ${devices.model} ILIKE ${"%" + term + "%"}`,
                    // Individual Field Search
                    ilike(devices.brand, `%${term}%`),
                    ilike(devices.model, `%${term}%`),
                    ilike(devices.code, `%${term}%`)
                )
            );
        }

        if (brand) {
            conditions.push(ilike(devices.brand, brand.trim()));
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions)) as any;
        }

        const combinedName = sql`${devices.brand} || ' ' || ${devices.model}`;

        // Add Relevance Scoring
        if (term) {
            query = query.orderBy(
                sql`CASE 
                    -- Exact Model Match
                    WHEN ${devices.model} ILIKE ${term} THEN 1
                    
                    -- Combined Name Starts With
                    WHEN ${combinedName} ILIKE ${term + "%"} THEN 2
                    
                    -- Model Starts With
                    WHEN ${devices.model} ILIKE ${term + "%"} THEN 3
                    
                    -- Combined Name Contains
                    WHEN ${combinedName} ILIKE ${"%" + term + "%"} THEN 4
                    
                    -- Code Matches (Lower priority)
                    WHEN ${devices.code} ILIKE ${"%" + term + "%"} THEN 5
                    
                    ELSE 6
                END`,
                // Secondary sort by newest
                desc(devices.createdAt)
            ) as any;
        } else {
            query = query.orderBy(desc(devices.createdAt)) as any;
        }

        return await query.limit(limit).offset(offset);
    }

    static async getById(id: string) {
        const result = await db.select().from(devices).where(eq(devices.id, id));
        return result[0] || null;
    }

    static async create(data: Omit<typeof devices.$inferInsert, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
        // Normalize brand name and ensure brand exists
        const normalizedBrand = normalizeBrandName(data.brand);

        // Check if brand exists (case-insensitive), create if not
        let existingBrand = await BrandsService.findByName(normalizedBrand);
        if (!existingBrand) {
            // Create brand with normalized name
            const brandId = normalizedBrand.toLowerCase().replace(/\s+/g, '-');
            const createdBrands = await BrandsService.create({
                id: brandId,
                name: normalizedBrand
            });
            existingBrand = createdBrands[0];
        }

        const id = data.id || `DEV-${uuidv4().substring(0, 8)}`; // emulate short ID or just use full UUID
        const result = await db
            .insert(devices)
            .values({ ...data, id, brand: normalizedBrand }) // Use normalized brand
            .returning();
        return result[0];
    }

    static async update(id: string, data: Partial<typeof devices.$inferInsert>) {
        const result = await db
            .update(devices)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(devices.id, id))
            .returning();
        return result[0];
    }

    static async delete(id: string) {
        // Cascade handles relation deletion in DB, but good to know
        const result = await db
            .delete(devices)
            .where(eq(devices.id, id))
            .returning();
        return result[0];
    }

    static async bulkDelete(ids: string[]) {
        const result = await db
            .delete(devices)
            .where(inArray(devices.id, ids))
            .returning();
        return result;
    }
}
