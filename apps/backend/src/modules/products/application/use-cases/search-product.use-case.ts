/**
 * Use case: Search products flattened by variant (for POS/lookup).
 */
import type { IProductRepository } from "../../domain/product-repository.port";
import type { SearchResult } from "../../domain/product.entity";

export class SearchProductUseCase {
    constructor(private readonly productRepository: IProductRepository) { }

    async execute(search?: string, dbOrTx?: unknown): Promise<SearchResult[]> {
        return this.productRepository.searchProductFlattened(search, dbOrTx);
    }
}
