/**
 * Drizzle-based batch repository adapter.
 * Implements IBatchRepository from the inventory domain layer.
 * Extracts getLastBatchByProduct from the old ProductRepositoryAdapter.
 */
import type { IBatchRepository, ProductBatchEntity } from "../../domain/batch-repository.port";
import { db } from "../../../../../shared/infrastructure/database/client";
import { productBatches } from "../../../../../shared/infrastructure/database/schema";
import { eq } from "drizzle-orm";

export class BatchRepositoryAdapter implements IBatchRepository {
    async getLastBatchByProduct(productId: string, dbOrTx: any = db): Promise<ProductBatchEntity | null> {
        return await dbOrTx.query.productBatches.findFirst({
            where: eq(productBatches.productId, productId),
            orderBy: (b: any, { desc }: any) => [desc(b.createdAt)],
            with: { supplier: true }
        }) || null;
    }

    async findById(batchId: string, dbOrTx: any = db): Promise<ProductBatchEntity | null> {
        return await dbOrTx.query.productBatches.findFirst({
            where: eq(productBatches.id, batchId),
            with: { supplier: true }
        }) || null;
    }
}
