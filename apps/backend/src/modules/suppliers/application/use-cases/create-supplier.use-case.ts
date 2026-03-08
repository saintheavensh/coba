import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { DBContext } from "../../../../shared/types/db-context";
import { normalizeName } from "../../../../shared/utils/normalize-name";
import { generateId, ID_PREFIX } from "../../../../shared/utils/validation/IdGenerator";
import { ISupplierRepository, Supplier, CreateSupplierData } from "../../domain";
import { HTTPException } from "hono/http-exception";

@injectable()
export class CreateSupplierUseCase {
    constructor(
        @inject(TYPES.ISupplierRepository) private readonly repository: ISupplierRepository
    ) { }

    async execute(data: Omit<CreateSupplierData, 'id'>, dbOrTx?: DBContext): Promise<Supplier> {
        const id = generateId(ID_PREFIX.SUPPLIER);
        const normalizedName = normalizeName(data.name);

        const [supplier] = await this.repository.create({
            ...data,
            id,
            name: normalizedName
        } as CreateSupplierData, dbOrTx);

        if (!supplier) {
            throw new HTTPException(500, { message: "Failed to create supplier" });
        }
        return supplier;
    }
}
