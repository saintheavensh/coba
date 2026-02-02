import { DevicesModel } from "../models/devices.model";
import { v4 as uuidv4 } from "uuid";
import { BrandsService } from "../../brands/services/brands.service";

/**
 * Normalize brand name: capitalize first letter, rest lowercase
 */
function normalizeBrandName(name: string): string {
    if (!name || name.trim().length === 0) return name;
    const trimmed = name.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export class DevicesService {
    static async getAll(search?: string, limit: number = 50, offset: number = 0, brand?: string, dbOrTx?: any) {
        return await DevicesModel.findAll({ search, limit, offset, brand }, dbOrTx);
    }

    static async getById(id: string, dbOrTx?: any) {
        return await DevicesModel.findById(id, dbOrTx);
    }

    static async create(data: {
        brand: string;
        model: string;
        series?: string;
        code?: string;
        image?: string;
        colors?: string[];
        specs?: string;
        chipset?: string;
        specifications?: any;
        id?: string;
    }, dbOrTx?: any) {
        // Normalize brand name and ensure brand exists
        const normalizedBrand = normalizeBrandName(data.brand);

        // Check if brand exists (case-insensitive), create if not
        let existingBrand = await BrandsService.findByName(normalizedBrand, dbOrTx);
        if (!existingBrand) {
            // Create brand with normalized name
            const brandId = normalizedBrand.toLowerCase().replace(/\s+/g, '-');
            const createdBrands = await BrandsService.create({
                id: brandId,
                name: normalizedBrand
            }, dbOrTx);
            existingBrand = createdBrands[0];
        }

        const id = data.id || `DEV-${uuidv4().substring(0, 8)}`; // emulate short ID or just use full UUID

        return await DevicesModel.create({
            ...data,
            id,
            brand: normalizedBrand
        }, dbOrTx);
    }

    static async update(id: string, data: any, dbOrTx?: any) {
        return await DevicesModel.update(id, data, dbOrTx);
    }

    static async delete(id: string, dbOrTx?: any) {
        return await DevicesModel.delete(id, dbOrTx);
    }

    static async bulkDelete(ids: string[], dbOrTx?: any) {
        return await DevicesModel.bulkDelete(ids, dbOrTx);
    }
}
