import { eq, sql } from "drizzle-orm";
import { injectable, inject } from "inversify";
import { TYPES } from "../../../../types";
import { DBContext } from "../../../../shared/types/db-context";
import { DrizzleClient } from "../../../../shared/infrastructure/database/DrizzleClient";
import { users, userRoles, roles as rolesTable } from "../../../../db/schema";
import { IUserRepository, User, CreateUserData, UpdateUserData, UserRole, Role } from "../../domain";

type UserRow = typeof users.$inferSelect;
type UserRoleRow = typeof userRoles.$inferSelect;
type RoleRow = typeof rolesTable.$inferSelect;

interface UserRowWithRelations extends UserRow {
    roles: (UserRoleRow & {
        roleDetail: RoleRow;
    })[];
}

@injectable()
export class UserRepositoryAdapter implements IUserRepository {
    constructor(
        @inject(TYPES.DrizzleClient) private readonly dbClient: DrizzleClient
    ) { }

    private mapToUser(row: UserRowWithRelations): User {
        return {
            id: row.id,
            username: row.username,
            name: row.name,
            role: row.role,
            isActive: row.isActive ?? true,
            image: row.image,
            commissionConfig: row.commissionConfig as any,
            createdAt: row.createdAt!,
            updatedAt: row.updatedAt,
            deletedAt: row.deletedAt,
            roles: (row.roles || []).map((ur) => ({
                id: ur.id,
                userId: ur.userId,
                role: ur.role,
                isActive: ur.isActive ?? true,
                createdAt: ur.createdAt!,
                roleDetail: ur.roleDetail ? {
                    id: ur.roleDetail.id,
                    name: ur.roleDetail.name,
                    permissions: ur.roleDetail.permissions as string[],
                    createdAt: ur.roleDetail.createdAt!
                } : undefined
            }))
        };
    }

    async findAll(role?: string, dbOrTx?: DBContext): Promise<User[]> {
        const client = dbOrTx || this.dbClient.getClient();

        let rows;
        if (role) {
            rows = await client.query.users.findMany({
                where: sql`EXISTS (
                    SELECT 1 FROM user_roles 
                    WHERE user_roles.user_id = users.id 
                    AND user_roles.role = ${role}
                )`,
                with: { roles: { with: { roleDetail: true } } }
            });
        } else {
            rows = await client.query.users.findMany({
                with: { roles: { with: { roleDetail: true } } }
            });
        }

        return (rows as UserRowWithRelations[]).map(row => this.mapToUser(row));
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<User | null> {
        const client = dbOrTx || this.dbClient.getClient();
        const row = await client.query.users.findFirst({
            where: eq(users.id, id),
            with: { roles: { with: { roleDetail: true } } }
        });

        if (!row) return null;

        return this.mapToUser(row as UserRowWithRelations);
    }

    async create(data: Omit<CreateUserData, 'roles'>, dbOrTx?: DBContext): Promise<User> {
        const client = dbOrTx || this.dbClient.getClient();
        const [result] = await client.insert(users).values(data).returning();
        if (!result) throw new Error("Failed to create user");
        return this.mapToUser({ ...result, roles: [] } as any);
    }

    async update(id: string, data: Omit<UpdateUserData, 'roles'>, dbOrTx?: DBContext): Promise<User> {
        const client = dbOrTx || this.dbClient.getClient();
        const [result] = await client.update(users)
            .set(data)
            .where(eq(users.id, id))
            .returning();
        if (!result) throw new Error("User not found or update failed");
        return this.mapToUser({ ...result, roles: [] } as any);
    }

    async delete(id: string, dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || this.dbClient.getClient();
        await client.delete(users).where(eq(users.id, id));
    }

    async syncRoles(userId: string, roles: string[], dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || this.dbClient.getClient();

        // Delete existing roles
        await client.delete(userRoles).where(eq(userRoles.userId, userId));

        // Insert new roles
        if (roles.length > 0) {
            const roleValues = roles.map((roleId: string) => ({
                userId: userId,
                role: roleId
            }));
            await client.insert(userRoles).values(roleValues);
        }
    }
}
