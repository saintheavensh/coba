/**
 * Drizzle-based stock mutation gateway adapter.
 * Implements IStockMutationGateway from the domain layer.
 * Absorbs the stock consistency assertion (previously in helpers/).
 */
import type { IStockMutationGateway } from "../domain/stock-mutation-gateway.port";
import type {
    DeductStockFIFOInput,
    DeductStockFIFOOutput,
    AddStockFromPurchaseVerificationInput,
    AddStockFromPurchaseVerificationOutput,
    ReverseStockInput
} from "../domain/stock.types";
import { productBatches, products, productVariants } from "../../../db/schema";
import { eq, and, gt, asc, inArray, sql } from "drizzle-orm";

export class StockMutationGatewayAdapter implements IStockMutationGateway {

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

    async deductStockFIFO(input: DeductStockFIFOInput, dbOrTx: unknown): Promise<DeductStockFIFOOutput> {
        const tx = dbOrTx as any;
        const allocations: DeductStockFIFOOutput["allocations"] = [];
        let cogsAmount = 0;

        for (const item of input.items) {
            let remainingQty = item.quantity;

            const targetVariants = await tx.query.productVariants.findMany({
                where: and(
                    eq(productVariants.productId, item.productId),
                    eq(productVariants.name, item.variant)
                ),
                columns: { id: true }
            });
            const targetVariantIds = targetVariants.map((v: { id: string }) => v.id);

            const batches = await tx.query.productBatches.findMany({
                where: and(
                    eq(productBatches.productId, item.productId),
                    targetVariantIds.length > 0 ? inArray(productBatches.variantId, targetVariantIds) : undefined,
                    gt(productBatches.currentStock, 0)
                ),
                orderBy: [asc(productBatches.createdAt)]
            });

            const totalVariantStock = batches.reduce((sum: number, b: { currentStock: number }) => sum + b.currentStock, 0);
            if (totalVariantStock < remainingQty) {
                throw new Error(`Insufficient stock for Product ${item.productId} (${item.variant}). Available: ${totalVariantStock}, Requested: ${remainingQty}`);
            }

            for (const batch of batches) {
                if (remainingQty <= 0) break;
                const deduct = Math.min(batch.currentStock, remainingQty);
                await tx.update(productBatches)
                    .set({
                        currentStock: batch.currentStock - deduct,
                        updatedAt: new Date()
                    })
                    .where(eq(productBatches.id, batch.id));
                allocations.push({
                    productId: item.productId,
                    variantId: batch.variantId,
                    variantName: item.variant,
                    batchId: batch.id,
                    quantity: deduct,
                    buyPrice: batch.buyPrice
                });
                cogsAmount += deduct * batch.buyPrice;
                remainingQty -= deduct;
            }

            if (remainingQty > 0) {
                throw new Error(`Concurrency Error: Stock changed during processing for ${item.productId}`);
            }

            const product = await tx.query.products.findFirst({
                where: eq(products.id, item.productId)
            });
            if (product) {
                await tx.update(products)
                    .set({ stock: (product.stock || 0) - item.quantity })
                    .where(eq(products.id, item.productId));
            }
        }

        const productIds = [...new Set(input.items.map((i: DeductStockFIFOInput["items"][number]) => i.productId))];
        await this.assertStockConsistency(productIds, tx);
        return { allocations, cogsAmount };
    }

    async addStockFromPurchaseVerification(
        input: AddStockFromPurchaseVerificationInput,
        dbOrTx: unknown
    ): Promise<AddStockFromPurchaseVerificationOutput> {
        const tx = dbOrTx as any;
        const allocations: AddStockFromPurchaseVerificationOutput["allocations"] = [];

        for (let i = 0; i < input.items.length; i++) {
            const item = input.items[i];
            if (item.qtyReceived <= 0) {
                throw new Error(`qtyReceived must be > 0 for purchase item ${item.purchaseItemId}`);
            }
            const batchId = "B-" + Date.now().toString().slice(-6) + "-" + i + "-" + Math.floor(Math.random() * 1000);
            await tx.insert(productBatches).values({
                id: batchId,
                productId: item.productId,
                supplierId: input.supplierId,
                variantId: item.variantId,
                buyPrice: item.buyPrice,
                sellPrice: item.sellPrice,
                initialStock: item.qtyReceived,
                currentStock: item.qtyReceived
            });
            await tx.update(products)
                .set({ stock: sql`${products.stock} + ${item.qtyReceived}` })
                .where(eq(products.id, item.productId));
            allocations.push({ purchaseItemId: item.purchaseItemId, batchId });
        }

        const productIds = [...new Set(input.items.map((i: AddStockFromPurchaseVerificationInput["items"][number]) => i.productId))];
        await this.assertStockConsistency(productIds, tx);
        return { allocations };
    }

    async reverseStockFromPurchaseDeletion(
        input: ReverseStockInput,
        dbOrTx: unknown
    ): Promise<void> {
        const tx = dbOrTx as any;
        const affectedProductIds: Set<string> = new Set();

        for (const item of input.items) {
            affectedProductIds.add(item.productId);

            if (item.batchId) {
                const batch = await tx.query.productBatches.findFirst({
                    where: eq(productBatches.id, item.batchId)
                });
                if (batch) {
                    await tx.update(productBatches)
                        .set({
                            currentStock: sql`${productBatches.currentStock} - ${item.qtyReceived}`,
                            updatedAt: new Date()
                        })
                        .where(eq(productBatches.id, item.batchId));
                }
            }

            await tx.update(products)
                .set({ stock: sql`${products.stock} - ${item.qtyReceived}` })
                .where(eq(products.id, item.productId));
        }

        await this.assertStockConsistency([...affectedProductIds], tx);
    }
}
