// Users Repository
import { db } from "../../../db";
import { users } from "../../../db/schema";
import { eq } from "drizzle-orm";

export class UsersModel {
    async findAll(role?: string, dbOrTx: any = db) {
        if (role) {
            return await dbOrTx.select({
                id: users.id,
                name: users.name,
                role: users.role,
                image: users.image
            })
                .from(users)
                .where(eq(users.role, role as any));
        }

        return await dbOrTx.select({
            id: users.id,
            name: users.name,
            role: users.role,
            image: users.image
        }).from(users);
    }

    async findById(id: string, dbOrTx: any = db) {
        const result = await dbOrTx.select().from(users).where(eq(users.id, id));
        return result[0] || null;
    }

    async create(data: typeof users.$inferInsert, dbOrTx: any = db) {
        return await dbOrTx.insert(users).values(data).returning();
    }

    async update(id: string, data: Partial<typeof users.$inferInsert>, dbOrTx: any = db) {
        return await dbOrTx.update(users)
            .set(data)
            .where(eq(users.id, id))
            .returning();
    }

    async delete(id: string, dbOrTx: any = db) {
        return await dbOrTx.delete(users).where(eq(users.id, id)).returning();
    }
}
