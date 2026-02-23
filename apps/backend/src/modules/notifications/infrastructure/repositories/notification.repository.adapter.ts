import { eq, desc } from "drizzle-orm";
import { db } from "../../../../db";
import { notifications } from "../../../../db/schema";
import { DBContext } from "../../../../shared/types/db-context";
import { INotificationRepository, Notification } from "../../domain";

export class NotificationRepositoryAdapter implements INotificationRepository {
    async findByUserId(userId: string, dbOrTx?: DBContext): Promise<Notification[]> {
        const client = (dbOrTx as any) || db;
        const results = await client
            .select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))
            .limit(20);

        return results as Notification[];
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<Notification | null> {
        const client = (dbOrTx as any) || db;
        const [result] = await client
            .select()
            .from(notifications)
            .where(eq(notifications.id, id));

        return (result as Notification) || null;
    }

    async markAsRead(id: string, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client
            .update(notifications)
            .set({ isRead: true })
            .where(eq(notifications.id, id));
    }

    async create(data: Partial<Notification>, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.insert(notifications).values(data);
    }
}
