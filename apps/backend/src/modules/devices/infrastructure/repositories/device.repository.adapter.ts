import { DBContext } from "../../../../shared/types/db-context";
import { IDeviceRepository, IDeviceFilters, Device, CreateDeviceData, UpdateDeviceData } from "../../domain";
import { DevicesModel } from "../../models/devices.model";

export class DeviceRepositoryAdapter implements IDeviceRepository {
    private model: DevicesModel;

    constructor() {
        this.model = new DevicesModel();
    }

    async findAll(filters: IDeviceFilters, dbOrTx?: DBContext): Promise<Device[]> {
        return await this.model.findAll(filters, dbOrTx) as Device[];
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<Device | null> {
        return await this.model.findById(id, dbOrTx) as Device;
    }

    async create(data: CreateDeviceData, dbOrTx?: DBContext): Promise<Device> {
        return await this.model.create(data, dbOrTx) as Device;
    }

    async update(id: string, data: UpdateDeviceData, dbOrTx?: DBContext): Promise<Device> {
        return await this.model.update(id, data, dbOrTx) as Device;
    }

    async delete(id: string, dbOrTx?: DBContext): Promise<Device> {
        return await this.model.delete(id, dbOrTx) as Device;
    }

    async bulkDelete(ids: string[], dbOrTx?: DBContext): Promise<Device[]> {
        return await this.model.bulkDelete(ids, dbOrTx) as Device[];
    }

    async getUnlinkedProducts(limit?: number, offset?: number, dbOrTx?: DBContext): Promise<any[]> {
        return await this.model.getUnlinkedProducts(limit, offset, dbOrTx);
    }

    async findProductsByName(name: string, dbOrTx?: DBContext): Promise<any[]> {
        return await this.model.findProductsByName(name, dbOrTx);
    }

    async addCompatibilityLinks(links: { productId: string; deviceId: string }[], dbOrTx?: DBContext): Promise<void> {
        await this.model.addCompatibilityLinks(links, dbOrTx);
    }
}
