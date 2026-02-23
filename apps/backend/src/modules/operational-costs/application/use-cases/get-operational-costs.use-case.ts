import { DBContext } from "../../../../shared/types/db-context";
import { IOperationalCostRepository, OperationalCost } from "../../domain";

export class GetOperationalCostsUseCase {
    constructor(private readonly repository: IOperationalCostRepository) { }

    async execute(limit: number = 100, dbOrTx?: DBContext): Promise<OperationalCost[]> {
        return await this.repository.findAll(limit, dbOrTx);
    }
}
