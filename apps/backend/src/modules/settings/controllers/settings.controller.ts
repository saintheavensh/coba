import { Context } from "hono";
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
    TaxSettings,
    SystemSettings,
} from "../services/settings.service";
import { apiSuccess, apiError } from "../../../lib/response";

const service = new SettingsService();

export class SettingsController {
    static async getAll(c: Context) {
        try {
            const all = await service.getAll();
            return apiSuccess(c, all);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch settings");
        }
    }

    static async getPaymentMethods(c: Context) {
        try {
            const config = await service.getPaymentMethods();
            return apiSuccess(c, config);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch payment methods");
        }
    }

    static async setPaymentMethods(c: Context) {
        try {
            const body = await c.req.json<PaymentMethodConfig>();
            await service.setPaymentMethods(body);
            return apiSuccess(c, null, "Payment methods updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update payment methods");
        }
    }

    static async getStoreInfo(c: Context) {
        try {
            const info = await service.getStoreInfo();
            return apiSuccess(c, info);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch store info");
        }
    }

    static async setStoreInfo(c: Context) {
        try {
            const body = await c.req.json<StoreInfo>();
            await service.setStoreInfo(body);
            return apiSuccess(c, null, "Store info updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update store info");
        }
    }

    static async getReceiptSettings(c: Context) {
        try {
            const settings = await service.getReceiptSettings();
            return apiSuccess(c, settings);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch receipt settings");
        }
    }

    static async setReceiptSettings(c: Context) {
        try {
            const body = await c.req.json<ReceiptSettings>();
            await service.setReceiptSettings(body);
            return apiSuccess(c, null, "Receipt settings updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update receipt settings");
        }
    }

    static async getServiceSettings(c: Context) {
        try {
            const settings = await service.getServiceSettings();
            return apiSuccess(c, settings);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch service settings");
        }
    }

    static async setServiceSettings(c: Context) {
        try {
            const body = await c.req.json<ServiceSettings>();
            await service.setServiceSettings(body);
            return apiSuccess(c, null, "Service settings updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update service settings");
        }
    }

    static async getWhatsAppSettings(c: Context) {
        try {
            const settings = await service.getWhatsAppSettings();
            return apiSuccess(c, settings);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch WhatsApp settings");
        }
    }

    static async setWhatsAppSettings(c: Context) {
        try {
            const body = await c.req.json<WhatsAppSettings>();
            await service.setWhatsAppSettings(body);
            return apiSuccess(c, null, "WhatsApp settings updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update WhatsApp settings");
        }
    }

    static async getCommissionSettings(c: Context) {
        try {
            const settings = await service.getCommissionSettings();
            return apiSuccess(c, settings);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch commission settings");
        }
    }

    static async setCommissionSettings(c: Context) {
        try {
            const body = await c.req.json<CommissionSettings>();
            await service.setCommissionSettings(body);
            return apiSuccess(c, null, "Commission settings updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update commission settings");
        }
    }

    static async getAccountMappings(c: Context) {
        try {
            const mappings = await service.getAccountMappings();
            return apiSuccess(c, mappings);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch account mappings");
        }
    }

    static async setAccountMappings(c: Context) {
        try {
            const body = await c.req.json<AccountMappingSettings>();
            await service.setAccountMappings(body);
            return apiSuccess(c, null, "Account mappings updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update account mappings");
        }
    }

    static async getGeneralSettings(c: Context) {
        try {
            const settings = await service.getGeneralSettings();
            return apiSuccess(c, settings);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch general settings");
        }
    }

    static async setGeneralSettings(c: Context) {
        try {
            const body = await c.req.json<GeneralSettings>();
            await service.setGeneralSettings(body);
            return apiSuccess(c, null, "General settings updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update general settings");
        }
    }

    static async getTaxSettings(c: Context) {
        try {
            const settings = await service.getTaxSettings();
            return apiSuccess(c, settings);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch tax settings");
        }
    }

    static async setTaxSettings(c: Context) {
        try {
            const body = await c.req.json<TaxSettings>();
            await service.setTaxSettings(body);
            return apiSuccess(c, null, "Tax settings updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update tax settings");
        }
    }

    static async getSystemSettings(c: Context) {
        try {
            const settings = await service.getSystemSettings();
            return apiSuccess(c, settings);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch system settings");
        }
    }

    static async setSystemSettings(c: Context) {
        try {
            const body = await c.req.json<SystemSettings>();
            await service.setSystemSettings(body);
            return apiSuccess(c, null, "System settings updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update system settings");
        }
    }

    static async factoryReset(c: Context) {
        try {
            const body = await c.req.json<{ mode: "data" | "full" }>();
            if (!body.mode) return c.json({ success: false, message: "Mode is required ('data' | 'full')" }, 400);

            await service.factoryReset(body.mode);
            return apiSuccess(c, null, "Factory reset completed successfully");
        } catch (e: any) {
            return apiError(c, e, "Factory reset failed");
        }
    }

    static async getByKey(c: Context) {
        try {
            const key = c.req.param("key");
            const value = await service.get(key, null);
            return apiSuccess(c, value);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch setting");
        }
    }

    static async setByKey(c: Context) {
        try {
            const key = c.req.param("key");
            const body = await c.req.json();
            await service.set(key, body.value);
            return apiSuccess(c, null, "Setting updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update setting");
        }
    }
}
