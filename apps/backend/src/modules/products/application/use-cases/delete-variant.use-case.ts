/**
 * Use case: Delete a variant by ID.
 */
import type { IVariantRepository } from "../../domain/variant-repository.port";

export class DeleteVariantUseCase {
    constructor(private readonly variantRepository: IVariantRepository) { }

    async execute(id: string, dbOrTx?: unknown): Promise<void> {
        return this.variantRepository.deleteVariant(id, dbOrTx);
    }
}
