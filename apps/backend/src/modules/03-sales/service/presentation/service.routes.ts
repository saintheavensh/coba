import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ServiceController } from "./service.controller";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";
import { createServiceSchema } from "@repo/shared";

const app = new Hono();
const controller = new ServiceController();

app.use("*", authMiddleware);

app.get("/", (c) => controller.getAll(c));
app.get("/counts", (c) => controller.getCounts(c));
app.get("/dashboard/stats", (c) => controller.getStats(c));
app.get("/:id", (c) => controller.getById(c));
app.get("/:id/print", (c) => controller.printService(c));

app.post("/", zValidator("json", createServiceSchema), (c) => controller.createService(c));
app.post("/:id/assign", (c) => controller.assignTechnician(c));

app.put("/:id/status", (c) => controller.updateStatus(c));
app.put("/:id/details", (c) => controller.updateDetails(c));

app.patch("/:id", (c) => controller.patchService(c));

app.delete("/:id", (c) => controller.deleteService(c));

export default app;
