import { db } from "../../../db";
import { roles } from "../../../db/schema";
import { eq, sql } from "drizzle-orm";

export class RoleModel {
    static async findAll() {
        return db.select().from(roles).orderBy(roles.id);
    }

    static async findById(id: string) {
        const [role] = await db.select().from(roles).where(eq(roles.id, id));
        return role;
    }
}
