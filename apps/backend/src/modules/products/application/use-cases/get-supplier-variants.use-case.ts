/**
 * Use case: Get variant templates configured for a specific supplier.
 */
import type { IVariantRepository } from "../../domain/variant-repository.port";
import type { VariantEntity } from "../../domain/product.entity";

export class GetSupplierVariantsUseCase {
    constructor(private readonly variantRepository: IVariantRepository) { }

    async execute(supplierId: string, dbOrTx?: unknown): Promise<VariantEntity[]> {
        return this.variantRepository.findVariantsBySupplierConfig(supplierId, dbOrTx);
    }
}
