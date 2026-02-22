import type { IProductRepository, CreateProductData, UpdateProductData } from "../ports/product-repository.port";
import { InventoryModel } from "../models/inventory.model";

export class ProductRepositoryAdapter implements IProductRepository {
    private model = new InventoryModel();

    async findAll(deviceId?: string, search?: string, categoryId?: string, dbOrTx?: unknown) {
        return this.model.findAll(deviceId, search, categoryId, dbOrTx);
    }

    async findById(id: string, dbOrTx?: unknown) {
        return this.model.findById(id, dbOrTx);
    }

    async createProduct(data: CreateProductData, dbOrTx?: unknown) {
        return this.model.createProduct(
            {
                id: data.id,
                name: data.name,
                code: data.code,
                categoryId: data.categoryId,
                image: data.image,
                minStock: data.minStock,
                stock: data.stock,
                compatibility: data.compatibility
            },
            dbOrTx
        );
    }

    async updateProduct(id: string, data: UpdateProductData, dbOrTx?: unknown) {
        return this.model.updateProduct(id, data as any, dbOrTx);
    }

    async deleteProduct(id: string, dbOrTx?: unknown) {
        return this.model.deleteProduct(id, dbOrTx);
    }

    async updateMinStockByCategory(categoryId: string, minStock: number, dbOrTx?: unknown) {
        return this.model.updateMinStockByCategory(categoryId, minStock, dbOrTx);
    }

    async countByCategory(categoryId: string, dbOrTx?: unknown) {
        return this.model.countByCategory(categoryId, dbOrTx);
    }

    async getInventoryStats(dbOrTx?: unknown) {
        return this.model.getInventoryStats(dbOrTx);
    }

    async searchProductFlattened(search?: string, dbOrTx?: unknown) {
        return this.model.searchProductFlattened(search, dbOrTx);
    }
}
