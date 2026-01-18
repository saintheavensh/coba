import { db } from "../../db";
import { devices, productDeviceCompatibility } from "../../db/schema";
import { eq, desc, ilike, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export class DevicesService {
    static async getAll(search?: string) {
        if (search) {
            return await db
                .select()
                .from(devices)
                .where(
                    or(
                        ilike(devices.brand, `%${search}%`),
                        ilike(devices.model, `%${search}%`),
                        ilike(devices.code, `%${search}%`)
                    )
                )
                .orderBy(desc(devices.createdAt));
        }
        return await db.select().from(devices).orderBy(desc(devices.createdAt));
    }

    static async getById(id: string) {
        const result = await db.select().from(devices).where(eq(devices.id, id));
        return result[0] || null;
    }

    static async create(data: Omit<typeof devices.$inferInsert, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
        const id = data.id || `DEV-${uuidv4().substring(0, 8)}`; // emulate short ID or just use full UUID
        const result = await db
            .insert(devices)
            .values({ ...data, id })
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
}
