import { InventoryRepository } from "./inventory.repository";
import { productSchema } from "@repo/shared";
import { z } from "zod";

type CreateProductDto = z.infer<typeof productSchema>;

export class InventoryService {
    private repo: InventoryRepository;

    constructor() {
        this.repo = new InventoryRepository();
    }

    async getAllProducts(deviceId?: string) {
        return await this.repo.findAll(deviceId);
    }

    async getProductById(id: string) {
        return await this.repo.findById(id);
    }

    async createProduct(data: CreateProductDto) {
        const id = "PRD-" + Date.now().toString().slice(-6);
        return await this.repo.createProduct({
            id,
            name: data.name,
            // Sanitize input: empty string -> null to prevent Unique/FK errors
            code: data.code && data.code.trim() !== "" ? data.code : null,
            categoryId: data.categoryId && data.categoryId.trim() !== "" ? data.categoryId : null,
            image: data.image,
            minStock: data.minStock,
            stock: 0 // Always 0 init
        });
    }

    async updateProduct(id: string, data: CreateProductDto) {
        return await this.repo.updateProduct(id, {
            name: data.name,
            code: data.code,
            categoryId: data.categoryId,
            image: data.image,
            minStock: data.minStock
        });
    }

    async deleteProduct(id: string) {
        // TODO: Check if product has batches or sales history
        return await this.repo.deleteProduct(id);
    }

    async getSupplierVariants(supplierId: string) {
        return await this.repo.findVariantsBySupplier(supplierId);
    }
}
