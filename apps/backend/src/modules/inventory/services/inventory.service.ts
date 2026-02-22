/**
 * Inventory service facade — wraps stock use cases.
 * Also provides backward-compatible proxy methods for product operations
 * that external modules (sales, purchases) may still call.
 */
import type { DeductStockFIFOInput, DeductStockFIFOOutput, AddStockFromPurchaseVerificationInput, AddStockFromPurchaseVerificationOutput, ReverseStockInput } from "../domain/stock.types";
import type { ProductBatchEntity } from "../domain/batch-repository.port";
import type { DeductStockFIFOUseCase } from "../application/use-cases/deduct-stock-fifo.use-case";
import type { AddStockFromPurchaseUseCase } from "../application/use-cases/add-stock-from-purchase.use-case";
import type { ReverseStockUseCase } from "../application/use-cases/reverse-stock.use-case";
import type { GetLastBatchUseCase } from "../application/use-cases/get-last-batch.use-case";
import type { ProductsService } from "../../products/products-container";

export class InventoryService {
    constructor(
        private readonly deductStockFIFOUC: DeductStockFIFOUseCase,
        private readonly addStockFromPurchaseUC: AddStockFromPurchaseUseCase,
        private readonly reverseStockUC: ReverseStockUseCase,
        private readonly getLastBatchUC: GetLastBatchUseCase,
        private readonly productsService: ProductsService
    ) { }

    // ===========================
    // Stock-only methods
    // ===========================

    async deductStockFIFO(input: DeductStockFIFOInput, dbOrTx: unknown): Promise<DeductStockFIFOOutput> {
        return this.deductStockFIFOUC.execute(input, dbOrTx);
    }

    async addStockFromPurchaseVerification(
        input: AddStockFromPurchaseVerificationInput,
        dbOrTx: unknown
    ): Promise<AddStockFromPurchaseVerificationOutput> {
        return this.addStockFromPurchaseUC.execute(input, dbOrTx);
    }

    async reverseStockFromPurchaseDeletion(input: ReverseStockInput, dbOrTx: unknown): Promise<void> {
        return this.reverseStockUC.execute(input, dbOrTx);
    }

    async getLastBatchByProduct(productId: string, dbOrTx?: unknown): Promise<ProductBatchEntity | null> {
        return this.getLastBatchUC.execute(productId, dbOrTx);
    }

    // ===========================
    // Backward-compat proxies → products module
    // These ensure sales/purchases modules don't break.
    // ===========================

    async getAllProducts(...args: Parameters<ProductsService["getAllProducts"]>) {
        return this.productsService.getAllProducts(...args);
    }

    async getProductById(...args: Parameters<ProductsService["getProductById"]>) {
        return this.productsService.getProductById(...args);
    }

    async createProduct(...args: Parameters<ProductsService["createProduct"]>) {
        return this.productsService.createProduct(...args);
    }

    async updateProduct(...args: Parameters<ProductsService["updateProduct"]>) {
        return this.productsService.updateProduct(...args);
    }

    async deleteProduct(...args: Parameters<ProductsService["deleteProduct"]>) {
        return this.productsService.deleteProduct(...args);
    }

    async getSupplierVariants(...args: Parameters<ProductsService["getSupplierVariants"]>) {
        return this.productsService.getSupplierVariants(...args);
    }

    async createVariant(...args: Parameters<ProductsService["createVariant"]>) {
        return this.productsService.createVariant(...args);
    }

    async updateVariant(...args: Parameters<ProductsService["updateVariant"]>) {
        return this.productsService.updateVariant(...args);
    }

    async getProductVariants(...args: Parameters<ProductsService["getProductVariants"]>) {
        return this.productsService.getProductVariants(...args);
    }

    async deleteVariant(...args: Parameters<ProductsService["deleteVariant"]>) {
        return this.productsService.deleteVariant(...args);
    }

    async bulkUpdateMinStock(...args: Parameters<ProductsService["bulkUpdateMinStock"]>) {
        return this.productsService.bulkUpdateMinStock(...args);
    }

    async getProductCountByCategory(...args: Parameters<ProductsService["getProductCountByCategory"]>) {
        return this.productsService.getProductCountByCategory(...args);
    }

    async getStats(...args: Parameters<ProductsService["getStats"]>) {
        return this.productsService.getStats(...args);
    }

    async searchProduct(...args: Parameters<ProductsService["searchProduct"]>) {
        return this.productsService.searchProduct(...args);
    }

    async printLabel(...args: Parameters<ProductsService["printLabel"]>) {
        return this.productsService.printLabel(...args);
    }
}
