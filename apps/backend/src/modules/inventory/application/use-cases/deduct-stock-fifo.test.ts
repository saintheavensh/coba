import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { db } from "../../../../db";
import { DeductStockFIFOUseCase } from "./deduct-stock-fifo.use-case";
import { StockMutationGatewayAdapter } from "../../infrastructure/adapters/stock-mutation-gateway.adapter";
import { createMockCategory, createMockProduct, createMockProductBatch } from "../../../../../test/factories";
import { categories, products, productBatches } from "../../../../db/schema";
import { eq } from "drizzle-orm";

describe("DeductStockFIFOUseCase Concurrency", () => {
    let useCase: DeductStockFIFOUseCase;
    let gateway: StockMutationGatewayAdapter;

    beforeAll(() => {
        gateway = new StockMutationGatewayAdapter();
        useCase = new DeductStockFIFOUseCase(gateway);
    });

    it("should prevent overselling when processing concurrent requests", async () => {
        // Setup a category, product and a single batch with stock = 1
        const category = createMockCategory();
        const product = createMockProduct({ stock: 1, categoryId: category.id });
        const batch = createMockProductBatch({ productId: product.id, currentStock: 1, initialStock: 1 });

        await db.insert(categories).values(category);
        await db.insert(products).values(product);
        await db.insert(productBatches).values(batch);

        const input = {
            saleId: "test-sale-1",
            items: [
                {
                    productId: product.id,
                    variant: "",
                    quantity: 1,
                    unitPrice: 100
                }
            ]
        };

        // Fire 3 simultaneous requests to deduct 1 stock each (total 3 requested, only 1 available)
        const results = await Promise.allSettled([
            db.transaction(tx => useCase.execute(input, tx)),
            db.transaction(tx => useCase.execute(input, tx)),
            db.transaction(tx => useCase.execute(input, tx))
        ]);

        const successful = results.filter(r => r.status === "fulfilled");
        const failed = results.filter(r => r.status === "rejected");

        // Only exactly 1 should succeed
        expect(successful.length).toBe(1);
        expect(failed.length).toBe(2);

        // Verify that the failed ones threw "Insufficient stock"
        for (const failure of failed) {
            expect((failure as PromiseRejectedResult).reason.message).toMatch(/Insufficient stock/);
        }

        // Verify the database state correctly reflects exactly 0 stock left
        const updatedBatch = await db.query.productBatches.findFirst({
            where: eq(productBatches.id, batch.id)
        });
        expect(updatedBatch?.currentStock).toBe(0);

        const updatedProduct = await db.query.products.findFirst({
            where: eq(products.id, product.id)
        });
        expect(updatedProduct?.stock).toBe(0);

        // Cleanup
        await db.delete(productBatches).where(eq(productBatches.productId, product.id));
        await db.delete(products).where(eq(products.id, product.id));
        await db.delete(categories).where(eq(categories.id, category.id));
    });
});
