/**
 * Legacy facade. New code should use inventoryApplicationService from inventory-container.
 * This delegates to the application service for backward compatibility.
 */
import { inventoryApplicationService } from "../inventory-container";

export class InventoryService {
    async getAllProducts(deviceId?: string, search?: string, categoryId?: string, dbOrTx?: unknown) {
        return inventoryApplicationService.getAllProducts(deviceId, search, categoryId, dbOrTx);
    }

    async getProductById(id: string, dbOrTx?: unknown) {
        return inventoryApplicationService.getProductById(id, dbOrTx);
    }

    async createProduct(data: unknown, user?: unknown, dbOrTx?: unknown) {
        return inventoryApplicationService.createProduct(data as any, user, dbOrTx);
    }

    async updateProduct(id: string, data: unknown, user?: unknown, dbOrTx?: unknown) {
        return inventoryApplicationService.updateProduct(id, data as any, user, dbOrTx);
    }

    async deleteProduct(id: string, dbOrTx?: unknown) {
        return inventoryApplicationService.deleteProduct(id, dbOrTx);
    }

    async getSupplierVariants(supplierId: string, dbOrTx?: unknown) {
        return inventoryApplicationService.getSupplierVariants(supplierId, dbOrTx);
    }

    async createVariant(data: unknown, user?: unknown, dbOrTx?: unknown) {
        return inventoryApplicationService.createVariant(data as any, user, dbOrTx);
    }

    async updateVariant(id: string, data: unknown, user?: unknown, dbOrTx?: unknown) {
        return inventoryApplicationService.updateVariant(id, data as any, user, dbOrTx);
    }

    async getProductVariants(productId: string, supplierId?: string, dbOrTx?: unknown) {
        return inventoryApplicationService.getProductVariants(productId, supplierId, dbOrTx);
    }

    async deleteVariant(id: string, dbOrTx?: unknown) {
        return inventoryApplicationService.deleteVariant(id, dbOrTx);
    }

    async bulkUpdateMinStock(categoryId: string, minStock: number, user?: unknown, dbOrTx?: unknown) {
        return inventoryApplicationService.bulkUpdateMinStock(categoryId, minStock, user, dbOrTx);
    }

    async getProductCountByCategory(categoryId: string, dbOrTx?: unknown) {
        return inventoryApplicationService.getProductCountByCategory(categoryId, dbOrTx);
    }

    async getStats(dbOrTx?: unknown) {
        return inventoryApplicationService.getStats(dbOrTx);
    }

    async searchProduct(search?: string, dbOrTx?: unknown) {
        return inventoryApplicationService.searchProduct(search, dbOrTx);
    }

    async deductStockFIFO(input: unknown, dbOrTx: unknown) {
        return inventoryApplicationService.deductStockFIFO(input as any, dbOrTx);
    }

    async addStockFromPurchaseVerification(input: unknown, dbOrTx: unknown) {
        return inventoryApplicationService.addStockFromPurchaseVerification(input as any, dbOrTx);
    }
}
