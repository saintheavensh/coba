import type { IStockOpnameRepository } from "../../domain/stock-opname-repository.port";
import type { IActivityLogger } from "../../domain/activity-logger.port";
import { StockCalculator } from "../../domain/services/stock-calculator";

export class CreateOpnameSessionUseCase {
    constructor(
        private readonly stockOpnameRepository: IStockOpnameRepository,
        private readonly activityLogger: IActivityLogger
    ) { }

    async execute(userId: string, notes?: string, categoryId?: string): Promise<string> {
        const repo = this.stockOpnameRepository;
        const today = new Date().toISOString().split("T")[0] || "19700101";
        const sessionId = `SO-${today.replace(/-/g, "")}-${Math.floor(Math.random() * 1000)}`;

        await repo.transaction(async (tx) => {
            await repo.insertSession({ id: sessionId, userId, notes, status: "draft" }, tx);

            let batches: any[] = [];
            if (categoryId) {
                const productIds = await repo.findProductIdsByCategory(categoryId, tx);
                if (productIds.length > 0) {
                    batches = await repo.findAllBatches(productIds, tx);
                }
            } else {
                batches = await repo.findAllBatches(undefined, tx);
            }

            const items = StockCalculator.groupBatchesIntoOpnameItems(sessionId, batches);
            if (items.length > 0) {
                await repo.insertItems(items, tx);
            }
        });

        await this.activityLogger.log({
            userId,
            action: "CREATE",
            entityType: "stock_opname",
            entityId: sessionId,
            description: `Started new stock opname session ${sessionId}`
        });

        return sessionId;
    }
}
