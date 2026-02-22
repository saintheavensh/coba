/**
 * Drizzle-based batch repository adapter.
 * Implements IBatchRepository from the inventory domain layer.
 * Extracts getLastBatchByProduct from the old ProductRepositoryAdapter.
 */
import type { IBatchRepository, ProductBatchEntity } from "../../domain/batch-repository.port";
import { db } from "../../../../db";
import { productBatches } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export class BatchRepositoryAdapter implements IBatchRepository {
    async getLastBatchByProduct(productId: string, dbOrTx: any = db): Promise<ProductBatchEntity | null> {
        const batch = await dbOrTx.query.productBatches.findFirst({
            where: eq(productBatches.productId, productId),
            orderBy: (b: any, { desc }: any) => [desc(b.createdAt)],
            with: { supplier: true }
        });
        return batch || null;
    }
}
