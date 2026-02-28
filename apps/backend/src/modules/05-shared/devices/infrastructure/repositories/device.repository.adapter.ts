import { db } from "../../../../../shared/infrastructure/database/client";
import { devices, products, productDeviceCompatibility } from "../../../../../shared/infrastructure/database/schema";
import { eq, or, and, sql, inArray, ilike, desc, isNull } from "drizzle-orm";
import { DBContext } from "../../../../../shared/types/db-context";
import { IDeviceRepository, IDeviceFilters, Device, CreateDeviceData, UpdateDeviceData } from "../../domain";

export class DeviceRepositoryAdapter implements IDeviceRepository {
    async findAll(filters: IDeviceFilters, dbOrTx?: DBContext): Promise<Device[]> {
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
            query = query.where(and(...conditions));
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
            );
        } else {
            query = query.orderBy(desc(devices.createdAt));
        }

        return await query.limit(limit).offset(offset) as Device[];
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<Device | null> {
        const client = (dbOrTx as any) || db;
        const result = await client.select().from(devices).where(eq(devices.id, id));
        return (result[0] as Device) || null;
    }

    async create(data: CreateDeviceData, dbOrTx?: DBContext): Promise<Device> {
        const client = (dbOrTx as any) || db;
        const result = await client.insert(devices).values(data).returning();
        return result[0] as Device;
    }

    async update(id: string, data: UpdateDeviceData, dbOrTx?: DBContext): Promise<Device> {
        const client = (dbOrTx as any) || db;
        const result = await client
            .update(devices)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(devices.id, id))
            .returning();
        return result[0] as Device;
    }

    async delete(id: string, dbOrTx?: DBContext): Promise<Device> {
        const client = (dbOrTx as any) || db;
        const result = await client.delete(devices).where(eq(devices.id, id)).returning();
        return result[0] as Device;
    }

    async bulkDelete(ids: string[], dbOrTx?: DBContext): Promise<Device[]> {
        const client = (dbOrTx as any) || db;
        return await client.delete(devices).where(inArray(devices.id, ids)).returning() as Device[];
    }

    async getUnlinkedProducts(limit: number = 50, offset: number = 0, dbOrTx?: DBContext): Promise<any[]> {
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

    async findProductsByName(name: string, dbOrTx?: DBContext): Promise<any[]> {
        const client = (dbOrTx as any) || db;
        return await client.select().from(products)
            .where(ilike(products.name, `%${name}%`));
    }

    async addCompatibilityLinks(links: { productId: string; deviceId: string }[], dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        if (links.length === 0) return;
        await client.insert(productDeviceCompatibility)
            .values(links)
            .onConflictDoNothing();
    }
}
