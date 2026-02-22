/**
 * Stock consistency assertion: products.stock === SUM(product_batches.current_stock) per product.
 * Used at the end of stock mutations in the same transaction to roll back on mismatch.
 * @see docs/ref.md PR-3
 */
import { products, productBatches } from "../../../db/schema";
import { eq, sql } from "drizzle-orm";

export async function assertProductStockConsistency(productIds: string[], dbOrTx: any): Promise<void> {
    const tx = dbOrTx;
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
