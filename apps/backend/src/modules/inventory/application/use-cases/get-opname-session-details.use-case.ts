/**
 * Use case: Get full session details with items.
 */
import type { IStockOpnameRepository } from "../../domain/stock-opname-repository.port";

export class GetOpnameSessionDetailsUseCase {
    constructor(private readonly stockOpnameRepository: IStockOpnameRepository) { }

    async execute(id: string) {
        const session = await this.stockOpnameRepository.findSessionById(id);
        if (!session) return null;

        const items = await this.stockOpnameRepository.findItemsBySession(id);
        return { ...session, items };
    }
}
