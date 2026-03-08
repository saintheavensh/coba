import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { DBContext } from "../../../../shared/types/db-context";
import { ISupplierRepository, Supplier } from "../../domain";

@injectable()
export class GetSuppliersUseCase {
    constructor(
        @inject(TYPES.ISupplierRepository) private readonly repository: ISupplierRepository
    ) { }

    async execute(dbOrTx?: DBContext): Promise<Supplier[]> {
        return await this.repository.findAll(dbOrTx);
    }
}
