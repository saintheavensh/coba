import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { SuppliersController } from "../controllers/suppliers.controller";

import { authMiddleware } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/permission.middleware";

const app = new Hono();
const controller = new SuppliersController();

const supplierSchema = z.object({
    name: z.string().min(1, "Name is required"),
    contact: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    image: z.string().optional()
});

const linkCategorySchema = z.object({ categoryId: z.string() });

// Apply auth middleware to all routes
app.use("*", authMiddleware);

app.get("/", (c) => controller.getAll(c));
app.get("/:id/categories", (c) => controller.getLinkedCategories(c));
app.post("/", requirePermission("inventory.manage", "purchase.create"), zValidator("json", supplierSchema), (c) => controller.create(c));
app.put("/:id", requirePermission("inventory.manage", "purchase.create"), zValidator("json", supplierSchema), (c) => controller.update(c));
app.delete("/:id", requirePermission("inventory.manage"), (c) => controller.delete(c));

// Linking
app.post("/:id/categories", requirePermission("inventory.manage"), zValidator("json", linkCategorySchema), (c) => controller.linkCategory(c));
app.delete("/:id/categories/:categoryId", requirePermission("inventory.manage"), (c) => controller.unlinkCategory(c));

export default app;
