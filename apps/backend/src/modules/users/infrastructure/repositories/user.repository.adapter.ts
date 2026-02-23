import { eq, sql } from "drizzle-orm";
import { DBContext } from "../../../../shared/types/db-context";
import { db } from "../../../../db";
import { users, userRoles } from "../../../../db/schema";
import { IUserRepository, User } from "../../domain";

export class UserRepositoryAdapter implements IUserRepository {
    async findAll(role?: string, dbOrTx?: DBContext): Promise<User[]> {
        const client = (dbOrTx as any) || db;

        if (role) {
            return await client.query.users.findMany({
                where: sql`EXISTS (
                    SELECT 1 FROM user_roles 
                    WHERE user_roles.user_id = users.id 
                    AND user_roles.role_id = ${role}
                )`,
                with: { roles: { with: { role: true } } }
            }) as User[];
        }

        return await client.query.users.findMany({
            with: { roles: { with: { role: true } } }
        }) as User[];
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<User | null> {
        const client = (dbOrTx as any) || db;
        const result = await client.query.users.findFirst({
            where: eq(users.id, id),
            with: { roles: { with: { role: true } } }
        });
        return (result as User) || null;
    }

    async create(data: any, dbOrTx?: DBContext): Promise<User> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.insert(users).values(data).returning();
        return result as User;
    }

    async update(id: string, data: any, dbOrTx?: DBContext): Promise<User> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.update(users)
            .set(data)
            .where(eq(users.id, id))
            .returning();
        return result as User;
    }

    async delete(id: string, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.delete(users).where(eq(users.id, id));
    }

    async syncRoles(userId: string, roles: string[], dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;

        // Delete existing roles
        await client.delete(userRoles).where(eq(userRoles.userId, userId));

        // Insert new roles
        if (roles.length > 0) {
            const roleValues = roles.map((roleId: string) => ({
                userId: userId,
                roleId: roleId
            }));
            await client.insert(userRoles).values(roleValues);
        }
    }
}
