import { db } from "../../../../db";
import { stockOpnameItems, stockOpnameSessions, products, users } from "../../../../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";


export class GetStockAdjustmentsUseCase {
    constructor() { }

    async execute() {
        // We join opname items with sessions and products to get full info
        const adjustments = await db
            .select({
                id: stockOpnameItems.id,
                completedAt: stockOpnameSessions.completedAt,
                productName: products.name,
                variantName: stockOpnameItems.variantName,
                systemStock: stockOpnameItems.systemStock,
                physicalStock: stockOpnameItems.physicalStock,
                difference: sql<number>`${stockOpnameItems.physicalStock} - ${stockOpnameItems.systemStock}`,
                userName: users.name,
                reason: stockOpnameSessions.notes
            })
            .from(stockOpnameItems)
            .innerJoin(stockOpnameSessions, eq(stockOpnameItems.sessionId, stockOpnameSessions.id))
            .innerJoin(products, eq(stockOpnameItems.productId, products.id))
            .innerJoin(users, eq(stockOpnameSessions.userId, users.id))
            .where(and(
                eq(stockOpnameSessions.status, "completed"),
                sql`${stockOpnameItems.physicalStock} != ${stockOpnameItems.systemStock}`
            ))
            .orderBy(desc(stockOpnameSessions.completedAt));

        return adjustments;
    }
}
