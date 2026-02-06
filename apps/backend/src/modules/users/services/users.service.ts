import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { users, userRoles } from "../../../db/schema";
import { UsersModel } from "../models/users.model";

export class UsersService {
    private model: UsersModel;

    constructor() {
        this.model = new UsersModel();
    }

    async findAll(role?: string, dbOrTx?: any) {
        return await this.model.findAll(role, dbOrTx);
    }

    async getById(id: string, dbOrTx?: any) {
        return await this.model.findById(id, dbOrTx);
    }

    async create(data: any, dbOrTx: any = db) {
        const { roles, ...userData } = data;
        const result = await this.model.create(userData, dbOrTx);
        const user = result[0];

        if (roles && Array.isArray(roles) && roles.length > 0) {
            const roleValues = roles.map((roleId: string) => ({
                userId: user.id,
                roleId: roleId
            }));
            await dbOrTx.insert(userRoles).values(roleValues);
        } else if (userData.role) {
            // Fallback for single role
            await dbOrTx.insert(userRoles).values({
                userId: user.id,
                roleId: userData.role
            });
        }

        return result;
    }

    async update(id: string, data: any, dbOrTx: any = db) {
        const { roles, ...userData } = data;
        const result = await this.model.update(id, userData, dbOrTx);

        if (roles && Array.isArray(roles)) {
            // Sync roles: delete existing and insert new
            await dbOrTx.delete(userRoles).where(eq(userRoles.userId, id));

            if (roles.length > 0) {
                const roleValues = roles.map((roleId: string) => ({
                    userId: id,
                    roleId: roleId
                }));
                await dbOrTx.insert(userRoles).values(roleValues);
            }
        }

        return result;
    }

    async delete(id: string, dbOrTx?: any) {
        return await this.model.delete(id, dbOrTx);
    }
}
