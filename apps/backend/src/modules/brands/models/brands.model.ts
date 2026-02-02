import { db } from "../../../db";
import { brands } from "../../../db/schema";
import { eq, desc, ilike } from "drizzle-orm";

export class BrandsModel {
    static async findAll(dbOrTx: any = db) {
        return dbOrTx.select().from(brands).orderBy(desc(brands.createdAt));
    }

    static async findByName(name: string, dbOrTx: any = db) {
        const results = await dbOrTx
            .select()
            .from(brands)
            .where(ilike(brands.name, name));
        return results[0] || null;
    }

    static async findById(id: string, dbOrTx: any = db) {
        const results = await dbOrTx
            .select()
            .from(brands)
            .where(eq(brands.id, id));
        return results[0] || null;
    }

    static async create(data: typeof brands.$inferInsert, dbOrTx: any = db) {
        return dbOrTx.insert(brands).values(data).returning();
    }

    static async update(id: string, data: Partial<typeof brands.$inferInsert>, dbOrTx: any = db) {
        return dbOrTx
            .update(brands)
            .set(data)
            .where(eq(brands.id, id))
            .returning();
    }

    static async delete(id: string, dbOrTx: any = db) {
        return dbOrTx.delete(brands).where(eq(brands.id, id)).returning();
    }
}
