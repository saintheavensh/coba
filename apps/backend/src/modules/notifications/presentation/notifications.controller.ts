import { Context } from "hono";
import { notificationsService, NotificationsService } from "../notifications-container";
import { apiSuccess, apiError } from "../../../lib/response";

export class NotificationsController {
    constructor(
        private readonly service: NotificationsService = notificationsService
    ) { }

    async getUserNotifications(c: Context) {
        try {
            const userId = c.req.query("userId");
            if (!userId) return apiError(c, "userId required", "Validation Error", 400);

            const list = await this.service.getUserNotifications(userId);
            return apiSuccess(c, list);
        } catch (e: any) {
            return apiError(c, e.message || String(e));
        }
    }

    async markAsRead(c: Context) {
        try {
            const id = c.req.param("id");
            if (!id) return apiError(c, "id required", "Validation Error", 400);

            await this.service.markAsRead(id);
            return apiSuccess(c, null, "Notification marked as read");
        } catch (e: any) {
            return apiError(c, e.message || String(e));
        }
    }

    async createNotification(c: Context) {
        try {
            const data = await c.req.json();
            await this.service.createNotification(data);
            return apiSuccess(c, null, "Notification created");
        } catch (e: any) {
            return apiError(c, e.message || String(e));
        }
    }
}
