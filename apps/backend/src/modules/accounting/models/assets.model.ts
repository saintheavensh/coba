import { db } from "../../../db";
import { assets, assetDepreciationLogs } from "../../../db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export class AssetModel {
    static async findAll(filters: any) {
        let where = and();
        if (filters.category) where = and(where, eq(assets.category, filters.category));
        if (filters.status) where = and(where, eq(assets.status, filters.status));

        return db
            .select()
            .from(assets)
            .where(where)
            .orderBy(desc(assets.purchaseDate))
            .limit(filters.limit || 50)
            .offset(filters.offset || 0);
    }

    static async findById(id: string) {
        const [asset] = await db
            .select()
            .from(assets)
            .where(eq(assets.id, id));
        return asset;
    }

    static async countAll() {
        const result = await db.select({ count: sql<number>`count(*)` }).from(assets);
        return Number(result[0]?.count || 0);
    }

    static async create(data: any) {
        return db.insert(assets).values(data);
    }

    static async update(id: string, data: any) {
        return db.update(assets).set(data).where(eq(assets.id, id));
    }

    static async delete(id: string) {
        return db.delete(assets).where(eq(assets.id, id));
    }

    static async findDepreciationLogs(assetId: string) {
        return db
            .select()
            .from(assetDepreciationLogs)
            .where(eq(assetDepreciationLogs.assetId, assetId))
            .orderBy(desc(assetDepreciationLogs.period));
    }

    static async insertDepreciationLog(data: any) {
        return db.insert(assetDepreciationLogs).values(data);
    }
}
