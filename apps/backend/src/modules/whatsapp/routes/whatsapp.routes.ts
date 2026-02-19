import { Hono } from "hono";
import { WhatsAppController } from "../controllers/whatsapp.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const whatsapp = new Hono();

// Protect all routes
whatsapp.use("*", authMiddleware);

// Define endpoints
whatsapp.post("/send", WhatsAppController.sendMessage);

export default whatsapp;
