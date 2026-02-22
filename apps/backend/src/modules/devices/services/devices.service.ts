import { DBContext } from "../../../shared/types/db-context";
import { DeviceRepositoryAdapter } from "../infrastructure";
import {
    GetDevicesUseCase,
    CreateDeviceUseCase,
    UpdateDeviceUseCase,
    DeleteDeviceUseCase,
    BulkDeleteDevicesUseCase,
    SyncDeviceCompatibilityUseCase,
    GetUnlinkedProductsUseCase
} from "../application";
import { IDeviceRepository, IDeviceFilters, CreateDeviceData, UpdateDeviceData } from "../domain";

export class DevicesService {
    private repository: IDeviceRepository;
    private getDevicesUseCase: GetDevicesUseCase;
    private createDeviceUseCase: CreateDeviceUseCase;
    private updateDeviceUseCase: UpdateDeviceUseCase;
    private deleteDeviceUseCase: DeleteDeviceUseCase;
    private bulkDeleteDevicesUseCase: BulkDeleteDevicesUseCase;
    private syncDeviceCompatibilityUseCase: SyncDeviceCompatibilityUseCase;
    private getUnlinkedProductsUseCase: GetUnlinkedProductsUseCase;

    constructor() {
        this.repository = new DeviceRepositoryAdapter();
        this.getDevicesUseCase = new GetDevicesUseCase(this.repository);
        this.createDeviceUseCase = new CreateDeviceUseCase(this.repository);
        this.updateDeviceUseCase = new UpdateDeviceUseCase(this.repository);
        this.deleteDeviceUseCase = new DeleteDeviceUseCase(this.repository);
        this.bulkDeleteDevicesUseCase = new BulkDeleteDevicesUseCase(this.repository);
        this.syncDeviceCompatibilityUseCase = new SyncDeviceCompatibilityUseCase(this.repository);
        this.getUnlinkedProductsUseCase = new GetUnlinkedProductsUseCase(this.repository);
    }

    async getAll(filters: IDeviceFilters, dbOrTx?: DBContext) {
        return await this.getDevicesUseCase.execute(filters, dbOrTx);
    }

    async getById(id: string, dbOrTx?: DBContext) {
        return await this.repository.findById(id, dbOrTx);
    }

    async create(data: Omit<CreateDeviceData, 'id' | 'brand'> & { brand: string; id?: string }, dbOrTx?: DBContext) {
        return await this.createDeviceUseCase.execute(data, dbOrTx);
    }

    async update(id: string, data: UpdateDeviceData, dbOrTx?: DBContext) {
        return await this.updateDeviceUseCase.execute(id, data, dbOrTx);
    }

    async delete(id: string, dbOrTx?: DBContext) {
        return await this.deleteDeviceUseCase.execute(id, dbOrTx);
    }

    async bulkDelete(ids: string[], dbOrTx?: DBContext) {
        return await this.bulkDeleteDevicesUseCase.execute(ids, dbOrTx);
    }

    async syncCompatibility(deviceId: string, dbOrTx?: DBContext) {
        return await this.syncDeviceCompatibilityUseCase.execute(deviceId, dbOrTx);
    }

    async getUnlinkedProducts(limit: number = 50, offset: number = 0, dbOrTx?: DBContext) {
        return await this.getUnlinkedProductsUseCase.execute(limit, offset, dbOrTx);
    }
}

export const devicesService = new DevicesService();
