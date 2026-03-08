import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { ISupplierRepository } from "../../domain";
import { HTTPException } from "hono/http-exception";

@injectable()
export class GetMappedProductVariantsUseCase {
    constructor(
        @inject(TYPES.ISupplierRepository) private readonly repository: ISupplierRepository
    ) { }

    async execute(supplierId: string): Promise<any[]> {
        if (!supplierId) {
            throw new HTTPException(400, { message: "Supplier ID is required" });
        }
        return await this.repository.getMappedProductVariants(supplierId);
    }
}
