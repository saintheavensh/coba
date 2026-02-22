/**
 * Use case: Get all opname sessions.
 */
import type { IStockOpnameRepository } from "../../domain/stock-opname-repository.port";

export class GetOpnameSessionsUseCase {
    constructor(private readonly stockOpnameRepository: IStockOpnameRepository) { }

    async execute() {
        return this.stockOpnameRepository.findSessions();
    }
}
