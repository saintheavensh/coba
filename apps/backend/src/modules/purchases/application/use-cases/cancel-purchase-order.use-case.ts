import { db } from "../../../../db";
import { IPurchaseRepository } from "../../domain/purchase-repository.port";
import { InventoryService } from "../../../inventory/services/inventory.service";

export class CancelPurchaseOrderUseCase {
    constructor(
        private purchaseRepo: IPurchaseRepository,
        private inventoryService: InventoryService
    ) { }

    async execute(purchaseId: string): Promise<void> {
        await db.transaction(async (tx) => {
            const purchase = await this.purchaseRepo.findById(purchaseId);
            if (!purchase) {
                throw new Error(`Purchase order ${purchaseId} not found`);
            }

            const wasCompleted = purchase.status === "COMPLETED";

            // Domain Logic
            purchase.cancel();

            // Persistence
            await this.purchaseRepo.save(purchase, tx);

            // Reversal Trigger (Hard Rule)
            if (wasCompleted) {
                await this.inventoryService.reverseStockFromPurchaseDeletion({
                    purchaseId: purchase.id,
                    items: purchase.items.map(i => ({
                        productId: i.productId,
                        batchId: i.batchId || null,
                        qtyReceived: i.qtyReceived
                    }))
                }, tx);
            }
        });
    }
}
