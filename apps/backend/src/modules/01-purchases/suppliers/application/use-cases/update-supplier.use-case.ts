import { DBContext } from "../../../../../shared/types/db-context";
import { normalizeName } from "../../../../../shared/utils/normalize-name";
import { ISupplierRepository, UpdateSupplierData } from "../../domain";

export class UpdateSupplierUseCase {
    constructor(private repository: ISupplierRepository) { }

    async execute(id: string, data: UpdateSupplierData, dbOrTx?: DBContext) {
        const updateData: UpdateSupplierData = { ...data };
        if (data.name) {
            updateData.name = normalizeName(data.name);
        }

        return await this.repository.update(id, updateData, dbOrTx);
    }
}
