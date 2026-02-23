import { DBContext } from "../../../../shared/types/db-context";
import { ISaleRepository, Sale } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class GetSalesUseCase {
    constructor(private readonly repository: ISaleRepository) { }

    async execute(params: { startDate?: string; endDate?: string; search?: string; limit?: string }, dbOrTx?: DBContext): Promise<Sale[]> {
        const startDate = params.startDate ? new Date(params.startDate) : undefined;
        const endDate = params.endDate ? new Date(params.endDate + "T23:59:59") : undefined;
        const limit = params.limit ? parseInt(params.limit) : 50;

        return await this.repository.findAll({
            startDate,
            endDate,
            search: params.search,
            limit
        }, dbOrTx);
    }
}

export class GetSaleByIdUseCase {
    constructor(private readonly repository: ISaleRepository) { }

    async execute(id: string, dbOrTx?: DBContext): Promise<Sale> {
        const sale = await this.repository.findById(id, dbOrTx);
        if (!sale) {
            throw new HTTPException(404, { message: "Sale not found" });
        }
        return sale;
    }
}
