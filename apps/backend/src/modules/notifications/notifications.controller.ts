import { Hono } from "hono";
import { NotificationsService } from "./notifications.service";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { apiError, apiSuccess } from "../../lib/response";

const app = new Hono();
const service = new NotificationsService();

app.use("*", authMiddleware);

app.get("/", async (c) => {
    const userId = c.req.query("userId");
    // const user = c.get("user");
    if (!userId) return apiError(c, "userId required", "Validation Error", 400);

    const list = await service.getUserNotifications(userId);
    return apiSuccess(c, list);
});

app.put("/:id/read", async (c) => {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return apiError(c, "Invalid ID", "Validation Error", 400);

    await service.markAsRead(id);
    return apiSuccess(c, null, "Notification marked as read");
});

// Internal POST usually
app.post("/", async (c) => {
    const data = await c.req.json();
    await service.createNotification(data);
    return apiSuccess(c, null, "Notification created");
});

export default app;
