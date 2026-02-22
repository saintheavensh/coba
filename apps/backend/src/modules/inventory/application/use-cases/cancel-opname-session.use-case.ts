/**
 * Use case: Cancel an opname session.
 */
import type { IStockOpnameRepository } from "../../domain/stock-opname-repository.port";
import type { IActivityLogger } from "../../domain/activity-logger.port";

export class CancelOpnameSessionUseCase {
    constructor(
        private readonly stockOpnameRepository: IStockOpnameRepository,
        private readonly activityLogger: IActivityLogger
    ) { }

    async execute(id: string, userId: string) {
        await this.stockOpnameRepository.updateSessionStatus(id, "cancelled");

        await this.activityLogger.log({
            userId,
            action: "UPDATE",
            entityType: "stock_opname",
            entityId: id,
            description: `Cancelled stock opname session ${id}`
        });
    }
}
