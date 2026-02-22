import { DBContext } from "../../../shared/types/db-context";
import { db } from "../../../db";
import { devices, products, productDeviceCompatibility } from "../../../db/schema";
import { eq, or, and, sql, inArray, ilike, desc, isNull } from "drizzle-orm";

export class DevicesModel {
    async findAll(filters: { search?: string, limit?: number, offset?: number, brand?: string } = {}, dbOrTx?: DBContext) {
        const client = (dbOrTx as any) || db;
        const { search, limit = 50, offset = 0, brand } = filters;

        let query = client.select().from(devices);

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

    async findById(id: string, dbOrTx?: DBContext) {
        const client = (dbOrTx as any) || db;
        const result = await client.select().from(devices).where(eq(devices.id, id));
        return result[0] || null;
    }

    async create(data: typeof devices.$inferInsert, dbOrTx?: DBContext) {
        const client = (dbOrTx as any) || db;
        const result = await client.insert(devices).values(data).returning();
        return result[0];
    }

    async update(id: string, data: Partial<typeof devices.$inferInsert>, dbOrTx?: DBContext) {
        const client = (dbOrTx as any) || db;
        const result = await client
            .update(devices)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(devices.id, id))
            .returning();
        return result[0];
    }

    async delete(id: string, dbOrTx?: DBContext) {
        const client = (dbOrTx as any) || db;
        const result = await client.delete(devices).where(eq(devices.id, id)).returning();
        return result[0];
    }

    async bulkDelete(ids: string[], dbOrTx?: DBContext) {
        const client = (dbOrTx as any) || db;
        return client.delete(devices).where(inArray(devices.id, ids)).returning();
    }

    async getUnlinkedProducts(limit: number = 50, offset: number = 0, dbOrTx?: DBContext) {
        const client = (dbOrTx as any) || db;
        return await client.select({
            id: products.id,
            name: products.name,
            code: products.code,
            stock: products.stock,
            image: products.image
        })
            .from(products)
            .leftJoin(productDeviceCompatibility, eq(products.id, productDeviceCompatibility.productId))
            .where(isNull(productDeviceCompatibility.productId))
            .limit(limit)
            .offset(offset);
    }

    async findProductsByName(name: string, dbOrTx?: DBContext) {
        const client = (dbOrTx as any) || db;
        return await client.select().from(products)
            .where(ilike(products.name, `%${name}%`));
    }

    async addCompatibilityLinks(links: { productId: string; deviceId: string }[], dbOrTx?: DBContext) {
        const client = (dbOrTx as any) || db;
        if (links.length === 0) return;
        await client.insert(productDeviceCompatibility)
            .values(links)
            .onConflictDoNothing();
    }
}
