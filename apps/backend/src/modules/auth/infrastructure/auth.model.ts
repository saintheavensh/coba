import { db } from "../../../db";
import { users } from "../../../db/schema";
import { eq } from "drizzle-orm";

export class AuthModel {
    async findByUsername(username: string, dbOrTx: any = db) {
        return await dbOrTx.query.users.findFirst({
            where: eq(users.username, username),
            with: { roles: { with: { role: true } } }
        });
    }

    async findById(id: string, dbOrTx: any = db) {
        return await dbOrTx.query.users.findFirst({
            where: eq(users.id, id),
            with: { roles: { with: { role: true } } }
        });
    }
}
