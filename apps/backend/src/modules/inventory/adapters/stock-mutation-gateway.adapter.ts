import type { IStockMutationGateway } from "../ports/stock-mutation-gateway.port";
import type {
    DeductStockFIFOInput,
    DeductStockFIFOOutput,
    AddStockFromPurchaseVerificationInput,
    AddStockFromPurchaseVerificationOutput
} from "../types/stock.types";
import { productBatches, products, productVariants } from "../../../db/schema";
import { eq, and, gt, asc, inArray, sql } from "drizzle-orm";
import { assertProductStockConsistency } from "../helpers/stock-consistency";

/**
 * Implements stock mutations with Drizzle. Single gate for stock-in/out.
 */
export class StockMutationGatewayAdapter implements IStockMutationGateway {
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

        const productIds = [...new Set(input.items.map((i) => i.productId))];
        await assertProductStockConsistency(productIds, tx);
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

        const productIds = [...new Set(input.items.map((i) => i.productId))];
        await assertProductStockConsistency(productIds, tx);
        return { allocations };
    }
}
