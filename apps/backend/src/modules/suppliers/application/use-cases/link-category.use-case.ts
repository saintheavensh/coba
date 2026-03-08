import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { DBContext } from "../../../../shared/types/db-context";
import { ISupplierRepository } from "../../domain";

@injectable()
export class LinkCategoryUseCase {
    constructor(
        @inject(TYPES.ISupplierRepository) private readonly repository: ISupplierRepository
    ) { }

    async execute(supplierId: string, categoryId: string, dbOrTx?: DBContext): Promise<void> {
        return await this.repository.addCategoryLink(supplierId, categoryId, dbOrTx);
    }
}
