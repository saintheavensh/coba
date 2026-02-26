import { ISupplierRepository } from "../../domain";

export class MapProductVariantUseCase {
    constructor(private readonly repository: ISupplierRepository) { }

    async execute(supplierId: string, productId: string, variantId?: string | null) {
        if (!supplierId) {
            throw new Error("Validation Error: Supplier ID is required");
        }
        if (!productId) {
            throw new Error("Validation Error: Product ID is required");
        }
        await this.repository.mapProductVariant(supplierId, productId, variantId);
    }
}
