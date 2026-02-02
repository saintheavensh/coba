import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { updateStatusSchema } from "@repo/shared";
import { ServiceController } from "../controllers/service.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const app = new Hono();
const controller = new ServiceController();

app.use("*", authMiddleware);

app.get("/", (c) => controller.getAll(c));
app.post("/", (c) => controller.createService(c));
app.get("/counts", (c) => controller.getCounts(c));
app.get("/stats", (c) => controller.getStats(c));
app.get("/:id", (c) => controller.getById(c));
app.delete("/:id", (c) => controller.deleteService(c));

// Specific updates
app.put("/:id/status", zValidator("json", updateStatusSchema), (c) => controller.updateStatus(c));
app.put("/:id/details", (c) => controller.updateDetails(c));
app.patch("/:id", (c) => controller.patchService(c)); // For reschedule, generic patch
app.patch("/:id/assign", (c) => controller.assignTechnician(c));

// Actions
app.post("/:id/print", (c) => controller.printService(c));

export default app;
