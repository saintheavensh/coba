import { Hono } from "hono";
import { ServiceToolsController } from "./service-tools.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { requireRole } from "../../../middlewares/permission.middleware";

const app = new Hono();
const controller = new ServiceToolsController();

app.use("*", authMiddleware);

app.get("/", (c) => controller.getAll(c));
app.get("/my", (c) => controller.getMyTools(c));
app.get("/requests/my", (c) => controller.getMyRequests(c));
app.get("/requests/all", (c) => controller.getAllRequests(c));

app.post("/", requireRole("super_admin", "owner", "manager"), (c) => controller.create(c));
app.post("/requests", (c) => controller.createRequest(c));

app.put("/:id", requireRole("super_admin", "owner", "manager"), (c) => controller.update(c));

app.patch("/:id/condition", (c) => controller.updateCondition(c));
app.patch("/requests/:id/status", (c) => controller.updateRequestStatus(c));

app.delete("/:id", requireRole("super_admin", "owner", "manager"), (c) => controller.delete(c));

export default app;
