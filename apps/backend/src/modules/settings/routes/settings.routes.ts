import { Hono } from "hono";
import { SettingsController } from "../controllers/settings.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const settings = new Hono();

settings.use("*", authMiddleware);

settings.get("/", SettingsController.getAll);

// Payment Methods
settings.get("/payment-methods", SettingsController.getPaymentMethods);
settings.put("/payment-methods", SettingsController.setPaymentMethods);

// Store Info
settings.get("/store-info", SettingsController.getStoreInfo);
settings.put("/store-info", SettingsController.setStoreInfo);

// Receipt
settings.get("/receipt", SettingsController.getReceiptSettings);
settings.put("/receipt", SettingsController.setReceiptSettings);

// Service
settings.get("/service", SettingsController.getServiceSettings);
settings.put("/service", SettingsController.setServiceSettings);

// WhatsApp
settings.get("/whatsapp", SettingsController.getWhatsAppSettings);
settings.put("/whatsapp", SettingsController.setWhatsAppSettings);

// Commission
settings.get("/commission", SettingsController.getCommissionSettings);
settings.put("/commission", SettingsController.setCommissionSettings);

// Account Mappings
settings.get("/account-mappings", SettingsController.getAccountMappings);
settings.put("/account-mappings", SettingsController.setAccountMappings);

// General
settings.get("/general", SettingsController.getGeneralSettings);
settings.put("/general", SettingsController.setGeneralSettings);

// Reset
settings.post("/reset", SettingsController.factoryReset);

// Generic (Fallback)
settings.get("/:key", SettingsController.getByKey);
settings.put("/:key", SettingsController.setByKey);

export default settings;
