import { SettingsRepositoryAdapter } from "./infrastructure";
import {
    GetSettingUseCase,
    UpdateSettingUseCase,
    GetAllSettingsUseCase,
    FactoryResetUseCase
} from "./application";

// Adapters
const settingsRepository = new SettingsRepositoryAdapter();

// Use Cases
const getSettingUC = new GetSettingUseCase(settingsRepository);
const updateSettingUC = new UpdateSettingUseCase(settingsRepository);
const getAllSettingsUC = new GetAllSettingsUseCase(getSettingUC);
const factoryResetUC = new FactoryResetUseCase(settingsRepository);

/**
 * SettingsService — Facade for external and presentation layers.
 * Provides a clean interface for managing application-wide configurations.
 */
export class SettingsService {
    async get<T>(key: string, defaultValue: T) {
        return await getSettingUC.execute(key, defaultValue);
    }

    async set<T>(key: string, value: T) {
        await updateSettingUC.execute(key, value);
    }

    async getAll() {
        return await getAllSettingsUC.execute();
    }

    async factoryReset(mode: "data" | "full") {
        await factoryResetUC.execute(mode);
    }

    // --- Legacy Helper Methods for Adapters ---

    async getWhatsAppSettings() {
        return await this.get("whatsapp", {
            enabled: false,
            autoSendOnNewService: false,
            newServiceTemplate: "",
            autoSendOnStatusChange: false,
            statusUpdateTemplate: "",
            autoSendOnComplete: false,
            readyForPickupTemplate: ""
        });
    }

    async getServiceSettings(_dbOrTx?: any) {
        return await this.get<{ warrantyPresets: { label: string, days: number }[] }>("service", {
            warrantyPresets: []
        });
    }

    async getPaymentMethods(_dbOrTx?: any) {
        return await this.get("payment_methods", []);
    }
}

/** Singleton instance */
export const settingsService = new SettingsService();

export {
    getSettingUC,
    updateSettingUC,
    getAllSettingsUC,
    factoryResetUC
};
