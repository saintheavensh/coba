import { DBContext } from "../../../../shared/types/db-context";
import { IReportRepository } from "../../domain";

export class GetLowStockReportUseCase {
    constructor(private readonly repository: IReportRepository) { }

    async execute(threshold: number = 5, dbOrTx?: DBContext) {
        return await this.repository.getLowStockItems(threshold, dbOrTx);
    }
}
