/**
 * Use case: Get adjustment history from finalized opname sessions.
 */
import type { IStockOpnameRepository } from "../../domain/stock-opname-repository.port";

export class GetAdjustmentHistoryUseCase {
    constructor(private readonly stockOpnameRepository: IStockOpnameRepository) { }

    async execute() {
        return this.stockOpnameRepository.getAdjustmentHistoryRows();
    }
}
