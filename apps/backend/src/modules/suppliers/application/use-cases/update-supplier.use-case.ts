import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { DBContext } from "../../../../shared/types/db-context";
import { normalizeName } from "../../../../shared/utils/normalize-name";
import { ISupplierRepository, Supplier, UpdateSupplierData } from "../../domain";
import { HTTPException } from "hono/http-exception";

@injectable()
export class UpdateSupplierUseCase {
    constructor(
        @inject(TYPES.ISupplierRepository) private readonly repository: ISupplierRepository
    ) { }

    async execute(id: string, data: UpdateSupplierData, dbOrTx?: DBContext): Promise<Supplier> {
        const updateData: UpdateSupplierData = { ...data };
        if (data.name) {
            updateData.name = normalizeName(data.name);
        }

        const [supplier] = await this.repository.update(id, updateData, dbOrTx);
        if (!supplier) {
            throw new HTTPException(500, { message: "Failed to update supplier" });
        }
        return supplier;
    }
}
