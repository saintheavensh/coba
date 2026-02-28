/**
 * Use case: Get the last batch for a product.
 * Used by purchases module to determine pricing context.
 */
import type { IBatchRepository, ProductBatchEntity } from "../../domain/batch-repository.port";

export class GetLastBatchUseCase {
    constructor(private readonly batchRepository: IBatchRepository) { }

    async execute(productId: string, dbOrTx?: unknown): Promise<ProductBatchEntity | null> {
        return this.batchRepository.getLastBatchByProduct(productId, dbOrTx);
    }
}
