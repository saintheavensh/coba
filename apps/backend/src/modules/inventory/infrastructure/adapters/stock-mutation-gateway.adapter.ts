/**
 * Drizzle-based stock mutation gateway adapter.
 * Implements IStockMutationGateway from the domain layer.
 * Absorbs the stock consistency assertion (previously in helpers/).
 */
import type { IStockMutationGateway } from "../../domain/stock-mutation-gateway.port";
import type {
    DeductStockFIFOInput,
    DeductStockFIFOOutput,
    AddStockFromPurchaseVerificationInput,
    AddStockFromPurchaseVerificationOutput,
    ReverseStockInput
} from "../../domain/stock.types";
import { productBatches, products, productVariants } from "../../../../db/schema";
import { eq, and, gt, asc, inArray, sql, isNull } from "drizzle-orm";
import type { BatchLike, InsertBatchData } from "../../domain/stock-mutation-gateway.port";

export class StockMutationGatewayAdapter implements IStockMutationGateway {

    async findBatchesForFIFO(productId: string, variantName: string | null, dbOrTx: unknown): Promise<BatchLike[]> {
        const tx = dbOrTx as any;
        let targetVariantId: string | null = null;

        if (variantName) {
            const vQuery = await tx.select({ id: productVariants.id })
                .from(productVariants)
                .where(and(
                    eq(productVariants.productId, productId),
                    eq(productVariants.name, variantName)
                ));
            if (vQuery.length > 0) targetVariantId = vQuery[0].id;
        }

        return await tx.select({
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
            .orderBy(asc(productBatches.createdAt));
    }

    async updateBatchStockDelta(batchId: string, delta: number, dbOrTx: unknown): Promise<void> {
        const tx = dbOrTx as any;
        await tx.update(productBatches)
            .set({
                currentStock: sql`${productBatches.currentStock} + ${delta}`,
                updatedAt: new Date()
            })
            .where(eq(productBatches.id, batchId));
    }

    async updateProductStockDelta(productId: string, delta: number, dbOrTx: unknown): Promise<void> {
        const tx = dbOrTx as any;
        await tx.update(products)
            .set({ stock: sql`${products.stock} + ${delta}` })
            .where(eq(products.id, productId));
    }

    async insertBatch(data: InsertBatchData, dbOrTx: unknown): Promise<void> {
        const tx = dbOrTx as any;
        await tx.insert(productBatches).values({
            id: data.id,
            productId: data.productId,
            supplierId: data.supplierId,
            variantId: data.variantId,
            buyPrice: data.buyPrice,
            sellPrice: data.sellPrice,
            initialStock: data.initialStock,
            currentStock: data.currentStock
        });
    }

    async assertStockConsistency(productIds: string[], dbOrTx: unknown): Promise<void> {
        const tx = dbOrTx as any;
        for (const productId of productIds) {
            const [row] = await tx
                .select({ stock: products.stock })
                .from(products)
                .where(eq(products.id, productId));
            const productStock = row?.stock ?? 0;

            const [sumRow] = await tx
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
