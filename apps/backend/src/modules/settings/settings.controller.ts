import { Hono } from "hono";
import { SettingsService, PaymentMethodConfig } from "./settings.service";
import { authMiddleware } from "../../middlewares/auth.middleware";

const settingsController = new Hono();
const service = new SettingsService();

settingsController.use("*", authMiddleware);

// Get payment methods configuration
settingsController.get("/payment-methods", async (c) => {
    const config = await service.getPaymentMethods();
    return c.json({ success: true, data: config });
});

// Update payment methods configuration
settingsController.put("/payment-methods", async (c) => {
    const body = await c.req.json<PaymentMethodConfig>();
    await service.setPaymentMethods(body);
    return c.json({ success: true, message: "Payment methods updated" });
});

// Generic get setting
settingsController.get("/:key", async (c) => {
    const key = c.req.param("key");
    const value = await service.get(key, null);
    return c.json({ success: true, data: value });
});

// Generic set setting (admin only)
settingsController.put("/:key", async (c) => {
    const key = c.req.param("key");
    const body = await c.req.json();
    await service.set(key, body.value);
    return c.json({ success: true, message: "Setting updated" });
});

export { settingsController };
