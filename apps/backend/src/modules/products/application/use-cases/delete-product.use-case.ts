/**
 * Use case: Delete a product by ID.
 */
import type { IProductRepository } from "../../domain/product-repository.port";

export class DeleteProductUseCase {
    constructor(private readonly productRepository: IProductRepository) { }

    async execute(id: string, dbOrTx?: unknown): Promise<void> {
        return this.productRepository.deleteProduct(id, dbOrTx);
    }
}
