import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { DBContext } from "../../../../shared/types/db-context";
import { ISupplierRepository } from "../../domain";

@injectable()
export class DeleteSupplierUseCase {
    constructor(
        @inject(TYPES.ISupplierRepository) private readonly repository: ISupplierRepository
    ) { }

    async execute(id: string, dbOrTx?: DBContext): Promise<void> {
        return await this.repository.delete(id, dbOrTx);
    }
}
