/**
 * Inventory service facade — wraps stock use cases.
 */
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
import { db } from "../../../../shared/infrastructure/database/client";
import type { TransactionContext } from "../../../../shared/types/db-context";

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

    async deductStockFIFO(input: DeductStockFIFOInput): Promise<DeductStockFIFOOutput> {
        return db.transaction(async (tx) => {
            return this.deductStockFIFOUC.execute(input, tx);
        });
    }

    async addStockFromPurchaseVerification(
        input: AddStockFromPurchaseVerificationInput
    ): Promise<AddStockFromPurchaseVerificationOutput> {
        return db.transaction(async (tx) => {
            return this.addStockFromPurchaseUC.execute(input, tx);
        });
    }

    async reverseStockFromPurchaseDeletion(input: ReverseStockInput): Promise<void> {
        return db.transaction(async (tx) => {
            return this.reverseStockUC.execute(input, tx);
        });
    }

    async getLastBatchByProduct(productId: string, tx?: TransactionContext): Promise<ProductBatchEntity | null> {
        return this.getLastBatchUC.execute(productId, tx);
    }

    async getBatchById(batchId: string, tx?: TransactionContext): Promise<ProductBatchEntity | null> {
        return this.batchRepository.findById(batchId, tx);
    }

    async reduceStock(batchId: string, qty: number): Promise<void> {
        return db.transaction(async (tx) => {
            return this.reduceBatchStockUC.execute(batchId, qty, tx);
        });
    }

    async recordDeadPhonePurchase(input: any) {
        return db.transaction(async (tx) => {
            return this.recordDeadPhoneUC.execute(input, tx);
        });
    }

    async recordTestLog(input: any) {
        return db.transaction(async (tx) => {
            return this.recordTestLogUC.execute(input, tx);
        });
    }

    async harvestPart(input: any) {
        return db.transaction(async (tx) => {
            return this.harvestPartUC.execute(input, tx);
        });
    }

    async forfeitServiceDevice(input: any) {
        return db.transaction(async (tx) => {
            return this.forfeitServiceDeviceUC.execute(input, tx);
        });
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
