import { DBContext } from "../../../shared/types/db-context";
import { DeviceRepositoryAdapter, DeviceScraperAdapter } from "./infrastructure";
import {
    GetDevicesUseCase,
    CreateDeviceUseCase,
    UpdateDeviceUseCase,
    DeleteDeviceUseCase,
    BulkDeleteDevicesUseCase,
    SyncDeviceCompatibilityUseCase,
    GetUnlinkedProductsUseCase,
    ScrapeDeviceUseCase,
    GetDeviceLinksUseCase,
    ImportDeviceFromUrlUseCase
} from "./application";
import { IDeviceFilters, CreateDeviceData, UpdateDeviceData } from "./domain";

// Adapters
const deviceRepository = new DeviceRepositoryAdapter();
const deviceScraper = new DeviceScraperAdapter();

// Use Cases
const getDevicesUC = new GetDevicesUseCase(deviceRepository);
const createDeviceUC = new CreateDeviceUseCase(deviceRepository);
const updateDeviceUC = new UpdateDeviceUseCase(deviceRepository);
const deleteDeviceUC = new DeleteDeviceUseCase(deviceRepository);
const bulkDeleteDevicesUC = new BulkDeleteDevicesUseCase(deviceRepository);
const syncDeviceCompatibilityUC = new SyncDeviceCompatibilityUseCase(deviceRepository);
const getUnlinkedProductsUC = new GetUnlinkedProductsUseCase(deviceRepository);
const scrapeDeviceUC = new ScrapeDeviceUseCase(deviceScraper);
const getDeviceLinksUC = new GetDeviceLinksUseCase(deviceScraper);
const importDeviceFromUrlUC = new ImportDeviceFromUrlUseCase(deviceScraper, createDeviceUC);

/**
 * DevicesFacade — Single entry point for the Devices module.
 * Provides a clean interface for presentation and external layers.
 */
export class DevicesFacade {
    async getAll(filters: IDeviceFilters, dbOrTx?: DBContext) {
        return await getDevicesUC.execute(filters, dbOrTx);
    }

    async getById(id: string, dbOrTx?: DBContext) {
        return await deviceRepository.findById(id, dbOrTx);
    }

    async create(data: Omit<CreateDeviceData, 'id' | 'brand'> & { brand: string; id?: string }, dbOrTx?: DBContext) {
        return await createDeviceUC.execute(data, dbOrTx);
    }

    async update(id: string, data: UpdateDeviceData, dbOrTx?: DBContext) {
        return await updateDeviceUC.execute(id, data, dbOrTx);
    }

    async delete(id: string, dbOrTx?: DBContext) {
        return await deleteDeviceUC.execute(id, dbOrTx);
    }

    async bulkDelete(ids: string[], dbOrTx?: DBContext) {
        return await bulkDeleteDevicesUC.execute(ids, dbOrTx);
    }

    async syncCompatibility(deviceId: string, dbOrTx?: DBContext) {
        return await syncDeviceCompatibilityUC.execute(deviceId, dbOrTx);
    }

    async getUnlinkedProducts(limit: number = 50, offset: number = 0, dbOrTx?: DBContext) {
        return await getUnlinkedProductsUC.execute(limit, offset, dbOrTx);
    }

    async scrape(url: string) {
        return await scrapeDeviceUC.execute(url);
    }

    async getLinks(url: string) {
        return await getDeviceLinksUC.execute(url);
    }

    async importFromUrl(url: string) {
        return await importDeviceFromUrlUC.execute(url);
    }
}

/** Singleton instance */
export const devicesFacade = new DevicesFacade();

export {
    getDevicesUC,
    createDeviceUC,
    updateDeviceUC,
    deleteDeviceUC,
    bulkDeleteDevicesUC,
    syncDeviceCompatibilityUC,
    getUnlinkedProductsUC,
    scrapeDeviceUC,
    getDeviceLinksUC,
    importDeviceFromUrlUC
};
