import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { SalesController } from "../controllers/sales.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/permission.middleware";
import { apiError, apiSuccess } from "../../../lib/response";

const app = new Hono();
const controller = new SalesController();

import { createSaleSchema } from "@repo/shared";

app.use("*", authMiddleware);

app.get("/", requirePermission("sale.read", "sale.create"), (c) => controller.getAll(c));
app.get("/:id", requirePermission("sale.read", "sale.create"), (c) => controller.getOne(c));
app.post("/", requirePermission("sale.create"), zValidator("json", createSaleSchema), (c) => controller.createSale(c));

export default app;
