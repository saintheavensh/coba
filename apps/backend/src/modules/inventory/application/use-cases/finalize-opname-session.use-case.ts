/**
 * Use case: Finalize an opname session — apply stock adjustments to batches.
 * Contains complex batch adjustment logic (FIFO deduction for loss, first-batch addition for surplus).
 */
import type { IStockOpnameRepository, OpnameItemEntity } from "../../domain/stock-opname-repository.port";
import type { IActivityLogger } from "../../domain/activity-logger.port";
import { StockCalculator } from "../../domain/services/stock-calculator";
import { DBContext } from "../../../../shared/types/db-context";

export class FinalizeOpnameSessionUseCase {
    constructor(
        private readonly stockOpnameRepository: IStockOpnameRepository,
        private readonly activityLogger: IActivityLogger
    ) { }

    async execute(id: string, userId: string, dbOrTx?: DBContext) {
        const client = dbOrTx || this.stockOpnameRepository; // Assuming repository has a transaction method or use db

        return await client.transaction(async (tx) => {
            const session = await this.stockOpnameRepository.findSessionById(id, tx);
            if (!session) throw new Error("Session not found");
            if (session.status !== "draft") throw new Error("Only draft sessions can be finalized");

            const items = await this.stockOpnameRepository.findItemsBySession(id, tx);

            for (const item of items) {
                if (item.physicalStock === null) continue;

                const difference = item.difference;
                if (difference === 0) continue;

                await this.adjustBatches(item, difference, userId, id, tx);
                await this.stockOpnameRepository.updateProductStockDelta(item.productId, difference, tx);
            }

            await this.stockOpnameRepository.updateSessionStatus(id, "completed", new Date(), tx);
        });

        await this.activityLogger.log({
            userId,
            action: "UPDATE",
            entityType: "stock_opname",
            entityId: id,
            description: `Finalized stock opname session ${id}`
        });

        return { success: true };
    }

    /**
     * Adjust batch stock based on opname difference.
     * LOSS: deduct from oldest batches (FIFO) using StockCalculator.
     * SURPLUS: add to first batch.
     */
    private async adjustBatches(
        item: OpnameItemEntity,
        difference: number,
        userId: string,
        sessionId: string,
        tx: DBContext
    ) {
        const repo = this.stockOpnameRepository;
        const batches = await repo.findBatchesByProductAndVariant(
            item.productId,
            item.variantName !== "Standard" ? item.variantName : null,
            tx
        );

        if (difference < 0) {
            const requestedQty = Math.abs(difference);
            const { allocations } = StockCalculator.calculateFIFO(requestedQty, batches);

            for (const allocation of allocations) {
                const batch = batches.find(b => b.id === allocation.batchId);
                if (!batch) continue;

                const newStock = batch.currentStock - allocation.quantity;
                await repo.updateBatchStock(batch.id, newStock, tx);

                await this.activityLogger.log({
                    userId,
                    action: "UPDATE",
                    entityType: "product_batch",
                    entityId: batch.id,
                    description: `Stock adjusted (LOSS) via SO ${sessionId}. Batch reduction: -${allocation.quantity}`,
                    details: { oldValue: { stock: batch.currentStock }, newValue: { stock: newStock } }
                }, tx);
            }
        } else {
            const firstBatch = batches[0];
            if (firstBatch) {
                const newStock = firstBatch.currentStock + difference;

                await repo.updateBatchStock(firstBatch.id, newStock, tx);

                await this.activityLogger.log({
                    userId,
                    action: "UPDATE",
                    entityType: "product_batch",
                    entityId: firstBatch.id,
                    description: `Stock adjusted (SURPLUS) via SO ${sessionId}. Added: +${difference}`,
                    details: { oldValue: { stock: firstBatch.currentStock }, newValue: { stock: newStock } }
                }, tx);
            }
        }
    }
}
