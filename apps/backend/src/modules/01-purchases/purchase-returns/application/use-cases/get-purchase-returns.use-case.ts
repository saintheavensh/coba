import { DBContext } from "../../../../../shared/types/db-context";
import { IPurchaseReturnRepository, PurchaseReturn } from "../../domain";

export class GetPurchaseReturnsUseCase {
    constructor(private readonly repository: IPurchaseReturnRepository) { }

    async execute(dbOrTx?: DBContext): Promise<PurchaseReturn[]> {
        return await this.repository.findAll(dbOrTx);
    }
}
