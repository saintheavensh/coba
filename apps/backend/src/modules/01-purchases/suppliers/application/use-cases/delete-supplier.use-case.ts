import { DBContext } from "../../../../../shared/types/db-context";
import { ISupplierRepository } from "../../domain";

export class DeleteSupplierUseCase {
    constructor(private repository: ISupplierRepository) { }

    async execute(id: string, dbOrTx?: DBContext) {
        return await this.repository.delete(id, dbOrTx);
    }
}
