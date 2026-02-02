import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { SuppliersController } from "../controllers/suppliers.controller";

const app = new Hono();
const controller = new SuppliersController();

const supplierSchema = z.object({
    name: z.string().min(1, "Name is required"),
    contact: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    image: z.string().optional()
});

app.get("/", (c) => controller.getAll(c));
app.post("/", zValidator("json", supplierSchema), (c) => controller.create(c));
app.put("/:id", zValidator("json", supplierSchema), (c) => controller.update(c));
app.delete("/:id", (c) => controller.delete(c));

export default app;
