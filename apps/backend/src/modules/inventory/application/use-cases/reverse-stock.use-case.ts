/**
 * Use case: Reverse stock changes from a deleted/cancelled purchase.
 * Called by the purchases module during purchase deletion.
 */
import type { IStockMutationGateway } from "../../domain/stock-mutation-gateway.port";
import type { ReverseStockInput } from "../../domain/stock.types";

export class ReverseStockUseCase {
    constructor(private readonly stockGateway: IStockMutationGateway) { }

    async execute(input: ReverseStockInput, dbOrTx: unknown): Promise<void> {
        const affectedProductIds = new Set<string>();

        for (const item of input.items) {
            affectedProductIds.add(item.productId);

            if (item.batchId) {
                await this.stockGateway.updateBatchStockDelta(item.batchId, -item.qtyReceived, dbOrTx);
            }

            await this.stockGateway.updateProductStockDelta(item.productId, -item.qtyReceived, dbOrTx);
        }

        await this.stockGateway.assertStockConsistency([...affectedProductIds], dbOrTx);
    }
}
