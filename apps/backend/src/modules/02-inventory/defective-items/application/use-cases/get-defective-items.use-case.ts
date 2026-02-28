import { DBContext } from "../../../../../shared/types/db-context";
import { IDefectiveItemRepository, DefectiveItem, DefectiveItemStatus } from "../../domain";

export class GetDefectiveItemsUseCase {
    constructor(private readonly repository: IDefectiveItemRepository) { }

    async execute(status: DefectiveItemStatus = "pending", dbOrTx?: DBContext): Promise<DefectiveItem[]> {
        return await this.repository.findAll(status, dbOrTx);
    }
}
