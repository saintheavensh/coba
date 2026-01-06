import { NotificationsRepository } from "./notifications.repository";

export class NotificationsService {
    private repo: NotificationsRepository;

    constructor() {
        this.repo = new NotificationsRepository();
    }

    async getUserNotifications(userId: string) {
        return await this.repo.findByUserId(userId);
    }

    async markAsRead(id: number) {
        return await this.repo.markRead(id);
    }

    async createNotification(data: any) {
        return await this.repo.create({
            ...data,
            createdAt: new Date()
        });
    }
}
