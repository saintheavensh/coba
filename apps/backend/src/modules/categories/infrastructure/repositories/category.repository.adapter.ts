import { DBContext } from "../../../../shared/types/db-context";
import { ICategoryRepository } from "../../domain";
import { CategoriesModel } from "../../models/categories.model";

export class CategoryRepositoryAdapter implements ICategoryRepository {
    private model: CategoriesModel;

    constructor() {
        this.model = new CategoriesModel();
    }

    async findAll(dbOrTx?: DBContext): Promise<any[]> {
        return await this.model.findAll(dbOrTx);
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<any | null> {
        return await this.model.findById(id, dbOrTx);
    }

    async create(data: any, dbOrTx?: DBContext): Promise<any> {
        return await this.model.create(data, dbOrTx);
    }

    async update(id: string, data: any, dbOrTx?: DBContext): Promise<any> {
        return await this.model.update(id, data, dbOrTx);
    }

    async delete(id: string, dbOrTx?: DBContext): Promise<void> {
        await this.model.delete(id, dbOrTx);
    }

    async addVariantTemplate(categoryId: string, name: string, supplierId?: string, dbOrTx?: DBContext): Promise<any> {
        return await this.model.addVariantTemplate(categoryId, name, supplierId, dbOrTx);
    }

    async removeVariantTemplate(id: number, dbOrTx?: DBContext): Promise<void> {
        await this.model.removeVariantTemplate(id, dbOrTx);
    }

    async propagateVariantToProducts(categoryId: string, variantName: string, supplierId?: string, dbOrTx?: DBContext): Promise<void> {
        await this.model.propagateVariantToProducts(categoryId, variantName, supplierId, dbOrTx);
    }
}
