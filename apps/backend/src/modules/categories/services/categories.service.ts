import { CategoriesModel } from "../models/categories.model";
import { generateId, ID_PREFIX } from "../../../lib/utils";

export class CategoriesService {
    private model: CategoriesModel;

    constructor() {
        this.model = new CategoriesModel();
    }

    async getAll(dbOrTx?: any) {
        return await this.model.findAll(dbOrTx);
    }

    async create(data: { name: string; description?: string; parentId?: string | null; variants?: string[] }, dbOrTx?: any) {
        const id = generateId(ID_PREFIX.CATEGORY);
        const category = await this.model.create({
            id,
            name: data.name,
            description: data.description,
            parentId: data.parentId
        }, dbOrTx);

        if (data.variants && data.variants.length > 0) {
            for (const vName of data.variants) {
                await this.model.addVariantTemplate(id, vName, undefined, dbOrTx);
            }
        }

        return category;
    }

    async update(id: string, data: { name: string; description?: string; parentId?: string | null }, dbOrTx?: any) {
        return await this.model.update(id, data, dbOrTx);
    }

    async delete(id: string, dbOrTx?: any) {
        return await this.model.delete(id, dbOrTx);
    }

    async addVariantTemplate(categoryId: string, name: string, supplierId?: string, dbOrTx?: any) {
        // 1. Add to Category with supplier
        const template = await this.model.addVariantTemplate(categoryId, name, supplierId, dbOrTx);

        // 2. Propagate to ALL existing products in this category
        await this.model.propagateVariantToProducts(categoryId, name, supplierId, dbOrTx);

        return template;
    }

    async removeVariantTemplate(id: number, dbOrTx?: any) {
        return await this.model.removeVariantTemplate(id, dbOrTx);
    }
}
