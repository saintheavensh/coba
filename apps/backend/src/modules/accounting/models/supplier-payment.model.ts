import { db } from "../../../db";
import { purchasePayments, purchases, suppliers } from "../../../db/schema";
import { eq, desc, sql } from "drizzle-orm";

export class SupplierPaymentModel {
    static async create(data: any) {
        return db.insert(purchasePayments).values(data).returning();
    }

    static async getTotalPaid(purchaseId: string) {
        const result = await db
            .select({ total: sql<number>`COALESCE(SUM(${purchasePayments.amount}), 0)` })
            .from(purchasePayments)
            .where(eq(purchasePayments.purchaseId, purchaseId));
        return Number(result[0]?.total || 0);
    }

    static async findHistoryByPurchaseId(purchaseId: string) {
        return db
            .select()
            .from(purchasePayments)
            .where(eq(purchasePayments.purchaseId, purchaseId))
            .orderBy(desc(purchasePayments.date));
    }

    static async findAllPurchasesWithSuppliers() {
        return db
            .select({
                id: purchases.id,
                supplierId: purchases.supplierId,
                supplierName: suppliers.name,
                totalAmount: purchases.totalAmount,
                date: purchases.date,
            })
            .from(purchases)
            .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
            .orderBy(desc(purchases.date));
    }

    static async findPurchaseById(id: string) {
        const [purchase] = await db
            .select()
            .from(purchases)
            .where(eq(purchases.id, id));
        return purchase;
    }
}
