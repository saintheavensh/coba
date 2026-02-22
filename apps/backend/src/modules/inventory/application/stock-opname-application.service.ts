/**
 * Application service for Stock Opname operations.
 * Depends only on domain ports — no Drizzle, no db, no schema imports.
 */
import type { IStockOpnameRepository, OpnameItemEntity } from "../domain/stock-opname-repository.port";
import type { IActivityLogger } from "../domain/activity-logger.port";

export interface StockOpnameApplicationServiceDeps {
    stockOpnameRepository: IStockOpnameRepository;
    activityLogger: IActivityLogger;
}

export class StockOpnameApplicationService {
    constructor(private readonly deps: StockOpnameApplicationServiceDeps) { }

    async createSession(userId: string, notes?: string, categoryId?: string): Promise<string> {
        const repo = this.deps.stockOpnameRepository;
        const sessionId = `SO-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${Math.floor(Math.random() * 1000)}`;

        await repo.transaction(async (tx) => {
            await repo.insertSession({ id: sessionId, userId, notes, status: "draft" }, tx);

            let batches;
            if (categoryId) {
                const productIds = await repo.findProductIdsByCategory(categoryId, tx);
                if (productIds.length === 0) return;
                batches = await repo.findAllBatches(productIds, tx);
            } else {
                batches = await repo.findAllBatches(undefined, tx);
            }

            const items = this.groupBatchesIntoItems(sessionId, batches);
            if (items.length > 0) {
                await repo.insertItems(items, tx);
            }
        });

        await this.deps.activityLogger.log({
            userId,
            action: "CREATE",
            entityType: "stock_opname",
            entityId: sessionId,
            description: `Started new stock opname session ${sessionId}`
        });

        return sessionId;
    }

    private groupBatchesIntoItems(
        sessionId: string,
        batches: Array<{ productId: string; variant?: string | null; currentStock: number }>
    ) {
        const groups: Record<string, { productId: string; variant: string | null; systemStock: number }> = {};

        for (const b of batches) {
            const key = `${b.productId}-${b.variant || "default"}`;
            if (!groups[key]) {
                groups[key] = { productId: b.productId, variant: b.variant ?? null, systemStock: 0 };
            }
            groups[key].systemStock += b.currentStock;
        }

        return Object.values(groups).map((g) => ({
            sessionId,
            productId: g.productId,
            variantName: g.variant || "Standard",
            systemStock: g.systemStock
        }));
    }

    async getSessions() {
        return this.deps.stockOpnameRepository.findSessions();
    }

    async getSessionDetails(id: string) {
        const repo = this.deps.stockOpnameRepository;
        const session = await repo.findSessionById(id);
        if (!session) return null;

        const items = await repo.findItemsBySession(id);
        return { ...session, items };
    }

    async updateItem(itemId: number, physicalStock: number, reason?: string) {
        const item = await this.deps.stockOpnameRepository.updateItem(itemId, physicalStock, reason);
        if (!item) throw new Error("Item not found");
        return { difference: item.difference };
    }

    async finalizeSession(id: string, userId: string) {
        const session = await this.getSessionDetails(id);
        if (!session) throw new Error("Session not found");
        if (session.status !== "draft") throw new Error("Only draft sessions can be finalized");

        const repo = this.deps.stockOpnameRepository;

        await repo.transaction(async (tx) => {
            for (const item of session.items) {
                if (item.physicalStock === null) continue;

                const difference = item.difference;
                if (difference === 0) continue;

                await this.adjustBatches(item, difference, userId, id, tx);

                await repo.updateProductStockDelta(item.productId, difference, tx);
            }

            await repo.updateSessionStatus(id, "completed", new Date(), tx);
        });

        await this.deps.activityLogger.log({
            userId,
            action: "UPDATE",
            entityType: "stock_opname",
            entityId: id,
            description: `Finalized stock opname session ${id}`
        });

        return { success: true };
    }

    private async adjustBatches(
        item: OpnameItemEntity,
        difference: number,
        userId: string,
        sessionId: string,
        tx: unknown
    ) {
        const repo = this.deps.stockOpnameRepository;
        const batches = await repo.findBatchesByProductAndVariant(
            item.productId,
            item.variantName !== "Standard" ? item.variantName : null,
            tx
        );

        if (difference < 0) {
            // LOSS/MISSING — deduct from oldest batches (FIFO)
            let remainingDiff = Math.abs(difference);
            for (const batch of batches) {
                if (remainingDiff === 0) break;

                const reduction = Math.min(batch.currentStock, remainingDiff);
                const newStock = batch.currentStock - reduction;

                await repo.updateBatchStock(batch.id, newStock, tx);

                await this.deps.activityLogger.log({
                    userId,
                    action: "UPDATE",
                    entityType: "product_batch",
                    entityId: batch.id,
                    description: `Stock adjusted (LOSS) via SO ${sessionId}. Batch reduction: -${reduction}`,
                    details: { oldValue: { stock: batch.currentStock }, newValue: { stock: newStock } }
                }, tx);

                remainingDiff -= reduction;
            }
        } else {
            // SURPLUS — add to first batch
            if (batches.length > 0) {
                const firstBatch = batches[0];
                const newStock = firstBatch.currentStock + difference;

                await repo.updateBatchStock(firstBatch.id, newStock, tx);

                await this.deps.activityLogger.log({
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

    async cancelSession(id: string, userId: string) {
        await this.deps.stockOpnameRepository.updateSessionStatus(id, "cancelled");

        await this.deps.activityLogger.log({
            userId,
            action: "UPDATE",
            entityType: "stock_opname",
            entityId: id,
            description: `Cancelled stock opname session ${id}`
        });
    }

    async getAdjustmentHistory() {
        return this.deps.stockOpnameRepository.getAdjustmentHistoryRows();
    }
}
