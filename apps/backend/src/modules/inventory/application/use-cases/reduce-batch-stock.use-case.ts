import { DBContext } from "../../../../shared/types/db-context";
import type { IStockMutationGateway } from "../../domain/stock-mutation-gateway.port";
import type { IBatchRepository } from "../../domain/batch-repository.port";

export class ReduceBatchStockUseCase {
    constructor(
        private readonly stockGateway: IStockMutationGateway,
        private readonly batchRepository: IBatchRepository
    ) { }

    async execute(batchId: string, qty: number, dbOrTx?: DBContext): Promise<void> {
        const batch = await this.batchRepository.findById(batchId, dbOrTx);
        if (!batch) throw new Error("Batch not found");

        if (batch.currentStock < qty) {
            throw new Error(`Insufficient stock in batch ${batchId}. Available: ${batch.currentStock}, Requested: ${qty}`);
        }

        // 1. Reduce batch stock
        await this.stockGateway.updateBatchStockDelta(batchId, -qty, dbOrTx);

        // 2. Reduce product total stock
        await this.stockGateway.updateProductStockDelta(batch.productId, -qty, dbOrTx);

        // 3. Consistency check
        await this.stockGateway.assertStockConsistency([batch.productId], dbOrTx);
    }
}
