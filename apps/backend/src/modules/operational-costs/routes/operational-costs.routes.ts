import { Hono } from "hono";
import { OperationalCostsController } from "../controllers/operational-costs.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const operationalCosts = new Hono();

operationalCosts.use("*", authMiddleware);

operationalCosts.get("/", OperationalCostsController.getAll);

operationalCosts.post(
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
    OperationalCostsController.create
);

operationalCosts.delete("/:id", OperationalCostsController.delete);

export default operationalCosts;
