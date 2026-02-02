import { Context } from "hono";
import { NotificationsService } from "../services/notifications.service";
import { apiError, apiSuccess } from "../../../lib/response";

const service = new NotificationsService();

export class NotificationsController {
    static async getUserNotifications(c: Context) {
        try {
            const userId = c.req.query("userId");
            if (!userId) return apiError(c, "userId required", "Validation Error", 400);

            const list = await service.getUserNotifications(userId);
            return apiSuccess(c, list);
        } catch (e: any) {
            return apiError(c, e.message || String(e));
        }
    }

    static async markAsRead(c: Context) {
        try {
            const id = parseInt(c.req.param("id"));
            if (isNaN(id)) return apiError(c, "Invalid ID", "Validation Error", 400);

            await service.markAsRead(id);
            return apiSuccess(c, null, "Notification marked as read");
        } catch (e: any) {
            return apiError(c, e.message || String(e));
        }
    }

    static async createNotification(c: Context) {
        try {
            const data = await c.req.json();
            await service.createNotification(data);
            return apiSuccess(c, null, "Notification created");
        } catch (e: any) {
            return apiError(c, e.message || String(e));
        }
    }
}
