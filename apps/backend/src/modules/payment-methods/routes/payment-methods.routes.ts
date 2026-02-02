import { Hono } from "hono";
import { PaymentMethodsController } from "../controllers/payment-methods.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const paymentMethods = new Hono();

paymentMethods.use("*", authMiddleware);

paymentMethods.get("/", PaymentMethodsController.getAll);
paymentMethods.get("/enabled", PaymentMethodsController.getEnabled);

const createSchema = z.object({
    name: z.string(),
    type: z.enum(["cash", "transfer", "qris", "ewallet", "custom"]),
    icon: z.string().default("💵"),
});

paymentMethods.post("/", zValidator("json", createSchema), PaymentMethodsController.create);
paymentMethods.patch("/:id", PaymentMethodsController.update);
paymentMethods.delete("/:id", PaymentMethodsController.disable);

// Variants
paymentMethods.post("/:id/variants", PaymentMethodsController.addVariant);
paymentMethods.patch("/variants/:id", PaymentMethodsController.updateVariant);
paymentMethods.delete("/variants/:id", PaymentMethodsController.disableVariant);

export default paymentMethods;
