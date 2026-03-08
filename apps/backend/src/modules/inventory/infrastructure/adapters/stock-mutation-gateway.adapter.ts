/**
 * Drizzle-based stock mutation gateway adapter.
 * Implements IStockMutationGateway from the domain layer.
 * Absorbs the stock consistency assertion (previously in helpers/).
 */
import type { IStockMutationGateway } from "../../domain/stock-mutation-gateway.port";
import { productBatches, products, productVariants } from "../../../../db/schema";
import { eq, and, gt, asc, sql, isNull } from "drizzle-orm";
import type { BatchLike, InsertBatchData } from "../../domain/stock-mutation-gateway.port";

import { DBContext } from "../../../../shared/types/db-context";
import { db } from "../../../../db";

export class StockMutationGatewayAdapter implements IStockMutationGateway {

    async findBatchesForFIFO(productId: string, variantName: string | null, dbOrTx?: DBContext): Promise<BatchLike[]> {
        const client = dbOrTx || db;
        let targetVariantId: string | null = null;

        if (variantName) {
            const vQuery = await client.select({ id: productVariants.id })
                .from(productVariants)
                .where(and(
                    eq(productVariants.productId, productId),
                    eq(productVariants.name, variantName)
                ));
            if (vQuery.length > 0) targetVariantId = vQuery[0]!.id;
        }

        return await client.select({
            id: productBatches.id,
            currentStock: productBatches.currentStock,
            buyPrice: productBatches.buyPrice,
            variantId: productBatches.variantId
        })
            .from(productBatches)
            .where(and(
                eq(productBatches.productId, productId),
                targetVariantId
                    ? eq(productBatches.variantId, targetVariantId)
                    : isNull(productBatches.variantId),
                gt(productBatches.currentStock, 0)
            ))
            .orderBy(asc(productBatches.createdAt))
            .for('update');
    }

    async updateBatchStockDelta(batchId: string, delta: number, dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || db;
        await client.update(productBatches)
            .set({
                currentStock: sql`${productBatches.currentStock} + ${delta}`,
                updatedAt: new Date()
            })
            .where(eq(productBatches.id, batchId));
    }

    async updateProductStockDelta(productId: string, delta: number, dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || db;
        await client.update(products)
            .set({ stock: sql`${products.stock} + ${delta}` })
            .where(eq(products.id, productId));
    }

    async insertBatch(data: InsertBatchData, dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || db;
        await client.insert(productBatches).values({
            id: data.id,
            productId: data.productId,
            supplierId: data.supplierId,
            supplierName: data.supplierName,
            variantId: data.variantId,
            buyPrice: data.buyPrice,
            sellPrice: data.sellPrice,
            initialStock: data.initialStock,
            currentStock: data.currentStock
        });
    }

    async assertStockConsistency(productIds: string[], dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || db;
        for (const productId of productIds) {
            const [row] = await client
                .select({ stock: products.stock })
                .from(products)
                .where(eq(products.id, productId));
            const productStock = row?.stock ?? 0;

            const [sumRow] = await client
                .select({ sum: sql<number>`coalesce(sum(${productBatches.currentStock}), 0)` })
                .from(productBatches)
                .where(eq(productBatches.productId, productId));
            const batchSum = Number(sumRow?.sum ?? 0);

            if (productStock !== batchSum) {
                throw new Error(
                    `Stock consistency failed for product ${productId}: products.stock=${productStock} !== sum(batches.current_stock)=${batchSum}`
                );
            }
        }
    }
}
