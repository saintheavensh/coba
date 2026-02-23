import { Hono } from "hono";
import { NotificationsController } from "./notifications.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const app = new Hono();
const controller = new NotificationsController();

app.use("*", authMiddleware);

app.get("/", (c) => controller.getUserNotifications(c));
app.put("/:id/read", (c) => controller.markAsRead(c));
app.post("/", (c) => controller.createNotification(c));

export default app;
