import { Hono } from "hono";
import { WhatsAppController } from "./whatsapp.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const app = new Hono();
const controller = new WhatsAppController();

// Protect all routes
app.use("*", authMiddleware);

// Define endpoints
app.post("/send", (c) => controller.sendMessage(c));

export default app;
