import { db } from "../../db";
import { notifications } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export class NotificationsRepository {
    async findByUserId(userId: string) {
        return await db.query.notifications.findMany({
            where: eq(notifications.userId, userId),
            orderBy: [desc(notifications.createdAt)],
            limit: 20
        });
    }

    async markRead(id: number) {
        return await db.update(notifications)
            .set({ isRead: true })
            .where(eq(notifications.id, id));
    }

    async create(data: typeof notifications.$inferInsert) {
        return await db.insert(notifications).values(data);
    }
}
