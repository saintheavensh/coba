import { DBContext } from "../../../../shared/types/db-context";
import type { IStockMutationGateway } from "../../domain/stock-mutation-gateway.port";
import type { ReverseStockInput } from "../../domain/stock.types";

export class ReverseStockUseCase {
    constructor(private readonly stockGateway: IStockMutationGateway) { }

    async execute(input: ReverseStockInput, dbOrTx?: DBContext): Promise<void> {
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
