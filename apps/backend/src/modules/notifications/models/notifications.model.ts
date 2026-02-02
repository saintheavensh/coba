import { db } from "../../../db";
import { notifications } from "../../../db/schema";
import { eq, desc } from "drizzle-orm";

export class NotificationsModel {
    async findByUserId(userId: string, dbOrTx: any = db) {
        return await dbOrTx.query.notifications.findMany({
            where: eq(notifications.userId, userId),
            orderBy: [desc(notifications.createdAt)],
            limit: 20
        });
    }

    async markRead(id: number, dbOrTx: any = db) {
        return await dbOrTx.update(notifications)
            .set({ isRead: true })
            .where(eq(notifications.id, id));
    }

    async create(data: typeof notifications.$inferInsert, dbOrTx: any = db) {
        return await dbOrTx.insert(notifications).values(data);
    }
}
