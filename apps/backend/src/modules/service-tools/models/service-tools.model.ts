import { db } from "../../../db";
import { serviceTools, serviceToolRequests } from "../../../db/schema";
import { eq, desc } from "drizzle-orm";

export class ServiceToolsModel {
    static async findAll() {
        return db.select().from(serviceTools).orderBy(desc(serviceTools.createdAt));
    }

    static async findById(id: string) {
        const results = await db.select().from(serviceTools).where(eq(serviceTools.id, id));
        return results[0] || null;
    }

    static async findByUserId(userId: string) {
        return db.select().from(serviceTools).where(eq(serviceTools.userId, userId)).orderBy(desc(serviceTools.createdAt));
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

    // Tool Requests
    static async findAllRequests() {
        return db.select().from(serviceToolRequests).orderBy(desc(serviceToolRequests.createdAt));
    }

    static async findRequestByUserId(userId: string) {
        return db.select().from(serviceToolRequests).where(eq(serviceToolRequests.userId, userId)).orderBy(desc(serviceToolRequests.createdAt));
    }

    static async createRequest(data: typeof serviceToolRequests.$inferInsert) {
        return db.insert(serviceToolRequests).values(data).returning();
    }

    static async updateRequestStatus(id: string, status: "approved" | "rejected") {
        return db.update(serviceToolRequests).set({ status }).where(eq(serviceToolRequests.id, id)).returning();
    }
}
