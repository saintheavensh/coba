import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

export class AuthRepository {
    async findByUsername(username: string) {
        return await db.query.users.findFirst({
            where: eq(users.username, username)
        });
    }

    async findById(id: string) {
        return await db.query.users.findFirst({
            where: eq(users.id, id)
        });
    }

    async create(data: typeof users.$inferInsert) {
        return await db.insert(users).values(data).returning();
    }
}
