import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { DBContext } from "../../../../shared/types/db-context";
import { ISupplierRepository } from "../../domain";

@injectable()
export class GetSupplierCategoriesUseCase {
    constructor(
        @inject(TYPES.ISupplierRepository) private readonly repository: ISupplierRepository
    ) { }

    async execute(supplierId: string, dbOrTx?: DBContext): Promise<any[]> {
        return await this.repository.getLinkedCategories(supplierId, dbOrTx);
    }
}
