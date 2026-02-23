import { db } from "../../../db";
import { users } from "../../../db/schema";
import { eq } from "drizzle-orm";
import type { IUserRepository, UserWithRoles } from "../domain";

export class UserRepositoryAdapter implements IUserRepository {
    async findByUsername(username: string, dbOrTx: any = db): Promise<UserWithRoles | null> {
        const row = await dbOrTx.query.users.findFirst({
            where: eq(users.username, username),
            with: { roles: { with: { role: true } } }
        });
        return row as UserWithRoles | null;
    }

    async findById(id: string, dbOrTx: any = db): Promise<UserWithRoles | null> {
        const row = await dbOrTx.query.users.findFirst({
            where: eq(users.id, id),
            with: { roles: { with: { role: true } } }
        });
        return row as UserWithRoles | null;
    }
}
