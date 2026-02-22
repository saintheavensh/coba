/**
 * Use case: Retrieve all products with optional device/search/category filters.
 */
import type { IProductRepository } from "../../domain/product-repository.port";
import type { ProductEntity } from "../../domain/product.entity";

export class GetProductsUseCase {
    constructor(private readonly productRepository: IProductRepository) { }

    async execute(deviceId?: string, search?: string, categoryId?: string, dbOrTx?: unknown): Promise<ProductEntity[]> {
        return this.productRepository.findAll(deviceId, search, categoryId, dbOrTx);
    }
}
