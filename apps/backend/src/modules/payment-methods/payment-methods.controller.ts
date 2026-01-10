import { Hono } from "hono";
import { PaymentMethodsService } from "./payment-methods.service";
import { authMiddleware } from "../../middlewares/auth.middleware";

const paymentMethodsController = new Hono();
const service = new PaymentMethodsService();

// Seed defaults on startup
service.seedDefaults().catch(console.error);

// Get all payment methods (with all variants, including disabled)
paymentMethodsController.get("/", authMiddleware, async (c) => {
    const methods = await service.getAll();
    return c.json({ success: true, data: methods });
});

// Get only enabled payment methods (for payment flow)
paymentMethodsController.get("/enabled", authMiddleware, async (c) => {
    const methods = await service.getEnabled();
    return c.json({ success: true, data: methods });
});

// Get a single payment method
paymentMethodsController.get("/:id", authMiddleware, async (c) => {
    const id = c.req.param("id");
    const method = await service.getById(id);
    if (!method) {
        return c.json({ success: false, message: "Payment method not found" }, 404);
    }
    return c.json({ success: true, data: method });
});

// Create a new payment method
paymentMethodsController.post("/", authMiddleware, async (c) => {
    const body = await c.req.json();
    const method = await service.create(body);
    return c.json({ success: true, data: method });
});

// Update a payment method
paymentMethodsController.put("/:id", authMiddleware, async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const method = await service.update(id, body);
    return c.json({ success: true, data: method });
});

// Disable (soft delete) a payment method
paymentMethodsController.delete("/:id", authMiddleware, async (c) => {
    const id = c.req.param("id");
    await service.disable(id);
    return c.json({ success: true, message: "Payment method disabled" });
});

// Add a variant to a method
paymentMethodsController.post("/:id/variants", authMiddleware, async (c) => {
    const methodId = c.req.param("id");
    const body = await c.req.json();
    const method = await service.addVariant(methodId, body);
    return c.json({ success: true, data: method });
});

// Update a variant
paymentMethodsController.put("/:id/variants/:variantId", authMiddleware, async (c) => {
    const variantId = c.req.param("variantId");
    const body = await c.req.json();
    await service.updateVariant(variantId, body);
    return c.json({ success: true, message: "Variant updated" });
});

// Disable (soft delete) a variant
paymentMethodsController.delete("/:id/variants/:variantId", authMiddleware, async (c) => {
    const variantId = c.req.param("variantId");
    await service.disableVariant(variantId);
    return c.json({ success: true, message: "Variant disabled" });
});

export { paymentMethodsController };
