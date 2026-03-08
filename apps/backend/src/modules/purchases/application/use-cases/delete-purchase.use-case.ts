import { db } from "../../../../db";
import { DBContext } from "../../../../shared/types/db-context";
import { IPurchaseRepository } from "../../domain/purchase-repository.port";
import { InventoryService } from "../../../inventory/services/inventory.service";

export class DeletePurchaseUseCase {
    constructor(
        private purchaseRepo: IPurchaseRepository,
        private inventoryService: InventoryService
    ) { }

    async execute(purchaseId: string, dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || db;
        await client.transaction(async (tx) => {
            const purchase = await this.purchaseRepo.findById(purchaseId, tx);
            if (!purchase) return; // Idempotent delete

            // Reversal Trigger: Any item already received must be reversed in inventory
            const itemsToReverse = purchase.items
                .filter(i => i.qtyReceived > 0)
                .map(i => ({
                    productId: i.productId,
                    batchId: i.batchId || null,
                    qtyReceived: i.qtyReceived
                }));

            if (itemsToReverse.length > 0) {
                await this.inventoryService.reverseStockFromPurchaseDeletion({
                    purchaseId: purchase.id,
                    items: itemsToReverse
                }, tx);
            }

            // Persistence
            await this.purchaseRepo.delete(purchaseId, tx);
        });
    }
}
