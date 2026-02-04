import { InventoryModel } from "../models/inventory.model";
import { productSchema } from "@repo/shared";
import { z } from "zod";

type CreateProductDto = z.infer<typeof productSchema>;

// Temporary import until Categories are moved
import { CategoriesModel } from "../../categories/models/categories.model";

export class InventoryService {
    private model: InventoryModel;
    private categoryModel: CategoriesModel;

    constructor() {
        this.model = new InventoryModel();
        this.categoryModel = new CategoriesModel();
    }

    async getAllProducts(deviceId?: string, search?: string, categoryId?: string, dbOrTx?: any) {
        return await this.model.findAll(deviceId, search, categoryId, dbOrTx);
    }

    async getProductById(id: string, dbOrTx?: any) {
        return await this.model.findById(id, dbOrTx);
    }

    async createProduct(data: CreateProductDto, dbOrTx?: any) {
        const id = "PRD-" + Date.now().toString().slice(-6);
        const product = await this.model.createProduct({
            id,
            name: data.name,
            // Sanitize input: empty string -> null to prevent Unique/FK errors
            code: data.code && data.code.trim() !== "" ? data.code : null,
            categoryId: data.categoryId && data.categoryId.trim() !== "" ? data.categoryId : null,
            image: data.image,
            minStock: data.minStock,
            stock: 0, // Always 0 init
            compatibility: data.compatibility
        }, dbOrTx);

        // Auto-create variants from Category Templates
        if (data.categoryId) {
            const category = await this.categoryModel.findById(data.categoryId, dbOrTx);
            if (category?.variantTemplates?.length) {
                for (const template of category.variantTemplates) {
                    await this.createVariant({
                        productId: product.id,
                        name: template.name,
                        // image, sku, defaultPrice empty initially
                    }, dbOrTx);
                }
            }
        }

        return product;
    }

    async updateProduct(id: string, data: CreateProductDto, dbOrTx?: any) {
        return await this.model.updateProduct(id, {
            name: data.name,
            code: data.code,
            categoryId: data.categoryId,
            image: data.image,
            minStock: data.minStock,
            compatibility: data.compatibility
        }, dbOrTx);
    }

    async deleteProduct(id: string, dbOrTx?: any) {
        // TODO: Check if product has batches or sales history
        return await this.model.deleteProduct(id, dbOrTx);
    }

    async getSupplierVariants(supplierId: string, dbOrTx?: any) {
        return await this.model.findVariantsBySupplierConfig(supplierId, dbOrTx);
    }

    async createVariant(data: { productId: string; name: string; image?: string; sku?: string; defaultPrice?: number }, dbOrTx?: any) {
        const id = "VAR-" + Date.now().toString().slice(-6);
        return await this.model.createVariant({
            id,
            productId: data.productId,
            name: data.name,
            image: data.image,
            sku: data.sku,
            defaultPrice: data.defaultPrice
        }, dbOrTx);
    }

    async updateVariant(id: string, data: Partial<{ name: string; image?: string; sku?: string; defaultPrice?: number }>, dbOrTx?: any) {
        return await this.model.updateVariant(id, data, dbOrTx);
    }

    async getProductVariants(productId: string, dbOrTx?: any) {
        return await this.model.findVariantsByProductId(productId, dbOrTx);
    }

    async deleteVariant(id: string, dbOrTx?: any) {
        return await this.model.deleteVariant(id, dbOrTx);
    }

    // Bulk update minimum stock for all products in a category
    async bulkUpdateMinStock(categoryId: string, minStock: number, dbOrTx?: any): Promise<number> {
        return await this.model.updateMinStockByCategory(categoryId, minStock, dbOrTx);
    }

    // Get count of products in a category
    async getProductCountByCategory(categoryId: string, dbOrTx?: any): Promise<number> {
        return await this.model.countByCategory(categoryId, dbOrTx);
    }

    async getStats(dbOrTx?: any) {
        return await this.model.getInventoryStats(dbOrTx);
    }
}
