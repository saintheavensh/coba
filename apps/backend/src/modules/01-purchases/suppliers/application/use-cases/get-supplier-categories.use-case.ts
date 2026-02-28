import { DBContext } from "../../../../../shared/types/db-context";
import { ISupplierRepository } from "../../domain";

export class GetSupplierCategoriesUseCase {
    constructor(private repository: ISupplierRepository) { }

    async execute(supplierId: string, dbOrTx?: DBContext) {
        return await this.repository.getLinkedCategories(supplierId, dbOrTx);
    }
}
