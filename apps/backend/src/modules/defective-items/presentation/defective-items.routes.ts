import { Hono } from "hono";
import { DefectiveItemsController } from "./defective-items.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/permission.middleware";

const app = new Hono();
const controller = new DefectiveItemsController();

app.use("*", authMiddleware);

app.get("/pending", requirePermission("inventory.read"), (c) => controller.getPending(c));
app.get("/processed", requirePermission("inventory.read"), (c) => controller.getProcessed(c));

app.post("/", requirePermission("inventory.write"), (c) => controller.createItem(c));
app.post("/process-return", requirePermission("purchase-return.create"), (c) => controller.processReturn(c));

export default app;
