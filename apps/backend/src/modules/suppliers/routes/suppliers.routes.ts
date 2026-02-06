import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { SuppliersController } from "../controllers/suppliers.controller";

import { authMiddleware } from "../../../middlewares/auth.middleware";

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
app.post("/", zValidator("json", supplierSchema), (c) => controller.create(c));
app.put("/:id", zValidator("json", supplierSchema), (c) => controller.update(c));
app.delete("/:id", (c) => controller.delete(c));

// Linking
app.post("/:id/categories", zValidator("json", linkCategorySchema), (c) => controller.linkCategory(c));
app.delete("/:id/categories/:categoryId", (c) => controller.unlinkCategory(c));

export default app;
