import { eq, desc } from "drizzle-orm";
import { db } from "../../db";
import { purchaseReturns, purchaseReturnItems } from "../../db/schema";

export class PurchaseReturnsRepository {
    async findAll() {
        return await db.query.purchaseReturns.findMany({
            with: {
                supplier: true,
                user: true,
                items: {
                    with: {
                        product: true,
                        batch: true
                    }
                }
            },
            orderBy: [desc(purchaseReturns.date)]
        });
    }

    async findById(id: string) {
        return await db.query.purchaseReturns.findFirst({
            where: eq(purchaseReturns.id, id),
            with: {
                supplier: true,
                user: true,
                items: {
                    with: {
                        product: {
                            with: {
                                category: true
                            }
                        },
                        batch: true
                    }
                }
            }
        });
    }

    async create(data: typeof purchaseReturns.$inferInsert) {
        return await db.insert(purchaseReturns).values(data).returning();
    }

    async createItems(data: typeof purchaseReturnItems.$inferInsert[]) {
        return await db.insert(purchaseReturnItems).values(data).returning();
    }
}
