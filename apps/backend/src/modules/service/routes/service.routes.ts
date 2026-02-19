import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { updateStatusSchema } from "@repo/shared";
import { ServiceController } from "../controllers/service.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { requirePermission, requireRole } from "../../../middlewares/permission.middleware";

const app = new Hono();
const controller = new ServiceController();

app.use("*", authMiddleware);

app.get("/", requirePermission("service.read", "service.update"), (c) => controller.getAll(c));
app.post("/", requirePermission("service.read", "service.update"), (c) => controller.createService(c));
app.get("/counts", requirePermission("service.read", "service.update"), (c) => controller.getCounts(c));
app.get("/stats", requirePermission("service.read", "service.update", "report.read"), (c) => controller.getStats(c));
app.get("/:id", requirePermission("service.read", "service.update"), (c) => controller.getById(c));
app.delete("/:id", requireRole("manager", "owner"), (c) => controller.deleteService(c));

// Specific updates
app.put("/:id/status", requirePermission("service.update"), zValidator("json", updateStatusSchema), (c) => controller.updateStatus(c));
app.put("/:id/details", requirePermission("service.update"), (c) => controller.updateDetails(c));
app.patch("/:id", requirePermission("service.update"), (c) => controller.patchService(c)); // For reschedule, generic patch
app.patch("/:id/assign", requirePermission("employee.manage", "service.update"), (c) => controller.assignTechnician(c));

// Actions
app.post("/:id/print", requirePermission("service.read", "service.update"), (c) => controller.printService(c));

export default app;
