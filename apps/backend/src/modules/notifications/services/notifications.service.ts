import { NotificationsModel } from "../models/notifications.model";

export class NotificationsService {
    private model: NotificationsModel;

    constructor() {
        this.model = new NotificationsModel();
    }

    async getUserNotifications(userId: string, dbOrTx?: any) {
        return await this.model.findByUserId(userId, dbOrTx);
    }

    async markAsRead(id: number, dbOrTx?: any) {
        return await this.model.markRead(id, dbOrTx);
    }

    async createNotification(data: any, dbOrTx?: any) {
        return await this.model.create({
            ...data,
            createdAt: new Date()
        }, dbOrTx);
    }
}
