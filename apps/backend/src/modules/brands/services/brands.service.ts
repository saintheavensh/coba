import { BrandsModel } from "../models/brands.model";

/**
 * Normalize brand name: capitalize first letter, rest lowercase
 * Example: "realme" -> "Realme", "REALME" -> "Realme", "realMe" -> "Realme"
 */
function normalizeBrandName(name: string): string {
    if (!name || name.trim().length === 0) return name;
    const trimmed = name.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export class BrandsService {
    static async getAll(dbOrTx?: any) {
        return await BrandsModel.findAll(dbOrTx);
    }

    /**
     * Find brand by name (case-insensitive)
     */
    static async findByName(name: string, dbOrTx?: any) {
        const normalized = normalizeBrandName(name);
        return await BrandsModel.findByName(normalized, dbOrTx);
    }

    static async create(data: { id: string; name: string; logo?: string }, dbOrTx?: any) {
        // Normalize brand name: capitalize first letter
        const normalizedName = normalizeBrandName(data.name);

        // Check if brand with same name (case-insensitive) already exists
        const existing = await this.findByName(normalizedName, dbOrTx);
        if (existing) {
            // Return existing brand instead of creating duplicate
            return [existing];
        }

        // Ensure ID is lowercase/slugified
        const id = data.id.toLowerCase().replace(/\s+/g, '-');

        return await BrandsModel.create({
            ...data,
            id,
            name: normalizedName, // Use normalized name
        }, dbOrTx);
    }

    static async update(id: string, data: { name?: string; logo?: string }, dbOrTx?: any) {
        const updateData: any = { ...data };
        if (data.name) {
            updateData.name = normalizeBrandName(data.name);
        }

        return await BrandsModel.update(id, updateData, dbOrTx);
    }

    static async delete(id: string, dbOrTx?: any) {
        return await BrandsModel.delete(id, dbOrTx);
    }
}
