/**
 * Use case: Get high-level inventory/catalog statistics (total products, low stock, etc.).
 */
import type { IProductRepository } from "../../domain/product-repository.port";
import type { InventoryStats } from "../../domain/product.entity";

export class GetInventoryStatsUseCase {
    constructor(private readonly productRepository: IProductRepository) { }

    async execute(dbOrTx?: unknown): Promise<InventoryStats> {
        return this.productRepository.getInventoryStats(dbOrTx);
    }
}
