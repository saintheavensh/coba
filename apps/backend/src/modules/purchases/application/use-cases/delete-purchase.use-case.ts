import { db } from "../../../../db";
import { IPurchaseRepository } from "../../domain/purchase-repository.port";
import { InventoryService } from "../../../inventory/services/inventory.service";

export class DeletePurchaseUseCase {
    constructor(
        private purchaseRepo: IPurchaseRepository,
        private inventoryService: InventoryService
    ) { }

    async execute(purchaseId: string): Promise<void> {
        await db.transaction(async (tx) => {
            const purchase = await this.purchaseRepo.findById(purchaseId);
            if (!purchase) return; // Idempotent delete

            const wasCompleted = purchase.status === "COMPLETED";

            // Reversal Trigger
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

            // Persistence
            await this.purchaseRepo.delete(purchaseId);
        });
    }
}
