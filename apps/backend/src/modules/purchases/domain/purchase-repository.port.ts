import { PurchaseOrder } from "./entities/purchase.entity";

export interface IPurchaseRepository {
    findById(id: string): Promise<PurchaseOrder | null>;
    save(purchase: PurchaseOrder, dbOrTx?: unknown): Promise<void>;
    findAll(filters?: any): Promise<PurchaseOrder[]>;
    delete(id: string): Promise<void>;
}

export interface IPurchasePaymentRepository {
    savePayment(payment: any, dbOrTx?: unknown): Promise<void>;
    findPaymentsByPurchaseId(purchaseId: string): Promise<any[]>;
}
