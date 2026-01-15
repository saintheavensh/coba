// Users Repository
import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

export class UsersRepository {
    async findAll(role?: string) {
        if (role) {
            return await db.select({
                id: users.id,
                name: users.name,
                role: users.role,
                image: users.image
            })
                .from(users)
                .where(eq(users.role, role as any));
        }

        return await db.select({
            id: users.id,
            name: users.name,
            role: users.role,
            image: users.image
        }).from(users);
    }
}
