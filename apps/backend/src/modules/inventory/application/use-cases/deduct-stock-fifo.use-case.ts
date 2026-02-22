import type { IStockMutationGateway } from "../../domain/stock-mutation-gateway.port";
import type { DeductStockFIFOInput, DeductStockFIFOOutput } from "../../domain/stock.types";
import { StockCalculator } from "../../domain/services/stock-calculator";

export class DeductStockFIFOUseCase {
    constructor(private readonly stockGateway: IStockMutationGateway) { }

    async execute(input: DeductStockFIFOInput, dbOrTx: unknown): Promise<DeductStockFIFOOutput> {
        const allocations: DeductStockFIFOOutput["allocations"] = [];
        let totalCogs = 0;

        for (const item of input.items) {
            const batches = await this.stockGateway.findBatchesForFIFO(item.productId, item.variant, dbOrTx);

            const totalAvailable = batches.reduce((sum, b) => sum + b.currentStock, 0);
            if (totalAvailable < item.quantity) {
                throw new Error(`Insufficient stock for Product ${item.productId} (${item.variant}). Available: ${totalAvailable}, Requested: ${item.quantity}`);
            }

            const result = StockCalculator.calculateFIFO(item.quantity, batches);

            for (const allocation of result.allocations) {
                const batch = batches.find(b => b.id === allocation.batchId);
                if (!batch) continue;

                await this.stockGateway.updateBatchStockDelta(batch.id, -allocation.quantity, dbOrTx);

                allocations.push({
                    productId: item.productId,
                    variantId: batch.variantId,
                    variantName: item.variant,
                    batchId: batch.id,
                    quantity: allocation.quantity,
                    buyPrice: batch.buyPrice
                });
            }

            if (result.remainingQty > 0) {
                throw new Error(`Concurrency Error: Stock changed during processing for ${item.productId}`);
            }

            // Deduct from product total
            await this.stockGateway.updateProductStockDelta(item.productId, -item.quantity, dbOrTx);
            totalCogs += result.totalCogs;
        }

        const productIds = [...new Set(input.items.map(i => i.productId))];
        await this.stockGateway.assertStockConsistency(productIds, dbOrTx);

        return { allocations, cogsAmount: totalCogs };
    }
}
