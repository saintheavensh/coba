/**
 * Use case: Update a single opname item's physical stock count.
 */
import type { IStockOpnameRepository } from "../../domain/stock-opname-repository.port";

export class UpdateOpnameItemUseCase {
    constructor(private readonly stockOpnameRepository: IStockOpnameRepository) { }

    async execute(itemId: number, physicalStock: number, reason?: string) {
        const item = await this.stockOpnameRepository.updateItem(itemId, physicalStock, reason);
        if (!item) throw new Error("Item not found");
        return { difference: item.difference };
    }
}
