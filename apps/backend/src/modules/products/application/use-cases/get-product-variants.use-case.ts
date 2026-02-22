/**
 * Use case: Get variants for a product (optionally filtered by supplier).
 */
import type { IVariantRepository } from "../../domain/variant-repository.port";
import type { VariantEntity } from "../../domain/product.entity";

export class GetProductVariantsUseCase {
    constructor(private readonly variantRepository: IVariantRepository) { }

    async execute(productId: string, supplierId?: string, dbOrTx?: unknown): Promise<VariantEntity[]> {
        return this.variantRepository.findVariantsByProductId(productId, supplierId, dbOrTx);
    }
}
