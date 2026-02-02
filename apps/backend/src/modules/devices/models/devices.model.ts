import { db } from "../../../db";
import { devices } from "../../../db/schema";
import { eq, or, and, sql, inArray, ilike, desc } from "drizzle-orm";

export class DevicesModel {
    static async findAll(filters: { search?: string, limit?: number, offset?: number, brand?: string } = {}, dbOrTx: any = db) {
        const { search, limit = 50, offset = 0, brand } = filters;

        let query = dbOrTx.select().from(devices);

        const conditions = [];
        const term = search?.trim();

        if (term) {
            conditions.push(
                or(
                    sql`${devices.brand} || ' ' || ${devices.model} ILIKE ${"%" + term + "%"}`,
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

        if (term) {
            query = query.orderBy(
                sql`CASE 
                    WHEN ${devices.model} ILIKE ${term} THEN 1
                    WHEN ${combinedName} ILIKE ${term + "%"} THEN 2
                    WHEN ${devices.model} ILIKE ${term + "%"} THEN 3
                    WHEN ${combinedName} ILIKE ${"%" + term + "%"} THEN 4
                    WHEN ${devices.code} ILIKE ${"%" + term + "%"} THEN 5
                    ELSE 6
                END`,
                desc(devices.createdAt)
            ) as any;
        } else {
            query = query.orderBy(desc(devices.createdAt)) as any;
        }

        return query.limit(limit).offset(offset);
    }

    static async findById(id: string, dbOrTx: any = db) {
        const result = await dbOrTx.select().from(devices).where(eq(devices.id, id));
        return result[0] || null;
    }

    static async create(data: typeof devices.$inferInsert, dbOrTx: any = db) {
        const result = await dbOrTx.insert(devices).values(data).returning();
        return result[0];
    }

    static async update(id: string, data: Partial<typeof devices.$inferInsert>, dbOrTx: any = db) {
        const result = await dbOrTx
            .update(devices)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(devices.id, id))
            .returning();
        return result[0];
    }

    static async delete(id: string, dbOrTx: any = db) {
        const result = await dbOrTx.delete(devices).where(eq(devices.id, id)).returning();
        return result[0];
    }

    static async bulkDelete(ids: string[], dbOrTx: any = db) {
        return dbOrTx.delete(devices).where(inArray(devices.id, ids)).returning();
    }
}
