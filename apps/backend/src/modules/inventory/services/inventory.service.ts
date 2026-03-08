/**
 * Inventory service facade — wraps stock use cases.
 */
import { DBContext } from "../../../shared/types/db-context";
import type { DeductStockFIFOInput, DeductStockFIFOOutput, AddStockFromPurchaseVerificationInput, AddStockFromPurchaseVerificationOutput, ReverseStockInput } from "../domain/stock.types";
import type { ProductBatchEntity } from "../domain/batch-repository.port";
import type { DeductStockFIFOUseCase } from "../application/use-cases/deduct-stock-fifo.use-case";
import type { AddStockFromPurchaseUseCase } from "../application/use-cases/add-stock-from-purchase.use-case";
import type { ReverseStockUseCase } from "../application/use-cases/reverse-stock.use-case";
import type { GetLastBatchUseCase } from "../application/use-cases/get-last-batch.use-case";
import type { RecordDeadPhonePurchaseUseCase } from "../application/use-cases/record-dead-phone-purchase.use-case";
import type { RecordTestLogUseCase } from "../application/use-cases/record-test-log.use-case";
import type { HarvestPartUseCase } from "../application/use-cases/harvest-part.use-case";
import type { ForfeitServiceDeviceUseCase } from "../application/use-cases/forfeit-service-device.use-case";

export class InventoryService {
    constructor(
        private readonly deductStockFIFOUC: DeductStockFIFOUseCase,
        private readonly addStockFromPurchaseUC: AddStockFromPurchaseUseCase,
        private readonly reverseStockUC: ReverseStockUseCase,
        private readonly getLastBatchUC: GetLastBatchUseCase,
        private readonly reduceBatchStockUC: any,
        private readonly batchRepository: any,
        private readonly recordDeadPhoneUC: RecordDeadPhonePurchaseUseCase,
        private readonly recordTestLogUC: RecordTestLogUseCase,
        private readonly harvestPartUC: HarvestPartUseCase,
        private readonly forfeitServiceDeviceUC: ForfeitServiceDeviceUseCase,
        private readonly gamblingRepo: any,
        private readonly kanibalRepo: any,
        private readonly getProductsService: () => any
    ) { }

    async deductStockFIFO(input: DeductStockFIFOInput, dbOrTx?: DBContext): Promise<DeductStockFIFOOutput> {
        return this.deductStockFIFOUC.execute(input, dbOrTx);
    }

    async addStockFromPurchaseVerification(
        input: AddStockFromPurchaseVerificationInput,
        dbOrTx?: DBContext
    ): Promise<AddStockFromPurchaseVerificationOutput> {
        return this.addStockFromPurchaseUC.execute(input, dbOrTx);
    }

    async reverseStockFromPurchaseDeletion(input: ReverseStockInput, dbOrTx?: DBContext): Promise<void> {
        return this.reverseStockUC.execute(input, dbOrTx);
    }

    async getLastBatchByProduct(productId: string, dbOrTx?: DBContext): Promise<ProductBatchEntity | null> {
        return this.getLastBatchUC.execute(productId, dbOrTx);
    }

    async getBatchById(batchId: string, dbOrTx?: DBContext): Promise<ProductBatchEntity | null> {
        return this.batchRepository.findById(batchId, dbOrTx);
    }

    async reduceStock(batchId: string, qty: number, dbOrTx?: DBContext): Promise<void> {
        return this.reduceBatchStockUC.execute(batchId, qty, dbOrTx);
    }

    async recordDeadPhonePurchase(input: any) {
        return this.recordDeadPhoneUC.execute(input);
    }

    async recordTestLog(input: any) {
        return this.recordTestLogUC.execute(input);
    }

    async harvestPart(input: any, dbOrTx?: any) {
        return this.harvestPartUC.execute(input, dbOrTx);
    }

    async forfeitServiceDevice(input: any) {
        return this.forfeitServiceDeviceUC.execute(input);
    }

    async getDeadPhones(filters?: any) {
        return this.gamblingRepo.findAll(filters);
    }

    async getForfeitedDevices(filters?: any) {
        return this.kanibalRepo.findForfeitedDevices(filters);
    }

    // Proxies for Products module
    async getAllProducts(...args: any[]) { return (this.getProductsService() as any).getAllProducts(...args); }
    async getProductById(...args: any[]) { return this.getProductsService().getProduct(args[0]); }
    async createProduct(...args: any[]) { return (this.getProductsService() as any).createProduct(...args); }
    async updateProduct(...args: any[]) { return (this.getProductsService() as any).updateProduct(...args); }
    async deleteProduct(...args: any[]) { return (this.getProductsService() as any).deleteProduct(...args); }
    async getSupplierVariants(...args: any[]) { return (this.getProductsService() as any).getSupplierVariants(...args); }
    async createVariant(...args: any[]) { return (this.getProductsService() as any).createVariant(...args); }
    async updateVariant(...args: any[]) { return (this.getProductsService() as any).updateVariant(...args); }
    async getProductVariants(...args: any[]) { return (this.getProductsService() as any).getProductVariants(...args); }
    async deleteVariant(...args: any[]) { return (this.getProductsService() as any).deleteVariant(...args); }
    async bulkUpdateMinStock(...args: any[]) { return (this.getProductsService() as any).bulkUpdateMinStock(...args); }
    async getProductCountByCategory(...args: any[]) { return (this.getProductsService() as any).getProductCountByCategory(...args); }
    async getStats(...args: any[]) { return (this.getProductsService() as any).getStats(...args); }
    async searchProduct(...args: any[]) { return (this.getProductsService() as any).searchProduct(...args); }
    async printLabel(...args: any[]) { return (this.getProductsService() as any).printLabel(...args); }
}
