/**
 * Use case: Add stock from a verified purchase.
 * Called by the purchases module during purchase verification.
 */
import type { IStockMutationGateway } from "../../domain/stock-mutation-gateway.port";
import type {
    AddStockFromPurchaseVerificationInput,
    AddStockFromPurchaseVerificationOutput
} from "../../domain/stock.types";

export class AddStockFromPurchaseUseCase {
    constructor(private readonly stockGateway: IStockMutationGateway) { }

    async execute(
        input: AddStockFromPurchaseVerificationInput,
        dbOrTx: unknown
    ): Promise<AddStockFromPurchaseVerificationOutput> {
        const allocations: AddStockFromPurchaseVerificationOutput["allocations"] = [];

        for (let i = 0; i < input.items.length; i++) {
            const item = input.items[i];
            if (item.qtyReceived <= 0) {
                throw new Error(`qtyReceived must be > 0 for purchase item ${item.purchaseItemId}`);
            }

            const batchId = `B-${Date.now().toString().slice(-6)}-${i}-${Math.floor(Math.random() * 1000)}`;

            await this.stockGateway.insertBatch({
                id: batchId,
                productId: item.productId,
                supplierId: input.supplierId,
                variantId: item.variantId,
                buyPrice: item.buyPrice,
                sellPrice: item.sellPrice,
                initialStock: item.qtyReceived,
                currentStock: item.qtyReceived
            }, dbOrTx);

            await this.stockGateway.updateProductStockDelta(item.productId, item.qtyReceived, dbOrTx);

            allocations.push({ purchaseItemId: item.purchaseItemId, batchId });
        }

        const productIds = [...new Set(input.items.map(i => i.productId))];
        await this.stockGateway.assertStockConsistency(productIds, dbOrTx);

        const totalQuantityApplied = input.items.reduce((sum, item) => sum + item.qtyReceived, 0);

        return {
            allocations,
            totalQuantityApplied,
            success: true
        };
    }
}
