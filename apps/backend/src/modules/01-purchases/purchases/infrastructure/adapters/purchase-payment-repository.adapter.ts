import { db } from "../../../../../shared/infrastructure/database/client";
import { purchasePayments } from "../../../../../shared/infrastructure/database/schema";
import { eq } from "drizzle-orm";
import { IPurchasePaymentRepository } from "../../domain/purchase-repository.port";

export class PurchasePaymentRepositoryAdapter implements IPurchasePaymentRepository {
    async savePayment(payment: any, dbOrTx?: any): Promise<void> {
        const client = dbOrTx || db;
        await client.insert(purchasePayments).values({
            ...payment,
            id: payment.id || crypto.randomUUID()
        });
    }

    async findPaymentsByPurchaseId(purchaseId: string): Promise<any[]> {
        return await db.query.purchasePayments.findMany({
            where: eq(purchasePayments.purchaseId, purchaseId)
        });
    }
}
