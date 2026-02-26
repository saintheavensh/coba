import { DBContext } from "../../../../shared/types/db-context";

export interface IServicePartRepository {
    findByServiceItemId(serviceItemId: string, dbOrTx?: DBContext): Promise<any[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<any | null>;
    create(data: { serviceItemId: string; variantBatchId?: string; quantity: number; purchasePrice?: number; sellingPrice: number; notes?: string }, dbOrTx?: DBContext): Promise<{ id: string }>;
    delete(id: string, dbOrTx?: DBContext): Promise<void>;
}
