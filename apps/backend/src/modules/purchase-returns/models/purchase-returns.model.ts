import { db } from "../../../db";
import { purchaseReturns, purchaseReturnItems } from "../../../db/schema";
import { eq, desc } from "drizzle-orm";

export class PurchaseReturnsModel {
    async findAll(dbOrTx: any = db) {
        return await dbOrTx.query.purchaseReturns.findMany({
            with: {
                supplier: true,
                user: true,
                items: {
                    with: {
                        product: true
                    }
                }
            },
            orderBy: [desc(purchaseReturns.date)]
        });
    }

    async findById(id: string, dbOrTx: any = db) {
        return await dbOrTx.query.purchaseReturns.findFirst({
            where: eq(purchaseReturns.id, id),
            with: {
                supplier: true,
                user: true,
                items: {
                    with: {
                        product: true,
                        batch: true
                    }
                }
            }
        });
    }

    async create(data: typeof purchaseReturns.$inferInsert, dbOrTx: any = db) {
        return await dbOrTx.insert(purchaseReturns).values(data).returning();
    }

    async createItems(items: (typeof purchaseReturnItems.$inferInsert)[], dbOrTx: any = db) {
        return await dbOrTx.insert(purchaseReturnItems).values(items).returning();
    }
}
