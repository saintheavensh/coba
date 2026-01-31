import { Hono } from "hono";
import {
    SettingsService,
    PaymentMethodConfig,
    StoreInfo,
    ReceiptSettings,
    ServiceSettings,
    WhatsAppSettings,
    CommissionSettings,
    AccountMappingSettings,
    GeneralSettings,
} from "./settings.service";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { apiSuccess, apiError } from "../../lib/response";

const settingsController = new Hono();
const service = new SettingsService();

settingsController.use("*", authMiddleware);

// ============================================
// GET ALL SETTINGS
// ============================================

settingsController.get("/", async (c) => {
    try {
        const all = await service.getAll();
        return apiSuccess(c, all);
    } catch (e) {
        return apiError(c, e, "Failed to fetch settings");
    }
});

// ============================================
// PAYMENT METHODS
// ============================================

settingsController.get("/payment-methods", async (c) => {
    try {
        const config = await service.getPaymentMethods();
        return apiSuccess(c, config);
    } catch (e) {
        return apiError(c, e, "Failed to fetch payment methods");
    }
});

settingsController.put("/payment-methods", async (c) => {
    try {
        const body = await c.req.json<PaymentMethodConfig>();
        await service.setPaymentMethods(body);
        return apiSuccess(c, null, "Payment methods updated");
    } catch (e) {
        return apiError(c, e, "Failed to update payment methods");
    }
});

// ============================================
// STORE INFO
// ============================================

settingsController.get("/store-info", async (c) => {
    try {
        const info = await service.getStoreInfo();
        return apiSuccess(c, info);
    } catch (e) {
        return apiError(c, e, "Failed to fetch store info");
    }
});

settingsController.put("/store-info", async (c) => {
    try {
        const body = await c.req.json<StoreInfo>();
        await service.setStoreInfo(body);
        return apiSuccess(c, null, "Store info updated");
    } catch (e) {
        return apiError(c, e, "Failed to update store info");
    }
});

// ============================================
// RECEIPT SETTINGS
// ============================================

settingsController.get("/receipt", async (c) => {
    try {
        const settings = await service.getReceiptSettings();
        return apiSuccess(c, settings);
    } catch (e) {
        return apiError(c, e, "Failed to fetch receipt settings");
    }
});

settingsController.put("/receipt", async (c) => {
    try {
        const body = await c.req.json<ReceiptSettings>();
        await service.setReceiptSettings(body);
        return apiSuccess(c, null, "Receipt settings updated");
    } catch (e) {
        return apiError(c, e, "Failed to update receipt settings");
    }
});

// ============================================
// SERVICE SETTINGS
// ============================================

settingsController.get("/service", async (c) => {
    try {
        const settings = await service.getServiceSettings();
        return apiSuccess(c, settings);
    } catch (e) {
        return apiError(c, e, "Failed to fetch service settings");
    }
});

settingsController.put("/service", async (c) => {
    try {
        const body = await c.req.json<ServiceSettings>();
        await service.setServiceSettings(body);
        return apiSuccess(c, null, "Service settings updated");
    } catch (e) {
        return apiError(c, e, "Failed to update service settings");
    }
});

// ============================================
// WHATSAPP SETTINGS
// ============================================

settingsController.get("/whatsapp", async (c) => {
    try {
        const settings = await service.getWhatsAppSettings();
        return apiSuccess(c, settings);
    } catch (e) {
        return apiError(c, e, "Failed to fetch WhatsApp settings");
    }
});

settingsController.put("/whatsapp", async (c) => {
    try {
        const body = await c.req.json<WhatsAppSettings>();
        await service.setWhatsAppSettings(body);
        return apiSuccess(c, null, "WhatsApp settings updated");
    } catch (e) {
        return apiError(c, e, "Failed to update WhatsApp settings");
    }
});

// ============================================
// COMMISSION SETTINGS
// ============================================

settingsController.get("/commission", async (c) => {
    try {
        const settings = await service.getCommissionSettings();
        return apiSuccess(c, settings);
    } catch (e) {
        return apiError(c, e, "Failed to fetch commission settings");
    }
});

settingsController.put("/commission", async (c) => {
    try {
        const body = await c.req.json<CommissionSettings>();
        await service.setCommissionSettings(body);
        return apiSuccess(c, null, "Commission settings updated");
    } catch (e) {
        return apiError(c, e, "Failed to update commission settings");
    }
});

// ============================================
// ACCOUNT MAPPINGS
// ============================================

settingsController.get("/account-mappings", async (c) => {
    try {
        const mappings = await service.getAccountMappings();
        return apiSuccess(c, mappings);
    } catch (e) {
        return apiError(c, e, "Failed to fetch account mappings");
    }
});

settingsController.put("/account-mappings", async (c) => {
    try {
        const body = await c.req.json<AccountMappingSettings>();
        await service.setAccountMappings(body);
        return apiSuccess(c, null, "Account mappings updated");
    } catch (e) {
        return apiError(c, e, "Failed to update account mappings");
    }
});

// ============================================
// GENERAL SETTINGS (Accounting Mode)
// ============================================

settingsController.get("/general", async (c) => {
    try {
        const settings = await service.getGeneralSettings();
        return apiSuccess(c, settings);
    } catch (e) {
        return apiError(c, e, "Failed to fetch general settings");
    }
});

settingsController.put("/general", async (c) => {
    try {
        const body = await c.req.json<GeneralSettings>();
        await service.setGeneralSettings(body);
        return apiSuccess(c, null, "General settings updated");
    } catch (e) {
        return apiError(c, e, "Failed to update general settings");
    }
});

// ============================================
// FACTORY RESET
// ============================================

settingsController.post("/reset", async (c) => {
    try {
        const body = await c.req.json<{ mode: "data" | "full" }>();
        if (!body.mode) return c.json({ success: false, message: "Mode is required ('data' | 'full')" }, 400);

        await service.factoryReset(body.mode);
        return apiSuccess(c, null, "Factory reset completed successfully");
    } catch (e) {
        return apiError(c, e, "Factory reset failed");
    }
});

// ============================================
// GENERIC SETTING (Fallback)
// ============================================

settingsController.get("/:key", async (c) => {
    try {
        const key = c.req.param("key");
        const value = await service.get(key, null);
        return apiSuccess(c, value);
    } catch (e) {
        return apiError(c, e, "Failed to fetch setting");
    }
});

settingsController.put("/:key", async (c) => {
    try {
        const key = c.req.param("key");
        const body = await c.req.json();
        await service.set(key, body.value);
        return apiSuccess(c, null, "Setting updated");
    } catch (e) {
        return apiError(c, e, "Failed to update setting");
    }
});

export { settingsController };
