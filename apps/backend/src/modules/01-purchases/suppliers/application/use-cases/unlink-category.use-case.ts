import { DBContext } from "../../../../../shared/types/db-context";
import { ISupplierRepository } from "../../domain";

export class UnlinkCategoryUseCase {
    constructor(private repository: ISupplierRepository) { }

    async execute(supplierId: string, categoryId: string, dbOrTx?: DBContext) {
        return await this.repository.removeCategoryLink(supplierId, categoryId, dbOrTx);
    }
}
