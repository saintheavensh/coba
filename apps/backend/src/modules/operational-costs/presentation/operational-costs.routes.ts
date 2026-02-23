import { Hono } from "hono";
import { OperationalCostsController } from "./operational-costs.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { requireRole } from "../../../middlewares/permission.middleware";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const app = new Hono();
const controller = new OperationalCostsController();

app.use("*", authMiddleware);
app.use("*", requireRole("super_admin", "owner", "manager"));

app.get("/", (c) => controller.getAll(c));

app.post(
    "/",
    zValidator(
        "json",
        z.object({
            category: z.string(),
            amount: z.number().or(z.string()),
            description: z.string().optional(),
            date: z.string().optional(),
            sourceAccountId: z.string().optional(),
            expenseAccountId: z.string().optional()
        })
    ),
    (c) => controller.create(c)
);

app.delete("/:id", (c) => controller.delete(c));

export default app;
