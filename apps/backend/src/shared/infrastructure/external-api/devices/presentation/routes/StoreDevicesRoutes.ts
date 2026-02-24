import { Hono } from "hono";
import { authMiddleware } from "../../../../../../middlewares/auth.middleware";
import { StoreDevicesController } from "../controllers/StoreDevicesController";
import { Container } from "inversify";
import { deviceContainer } from "../../DeviceContainer";
import { TYPES } from "../../types";

const app = new Hono();

// Resolve from container
const container = new Container();
container.load(deviceContainer);
const controller = container.get<StoreDevicesController>(StoreDevicesController);

app.post("/register", authMiddleware, (c) => controller.register(c));
app.get("/:deviceId/status", authMiddleware, (c) => controller.getStatus(c));
app.post("/:deviceId/ping", authMiddleware, (c) => controller.ping(c));

export default app;
