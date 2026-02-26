import { db } from "../../../../../db";
import { users, userSessions } from "../../../../../db/schema";
import { eq, and } from "drizzle-orm";
import type { IUserRepository, UserWithRoles } from "../../domain";

export class DrizzleAuthRepository implements IUserRepository {
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

    async createSession(userId: string, role: string, dbOrTx: any = db): Promise<string> {
        const [session] = await dbOrTx.insert(userSessions).values({
            userId,
            role,
            isActive: true
        }).returning({ id: userSessions.id });
        return session.id;
    }

    async deactivateSession(sessionId: string, dbOrTx: any = db): Promise<void> {
        await dbOrTx.update(userSessions)
            .set({ isActive: false, logoutTime: new Date() })
            .where(eq(userSessions.id, sessionId));
    }
}

