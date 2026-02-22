import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * FIFO-across-2-batches unit test.
 * Verifies that deductStockFIFO correctly drains the oldest batch first,
 * then spills over to the newer batch, and calculates COGS from mixed buy prices.
 *
 * @see docs/ref.md PR-3 "FIFO across 2 batches" acceptance criterion
 */

// Mock the db/schema module
vi.mock("../../../db/schema", () => ({
    productBatches: { id: "id", productId: "productId", currentStock: "currentStock", variantId: "variantId", createdAt: "createdAt", updatedAt: "updatedAt" },
    products: { id: "id", stock: "stock" },
    productVariants: { id: "id", productId: "productId", name: "name" }
}));

vi.mock("drizzle-orm", () => ({
    eq: vi.fn((...args: unknown[]) => ({ _op: "eq", args })),
    and: vi.fn((...args: unknown[]) => ({ _op: "and", args })),
    gt: vi.fn((...args: unknown[]) => ({ _op: "gt", args })),
    asc: vi.fn((col: unknown) => ({ _op: "asc", col })),
    inArray: vi.fn((...args: unknown[]) => ({ _op: "inArray", args })),
    sql: vi.fn(),
}));

import { StockMutationGatewayAdapter } from "../infrastructure/stock-mutation-gateway.adapter";
import type { DeductStockFIFOInput } from "../domain/stock.types";

describe("FIFO across 2 batches", () => {
    let adapter: StockMutationGatewayAdapter;
    let mockTx: Record<string, any>;

    beforeEach(() => {
        adapter = new StockMutationGatewayAdapter();

        mockTx = {
            query: {
                productVariants: {
                    findMany: vi.fn().mockResolvedValue([{ id: "V1" }]),
                },
                productBatches: {
                    findMany: vi.fn().mockResolvedValue([
                        // Batch 1 (oldest): 3 units @ buyPrice 1000
                        { id: "B-OLD", productId: "P1", variantId: "V1", currentStock: 3, buyPrice: 1000, createdAt: new Date("2025-01-01") },
                        // Batch 2 (newer): 10 units @ buyPrice 1500
                        { id: "B-NEW", productId: "P1", variantId: "V1", currentStock: 10, buyPrice: 1500, createdAt: new Date("2025-02-01") },
                    ]),
                },
                products: {
                    findFirst: vi.fn().mockResolvedValue({ id: "P1", stock: 13 }),
                },
            },
            update: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(undefined),
            select: vi.fn().mockReturnThis(),
            from: vi.fn().mockImplementation(() => ({
                where: vi.fn().mockResolvedValue([{ stock: 13, sum: 13 }])
            })),
        };

        // Make assertStockConsistency pass (mock the selects it does)
        vi.spyOn(adapter, "assertStockConsistency").mockResolvedValue(undefined);
    });

    it("drains oldest batch first, then spills to newer batch", async () => {
        const input: DeductStockFIFOInput = {
            saleId: "SALE-001",
            items: [
                { productId: "P1", variant: "Original", quantity: 5, unitPrice: 2000 }
            ]
        };

        const result = await adapter.deductStockFIFO(input, mockTx);

        // Should produce 2 allocations: 3 from B-OLD, 2 from B-NEW
        expect(result.allocations).toHaveLength(2);

        expect(result.allocations[0]).toMatchObject({
            productId: "P1",
            batchId: "B-OLD",
            quantity: 3,
            buyPrice: 1000
        });

        expect(result.allocations[1]).toMatchObject({
            productId: "P1",
            batchId: "B-NEW",
            quantity: 2,
            buyPrice: 1500
        });
    });

    it("calculates COGS correctly from mixed buy prices", async () => {
        const input: DeductStockFIFOInput = {
            saleId: "SALE-002",
            items: [
                { productId: "P1", variant: "Original", quantity: 5, unitPrice: 2000 }
            ]
        };

        const result = await adapter.deductStockFIFO(input, mockTx);

        // COGS = (3 * 1000) + (2 * 1500) = 3000 + 3000 = 6000
        expect(result.cogsAmount).toBe(6000);
    });

    it("calls assertStockConsistency after deduction", async () => {
        const input: DeductStockFIFOInput = {
            saleId: "SALE-003",
            items: [
                { productId: "P1", variant: "Original", quantity: 2, unitPrice: 2000 }
            ]
        };

        await adapter.deductStockFIFO(input, mockTx);

        expect(adapter.assertStockConsistency).toHaveBeenCalledWith(["P1"], mockTx);
    });

    it("throws when requested quantity exceeds total stock across batches", async () => {
        const input: DeductStockFIFOInput = {
            saleId: "SALE-004",
            items: [
                { productId: "P1", variant: "Original", quantity: 20, unitPrice: 2000 }
            ]
        };

        await expect(adapter.deductStockFIFO(input, mockTx))
            .rejects.toThrow(/Insufficient stock/);
    });
});
