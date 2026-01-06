import { Hono } from "hono";
import { NotificationsService } from "./notifications.service";
import { authMiddleware } from "../../middlewares/auth.middleware";

const app = new Hono();
const service = new NotificationsService();

app.use("*", authMiddleware);

app.get("/", async (c) => {
    const userId = c.req.query("userId");
    // const user = c.get("user");
    if (!userId) return c.json({ error: "userId required" }, 400); // Should use context user

    const list = await service.getUserNotifications(userId);
    return c.json(list);
});

app.put("/:id/read", async (c) => {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);

    await service.markAsRead(id);
    return c.json({ success: true });
});

// Internal POST usually
app.post("/", async (c) => {
    const data = await c.req.json();
    await service.createNotification(data);
    return c.json({ success: true });
});

export default app;
