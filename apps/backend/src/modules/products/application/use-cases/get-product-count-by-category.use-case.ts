/**
 * Use case: Count products belonging to a specific category.
 */
import type { IProductRepository } from "../../domain/product-repository.port";

export class GetProductCountByCategoryUseCase {
    constructor(private readonly productRepository: IProductRepository) { }

    async execute(categoryId: string, dbOrTx?: unknown): Promise<number> {
        return this.productRepository.countByCategory(categoryId, dbOrTx);
    }
}
