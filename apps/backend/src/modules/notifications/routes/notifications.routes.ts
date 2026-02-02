import { Hono } from "hono";
import { NotificationsController } from "../controllers/notifications.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const notifications = new Hono();

notifications.use("*", authMiddleware);

notifications.get("/", NotificationsController.getUserNotifications);
notifications.put("/:id/read", NotificationsController.markAsRead);
notifications.post("/", NotificationsController.createNotification);

export default notifications;
