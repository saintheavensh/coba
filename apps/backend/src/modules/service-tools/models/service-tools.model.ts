import { db } from "../../../db";
import { serviceTools } from "../../../db/schema";
import { eq, desc } from "drizzle-orm";

export class ServiceToolsModel {
    static async findAll() {
        return db.select().from(serviceTools).orderBy(desc(serviceTools.createdAt));
    }

    static async findById(id: string) {
        const results = await db.select().from(serviceTools).where(eq(serviceTools.id, id));
        return results[0] || null;
    }

    static async findLast() {
        return db.select().from(serviceTools).orderBy(desc(serviceTools.id)).limit(1);
    }

    static async create(data: typeof serviceTools.$inferInsert) {
        return db.insert(serviceTools).values(data).returning();
    }

    static async update(id: string, data: Partial<typeof serviceTools.$inferInsert>) {
        return db.update(serviceTools).set(data).where(eq(serviceTools.id, id)).returning();
    }

    static async delete(id: string) {
        return db.delete(serviceTools).where(eq(serviceTools.id, id)).returning();
    }
}
