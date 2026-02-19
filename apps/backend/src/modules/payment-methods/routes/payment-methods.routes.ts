import { Hono } from "hono";
import { PaymentMethodsController } from "../controllers/payment-methods.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { requireRole } from "../../../middlewares/permission.middleware";
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

paymentMethods.post("/", requireRole("super_admin", "owner"), zValidator("json", createSchema), PaymentMethodsController.create);
paymentMethods.patch("/:id", requireRole("super_admin", "owner"), PaymentMethodsController.update);
paymentMethods.delete("/:id", requireRole("super_admin", "owner"), PaymentMethodsController.disable);

// Variants
paymentMethods.post("/:id/variants", requireRole("super_admin", "owner"), PaymentMethodsController.addVariant);
paymentMethods.patch("/variants/:id", requireRole("super_admin", "owner"), PaymentMethodsController.updateVariant);
paymentMethods.delete("/variants/:id", requireRole("super_admin", "owner"), PaymentMethodsController.disableVariant);

export default paymentMethods;
