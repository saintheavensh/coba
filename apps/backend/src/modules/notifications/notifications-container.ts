import { NotificationRepositoryAdapter } from "./infrastructure";
import {
    GetUserNotificationsUseCase,
    MarkNotificationAsReadUseCase,
    CreateNotificationUseCase
} from "./application";

// Adapters
const notificationRepository = new NotificationRepositoryAdapter();

// Use Cases
const getUserNotificationsUC = new GetUserNotificationsUseCase(notificationRepository);
const markAsReadUC = new MarkNotificationAsReadUseCase(notificationRepository);
const createNotificationUC = new CreateNotificationUseCase(notificationRepository);

/**
 * NotificationsService — Facade for external and presentation layers.
 */
export class NotificationsService {
    async getUserNotifications(userId: string) {
        return await getUserNotificationsUC.execute(userId);
    }

    async markAsRead(id: string) {
        await markAsReadUC.execute(id);
    }

    async createNotification(data: any) {
        await createNotificationUC.execute(data);
    }
}

/** Singleton instance */
export const notificationsService = new NotificationsService();

export {
    getUserNotificationsUC,
    markAsReadUC,
    createNotificationUC
};
