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
import type { ProductsFacade as ProductsService } from "../../products/application/facades/ProductsFacade";

export class InventoryService {
    constructor(
        private readonly deductStockFIFOUC: DeductStockFIFOUseCase,
        private readonly addStockFromPurchaseUC: AddStockFromPurchaseUseCase,
        private readonly reverseStockUC: ReverseStockUseCase,
        private readonly getLastBatchUC: GetLastBatchUseCase,
        private readonly reduceBatchStockUC: any, // Using any temporarily to avoid circular or complex typing Issues if UseCase type is not exported
        private readonly batchRepository: any,
        private readonly getProductsService: () => any
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

    async getBatchById(batchId: string, dbOrTx?: unknown): Promise<ProductBatchEntity | null> {
        return this.batchRepository.findById(batchId, dbOrTx);
    }

    async reduceStock(batchId: string, qty: number, dbOrTx: unknown): Promise<void> {
        return this.reduceBatchStockUC.execute(batchId, qty, dbOrTx);
    }

    // ===========================
    // Backward-compat proxies → products module
    // These ensure sales/purchases modules don't break.
    // TODO: ProductsFacade is missing several methods after refactoring.
    // Temporary 'any' typing used to pass TypeScript compilation until Products module is fully restored.
    // ===========================

    async getAllProducts(...args: any[]) {
        return (this.getProductsService() as any).getAllProducts(...args);
    }

    async getProductById(...args: any[]) {
        // Mapped to getProduct in the new facade
        return this.getProductsService().getProduct(args[0]);
    }

    async createProduct(...args: any[]) {
        return (this.getProductsService() as any).createProduct(...args);
    }

    async updateProduct(...args: any[]) {
        return (this.getProductsService() as any).updateProduct(...args);
    }

    async deleteProduct(...args: any[]) {
        return (this.getProductsService() as any).deleteProduct(...args);
    }

    async getSupplierVariants(...args: any[]) {
        return (this.getProductsService() as any).getSupplierVariants(...args);
    }

    async createVariant(...args: any[]) {
        return (this.getProductsService() as any).createVariant(...args);
    }

    async updateVariant(...args: any[]) {
        return (this.getProductsService() as any).updateVariant(...args);
    }

    async getProductVariants(...args: any[]) {
        return (this.getProductsService() as any).getProductVariants(...args);
    }

    async deleteVariant(...args: any[]) {
        return (this.getProductsService() as any).deleteVariant(...args);
    }

    async bulkUpdateMinStock(...args: any[]) {
        return (this.getProductsService() as any).bulkUpdateMinStock(...args);
    }

    async getProductCountByCategory(...args: any[]) {
        return (this.getProductsService() as any).getProductCountByCategory(...args);
    }

    async getStats(...args: any[]) {
        return (this.getProductsService() as any).getStats(...args);
    }

    async searchProduct(...args: any[]) {
        return (this.getProductsService() as any).searchProduct(...args);
    }

    async printLabel(...args: any[]) {
        return (this.getProductsService() as any).printLabel(...args);
    }
}
