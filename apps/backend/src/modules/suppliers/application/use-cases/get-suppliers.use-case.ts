import { DBContext } from "../../../../shared/types/db-context";
import { ISupplierRepository } from "../../domain";

export class GetSuppliersUseCase {
    constructor(private repository: ISupplierRepository) { }

    async execute(dbOrTx?: DBContext) {
        return await this.repository.findAll(dbOrTx);
    }
}
