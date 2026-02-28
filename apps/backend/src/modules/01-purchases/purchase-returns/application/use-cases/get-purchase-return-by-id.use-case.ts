import { DBContext } from "../../../../../shared/types/db-context";
import { IPurchaseReturnRepository, PurchaseReturn } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class GetPurchaseReturnByIdUseCase {
    constructor(private readonly repository: IPurchaseReturnRepository) { }

    async execute(id: string, dbOrTx?: DBContext): Promise<PurchaseReturn> {
        const item = await this.repository.findById(id, dbOrTx);
        if (!item) {
            throw new HTTPException(404, { message: "Return not found" });
        }
        return item;
    }
}
