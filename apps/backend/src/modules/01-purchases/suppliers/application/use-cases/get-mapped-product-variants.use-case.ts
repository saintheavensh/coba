import { ISupplierRepository } from "../../domain";

export class GetMappedProductVariantsUseCase {
    constructor(private readonly repository: ISupplierRepository) { }

    async execute(supplierId: string) {
        if (!supplierId) {
            throw new Error("Validation Error: Supplier ID is required");
        }
        return await this.repository.getMappedProductVariants(supplierId);
    }
}
