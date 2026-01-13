import { Hono } from "hono";
import {
    SettingsService,
    PaymentMethodConfig,
    StoreInfo,
    ReceiptSettings,
    ServiceSettings,
    WhatsAppSettings,
} from "./settings.service";
import { authMiddleware } from "../../middlewares/auth.middleware";

const settingsController = new Hono();
const service = new SettingsService();

settingsController.use("*", authMiddleware);

// ============================================
// GET ALL SETTINGS
// ============================================

settingsController.get("/", async (c) => {
    const all = await service.getAll();
    return c.json({ success: true, data: all });
});

// ============================================
// PAYMENT METHODS
// ============================================

settingsController.get("/payment-methods", async (c) => {
    const config = await service.getPaymentMethods();
    return c.json({ success: true, data: config });
});

settingsController.put("/payment-methods", async (c) => {
    const body = await c.req.json<PaymentMethodConfig>();
    await service.setPaymentMethods(body);
    return c.json({ success: true, message: "Payment methods updated" });
});

// ============================================
// STORE INFO
// ============================================

settingsController.get("/store-info", async (c) => {
    const info = await service.getStoreInfo();
    return c.json({ success: true, data: info });
});

settingsController.put("/store-info", async (c) => {
    const body = await c.req.json<StoreInfo>();
    await service.setStoreInfo(body);
    return c.json({ success: true, message: "Store info updated" });
});

// ============================================
// RECEIPT SETTINGS
// ============================================

settingsController.get("/receipt", async (c) => {
    const settings = await service.getReceiptSettings();
    return c.json({ success: true, data: settings });
});

settingsController.put("/receipt", async (c) => {
    const body = await c.req.json<ReceiptSettings>();
    await service.setReceiptSettings(body);
    return c.json({ success: true, message: "Receipt settings updated" });
});

// ============================================
// SERVICE SETTINGS
// ============================================

settingsController.get("/service", async (c) => {
    const settings = await service.getServiceSettings();
    return c.json({ success: true, data: settings });
});

settingsController.put("/service", async (c) => {
    const body = await c.req.json<ServiceSettings>();
    await service.setServiceSettings(body);
    return c.json({ success: true, message: "Service settings updated" });
});

// ============================================
// WHATSAPP SETTINGS
// ============================================

settingsController.get("/whatsapp", async (c) => {
    const settings = await service.getWhatsAppSettings();
    return c.json({ success: true, data: settings });
});

settingsController.put("/whatsapp", async (c) => {
    const body = await c.req.json<WhatsAppSettings>();
    await service.setWhatsAppSettings(body);
    return c.json({ success: true, message: "WhatsApp settings updated" });
});

// ============================================
// GENERIC SETTING (Fallback)
// ============================================

settingsController.get("/:key", async (c) => {
    const key = c.req.param("key");
    const value = await service.get(key, null);
    return c.json({ success: true, data: value });
});

settingsController.put("/:key", async (c) => {
    const key = c.req.param("key");
    const body = await c.req.json();
    await service.set(key, body.value);
    return c.json({ success: true, message: "Setting updated" });
});

export { settingsController };
