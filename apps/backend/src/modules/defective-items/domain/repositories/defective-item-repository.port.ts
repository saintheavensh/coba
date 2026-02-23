import { DBContext } from "../../../../shared/types/db-context";
import { DefectiveItem, DefectiveItemStatus } from "../entities/defective-item.entity";

export interface IDefectiveItemRepository {
    findAll(status?: DefectiveItemStatus, dbOrTx?: DBContext): Promise<DefectiveItem[]>;
    findByIds(ids: string[], dbOrTx?: DBContext): Promise<DefectiveItem[]>;
    create(data: any, dbOrTx?: DBContext): Promise<DefectiveItem>;
    updateStatus(ids: string[], status: DefectiveItemStatus, dbOrTx?: DBContext): Promise<void>;
}
