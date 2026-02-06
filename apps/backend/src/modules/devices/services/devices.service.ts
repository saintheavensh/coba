import { DevicesModel } from "../models/devices.model";
import { v4 as uuidv4 } from "uuid";
import { BrandsService } from "../../brands/services/brands.service";
import { db } from "../../../db";
import { products, productDeviceCompatibility } from "../../../db/schema";
import { ilike, like, or, and, isNull, eq } from "drizzle-orm";

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
    }, dbOrTx: any = db) {
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

        const result = await DevicesModel.create({
            ...data,
            id,
            brand: normalizedBrand
        }, dbOrTx);

        // Auto-sync compatibility
        await this.syncCompatibility(id, dbOrTx);

        return result;
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

    static async syncCompatibility(deviceId: string, dbOrTx: any = db) {
        const device = await DevicesModel.findById(deviceId, dbOrTx);
        if (!device) return { count: 0 };

        const model = device.model.trim();

        // Find candidate products
        // We look for products where name contains the model.
        // e.g. Model "A3s", Product "LCD Oppo A3s" -> Match
        const candidates = await dbOrTx.select().from(products)
            .where(ilike(products.name, `%${model}%`));

        let linkCount = 0;
        const linksToInsert: any[] = [];

        for (const product of candidates) {
            linksToInsert.push({
                productId: product.id,
                deviceId: device.id
            });
        }

        if (linksToInsert.length > 0) {
            // Check existing to avoid duplicates
            // Or use ON CONFLICT DO NOTHING
            await dbOrTx.insert(productDeviceCompatibility)
                .values(linksToInsert)
                .onConflictDoNothing();

            linkCount = linksToInsert.length;
        }

        return { count: linkCount, products: candidates.map((c: any) => c.name) };
    }
    static async getUnlinkedProducts(limit: number = 50, offset: number = 0, dbOrTx: any = db) {
        return await dbOrTx.select({
            id: products.id,
            name: products.name,
            code: products.code,
            stock: products.stock,
            image: products.image
        })
            .from(products)
            .leftJoin(productDeviceCompatibility, eq(products.id, productDeviceCompatibility.productId))
            .where(isNull(productDeviceCompatibility.productId))
            .limit(limit)
            .offset(offset);
    }
}
