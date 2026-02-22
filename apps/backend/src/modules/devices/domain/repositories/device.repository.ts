import { DBContext } from "../../../../shared/types/db-context";
import { Device, CreateDeviceData, UpdateDeviceData } from "../entities/device.entity";

export interface IDeviceFilters {
    search?: string;
    limit?: number;
    offset?: number;
    brand?: string;
}

export interface IDeviceRepository {
    findAll(filters: IDeviceFilters, dbOrTx?: DBContext): Promise<Device[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<Device | null>;
    create(data: CreateDeviceData, dbOrTx?: DBContext): Promise<Device>;
    update(id: string, data: UpdateDeviceData, dbOrTx?: DBContext): Promise<Device>;
    delete(id: string, dbOrTx?: DBContext): Promise<Device>;
    bulkDelete(ids: string[], dbOrTx?: DBContext): Promise<Device[]>;

    // Compatibility / Unlinked
    getUnlinkedProducts(limit?: number, offset?: number, dbOrTx?: DBContext): Promise<any[]>;
    findProductsByName(name: string, dbOrTx?: DBContext): Promise<any[]>;
    addCompatibilityLinks(links: { productId: string; deviceId: string }[], dbOrTx?: DBContext): Promise<void>;
}
