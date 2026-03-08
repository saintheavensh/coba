import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { ISupplierRepository } from "../../domain";
import { HTTPException } from "hono/http-exception";

@injectable()
export class MapProductVariantUseCase {
    constructor(
        @inject(TYPES.ISupplierRepository) private readonly repository: ISupplierRepository
    ) { }

    async execute(supplierId: string, productId: string, variantId?: string | null): Promise<void> {
        if (!supplierId) {
            throw new HTTPException(400, { message: "Supplier ID is required" });
        }
        if (!productId) {
            throw new HTTPException(400, { message: "Product ID is required" });
        }
        await this.repository.mapProductVariant(supplierId, productId, variantId);
    }
}
