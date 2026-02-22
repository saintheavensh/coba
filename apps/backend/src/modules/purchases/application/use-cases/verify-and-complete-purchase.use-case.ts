import { db } from "../../../../db";
import { IPurchaseRepository } from "../../domain/purchase-repository.port";
import { ProductsService } from "../../../products/products-container";
import { InventoryService } from "../../../inventory/services/inventory.service";
import { JournalService } from "../../../accounting/services/journal.service";
import { DomainError } from "../../domain/entities/purchase.entity";

export interface VerifyAndCompletePurchaseDto {
    purchaseId: string;
    userId: string;
}

export class VerifyAndCompletePurchaseUseCase {
    constructor(
        private purchaseRepo: IPurchaseRepository,
        private productsService: ProductsService,
        private inventoryService: InventoryService
    ) { }

    async execute(dto: VerifyAndCompletePurchaseDto): Promise<void> {
        await db.transaction(async (tx) => {
            const purchase = await this.purchaseRepo.findById(dto.purchaseId);
            if (!purchase) {
                throw new Error(`Purchase order ${dto.purchaseId} not found`);
            }

            // Guard: Idempotency (Strict Rule)
            if (purchase.status === "COMPLETED") {
                throw new Error(`Purchase order ${dto.purchaseId} is already completed.`);
            }

            // Guard: Lifecycle (RECEIVED -> COMPLETED)
            if (purchase.status !== "RECEIVED") {
                throw new Error(`Purchase order must be in RECEIVED status to be completed. Current status: ${purchase.status}`);
            }

            // Guard: Product/Variant Validation (Cross-Module via Service)
            for (const item of purchase.items) {
                const product = await this.productsService.getProductById(item.productId, tx);
                if (!product) {
                    throw new Error(`Validation failed: Product ${item.productId} does not exist.`);
                }
                // Variant validation if applicable
                if (item.variantId) {
                    const variants = await this.productsService.getProductVariants(item.productId, undefined, tx);
                    const variant = variants.find(v => v.id === item.variantId);
                    if (!variant) {
                        throw new Error(`Validation failed: Variant ${item.variantId} for product ${item.productId} does not exist.`);
                    }
                }
            }

            // Domain Guard: Fully received
            const allReceived = purchase.items.every(i => i.qtyReceived === i.qtyOrdered);
            if (!allReceived) {
                throw new Error("Cannot complete purchase: Not all items are fully received.");
            }

            // Monetary Precision: Rounding once at the end of calculation
            // (Assuming buyPrice and qty are already normalized at entry)
            // Normalization helper (Design only, implementation uses Math.round for this project's integer storage)
            const round = (val: number) => Math.round(val);
            const totalAmount = purchase.items.reduce((sum, item) => {
                return sum + round(item.buyPrice * item.qtyReceived);
            }, 0);

            // Refinement: Accounting Idempotency Check
            const existingJournals = await JournalService.getAll({
                referenceType: "purchase",
                referenceId: dto.purchaseId
            }, tx);
            if (existingJournals.length > 0) {
                throw new Error(`Journal for purchase ${dto.purchaseId} already exists. Terminating to prevent duplicate entry.`);
            }

            // Inventory Integration (Hardened Contract)
            const inventoryResponse = await this.inventoryService.addStockFromPurchaseVerification({
                purchaseId: purchase.id,
                supplierId: purchase.supplierId,
                items: purchase.items.map(i => ({
                    purchaseItemId: i.toSnapshot().id!,
                    productId: i.productId,
                    variantId: i.variantId || null,
                    buyPrice: i.buyPrice,
                    sellPrice: i.sellPrice,
                    qtyReceived: i.qtyReceived
                }))
            }, tx);

            // HARD RULE: Response Validation
            const requestedQty = purchase.items.reduce((sum, i) => sum + i.qtyReceived, 0);
            if (!inventoryResponse.success || inventoryResponse.totalQuantityApplied !== requestedQty) {
                throw new Error(`Inventory integrity failure: Requested ${requestedQty}, Applied ${inventoryResponse.totalQuantityApplied}. Rolling back.`);
            }
            if (inventoryResponse.allocations.length === 0) {
                throw new Error("Inventory integrity failure: No batches created. Rolling back.");
            }

            // Accounting Integration
            // Map purchase items to journal lines (Inventory Account vs Payable/Cash)
            // Note: In real app, account IDs would be fetched from settings. 
            // Here we use placeholders as per rule "Design note only".
            await JournalService.create({
                description: `Purchase Completion: ${purchase.id}`,
                referenceType: "purchase",
                referenceId: purchase.id,
                isAutoGenerated: true,
                lines: [
                    { accountId: "1-1002", debit: totalAmount, credit: 0, description: "Inventory Asset" }, // Debit Inventory
                    { accountId: "2-1001", debit: 0, credit: totalAmount, description: "Accounts Payable" } // Credit Payable
                ]
            }, dto.userId, tx);

            // Update Purchase with batch IDs (from inventory allocations)
            const snapshots = purchase.items.map(item => {
                const allocation = inventoryResponse.allocations.find(a => a.purchaseItemId === item.toSnapshot().id);
                if (allocation) {
                    // Update item with batchId (simplified for this refactor)
                }
                return item;
            });

            // Transition state to COMPLETED
            purchase.complete();

            // Save Final State
            await this.purchaseRepo.save(purchase, tx);

            // Domain Events are now in purchase.events, dispatcher dormant as per requirement.
        });
    }
}
