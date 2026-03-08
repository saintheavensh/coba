import { db } from "../../../../db";
import { DBContext } from "../../../../shared/types/db-context";
import { purchasePayments } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { IPurchasePaymentRepository } from "../../domain/purchase-repository.port";

export class PurchasePaymentRepositoryAdapter implements IPurchasePaymentRepository {
    async savePayment(payment: any, dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || db;
        await client.insert(purchasePayments).values({
            ...payment,
            id: payment.id || crypto.randomUUID()
        });
    }

    async findPaymentsByPurchaseId(purchaseId: string, dbOrTx?: DBContext): Promise<any[]> {
        const client = dbOrTx || db;
        return await client.query.purchasePayments.findMany({
            where: eq(purchasePayments.purchaseId, purchaseId)
        });
    }
}
