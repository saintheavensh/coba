// Users Repository
import { db } from "../../../db";
import { users } from "../../../db/schema";
import { eq, sql } from "drizzle-orm";

export class UsersModel {
    async findAll(role?: string, dbOrTx: any = db) {
        if (role) {
            return await dbOrTx.query.users.findMany({
                where: sql`EXISTS (
                    SELECT 1 FROM user_roles 
                    WHERE user_roles.user_id = users.id 
                    AND user_roles.role_id = ${role}
                )`,
                with: { roles: { with: { role: true } } }
            });
        }

        return await dbOrTx.query.users.findMany({
            with: { roles: { with: { role: true } } }
        });
    }

    async findById(id: string, dbOrTx: any = db) {
        return await dbOrTx.query.users.findFirst({
            where: eq(users.id, id),
            with: { roles: { with: { role: true } } }
        });
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
