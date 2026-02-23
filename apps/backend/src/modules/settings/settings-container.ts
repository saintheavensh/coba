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
}

/** Singleton instance */
export const settingsService = new SettingsService();

export {
    getSettingUC,
    updateSettingUC,
    getAllSettingsUC,
    factoryResetUC
};
