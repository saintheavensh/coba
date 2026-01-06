import { db } from "../../db";
import { purchases, purchaseItems, productBatches, products, suppliers, activityLogs } from "../../db/schema";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";

export class PurchasesRepository {
    async findAll(filters?: {
        search?: string;
        startDate?: Date;
        endDate?: Date;
        userId?: string;
        limit?: number;
    }) {
        console.log("[DEBUG] Repo findAll Filters:", {
            start: filters?.startDate,
            end: filters?.endDate,
            userId: filters?.userId,
            startTime: filters?.startDate?.getTime(),
            endTime: filters?.endDate ? new Date(filters.endDate).getTime() : undefined,
            limit: filters?.limit
        });

        const conditions = [];

        if (filters?.startDate) {
            conditions.push(gte(purchases.date, filters.startDate));
        }
        if (filters?.endDate) {
            // Adjust to end of day
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(purchases.date, end));
        }

        if (filters?.userId) {
            conditions.push(eq(purchases.userId, filters.userId));
        }

        return await db.query.purchases.findMany({
            where: and(...conditions),
            orderBy: desc(purchases.date),
            limit: filters?.limit,
            with: {
                supplier: true,
                user: true,
                items: true
            }
        });
    }


    async findExistingBatch(productId: string, supplierId: string, buyPrice: number, variant?: string) {
        return await db.query.productBatches.findFirst({
            where: and(
                eq(productBatches.productId, productId),
                eq(productBatches.supplierId, supplierId),
                eq(productBatches.buyPrice, buyPrice),
                variant ? eq(productBatches.variant, variant) : sql`${productBatches.variant} IS NULL`
            )
        });
    }

    // Transaction Wrapper needs to be in Service for atomicity, 
    // but Repo can expose transactional helper or Service calls db.transaction directly.
    // Ideally Repository handles simple CRUD. Complex transactions usually sit in Service 
    // calling Repo methods, BUT Drizzle transaction needs the `tx` object passed around.
    // Pattern: Service starts transaction, passes `tx` to Repo methods.

    // For simplicity in this project (as `db` is global), 
    // I will implementation transaction in Service and use `tx` argument here?
    // OR just put the complex query logic in Repo and call it from Service.

    // Let's allow Service to direct DB transactions for multi-step ops.
    // Repo will expose standard methods.
}
