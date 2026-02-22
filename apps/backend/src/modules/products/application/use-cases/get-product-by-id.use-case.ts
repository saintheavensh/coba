/**
 * Use case: Retrieve a single product by ID.
 */
import type { IProductRepository } from "../../domain/product-repository.port";
import type { ProductEntity } from "../../domain/product.entity";

export class GetProductByIdUseCase {
    constructor(private readonly productRepository: IProductRepository) { }

    async execute(id: string, dbOrTx?: unknown): Promise<ProductEntity | null> {
        return this.productRepository.findById(id, dbOrTx);
    }
}
