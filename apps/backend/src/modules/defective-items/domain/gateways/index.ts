import { DBContext } from "../../../../shared/types/db-context";

export interface IInventoryGateway {
    getBatch(batchId: string, dbOrTx?: DBContext): Promise<any>;
    reduceStock(batchId: string, qty: number, dbOrTx?: DBContext): Promise<void>;
}

export interface IPurchaseReturnGateway {
    createReturn(params: {
        supplierId: string;
        userId: string;
        items: Array<{
            productId: string;
            batchId: string;
            qty: number;
            reason: string;
        }>;
        notes?: string;
    }, dbOrTx?: DBContext): Promise<{ returnId: string }>;
}
