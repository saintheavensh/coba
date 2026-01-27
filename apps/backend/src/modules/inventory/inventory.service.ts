import { InventoryRepository } from "./inventory.repository";
import { productSchema } from "@repo/shared";
import { z } from "zod";

type CreateProductDto = z.infer<typeof productSchema>;

import { CategoriesRepository } from "../categories/categories.repository";

export class InventoryService {
    private repo: InventoryRepository;
    private categoryRepo: CategoriesRepository;

    constructor() {
        this.repo = new InventoryRepository();
        this.categoryRepo = new CategoriesRepository();
    }

    async getAllProducts(deviceId?: string, search?: string, categoryId?: string) {
        return await this.repo.findAll(deviceId, search, categoryId);
    }

    async getProductById(id: string) {
        return await this.repo.findById(id);
    }

    async createProduct(data: CreateProductDto) {
        const id = "PRD-" + Date.now().toString().slice(-6);
        const product = await this.repo.createProduct({
            id,
            name: data.name,
            // Sanitize input: empty string -> null to prevent Unique/FK errors
            code: data.code && data.code.trim() !== "" ? data.code : null,
            categoryId: data.categoryId && data.categoryId.trim() !== "" ? data.categoryId : null,
            image: data.image,
            minStock: data.minStock,
            stock: 0, // Always 0 init
            compatibility: data.compatibility
        });

        // Auto-create variants from Category Templates
        if (data.categoryId) {
            const category = await this.categoryRepo.findById(data.categoryId);
            if (category?.variantTemplates?.length) {
                for (const template of category.variantTemplates) {
                    await this.createVariant({
                        productId: product.id,
                        name: template.name,
                        // image, sku, defaultPrice empty initially
                    });
                }
            }
        }

        return product;
    }

    async updateProduct(id: string, data: CreateProductDto) {
        return await this.repo.updateProduct(id, {
            name: data.name,
            code: data.code,
            categoryId: data.categoryId,
            image: data.image,
            minStock: data.minStock,
            compatibility: data.compatibility
        });
    }

    async deleteProduct(id: string) {
        // TODO: Check if product has batches or sales history
        return await this.repo.deleteProduct(id);
    }

    async getSupplierVariants(supplierId: string) {
        return await this.repo.findRecentVariantIdsBySupplier(supplierId);
    }

    async createVariant(data: { productId: string; name: string; image?: string; sku?: string; defaultPrice?: number }) {
        const id = "VAR-" + Date.now().toString().slice(-6);
        return await this.repo.createVariant({
            id,
            productId: data.productId,
            name: data.name,
            image: data.image,
            sku: data.sku,
            defaultPrice: data.defaultPrice
        });
    }

    async updateVariant(id: string, data: Partial<{ name: string; image?: string; sku?: string; defaultPrice?: number }>) {
        return await this.repo.updateVariant(id, data);
    }

    async getProductVariants(productId: string) {
        return await this.repo.findVariantsByProductId(productId);
    }

    async deleteVariant(id: string) {
        return await this.repo.deleteVariant(id);
    }

    // Bulk update minimum stock for all products in a category
    async bulkUpdateMinStock(categoryId: string, minStock: number): Promise<number> {
        return await this.repo.updateMinStockByCategory(categoryId, minStock);
    }

    // Get count of products in a category
    async getProductCountByCategory(categoryId: string): Promise<number> {
        return await this.repo.countByCategory(categoryId);
    }
}
