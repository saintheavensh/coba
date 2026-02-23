import { DBContext } from "../../../../shared/types/db-context";
import { PurchaseReturn, PurchaseReturnItem } from "../entities/purchase-return.entity";

export interface IPurchaseReturnRepository {
    findAll(dbOrTx?: DBContext): Promise<PurchaseReturn[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<PurchaseReturn | null>;
    create(data: Omit<PurchaseReturn, 'items' | 'createdAt'>, dbOrTx?: DBContext): Promise<PurchaseReturn>;
    createItems(items: Omit<PurchaseReturnItem, 'id' | 'createdAt'>[], dbOrTx?: DBContext): Promise<void>;
}
