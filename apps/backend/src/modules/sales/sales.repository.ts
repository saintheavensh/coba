import { db } from "../../db";
import { sales, saleItems, productBatches, products, activityLogs } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export class SalesRepository {
    async findAll(params: { startDate?: Date; endDate?: Date; search?: string; limit?: number } = {}) {
        const { startDate, endDate, search, limit = 50 } = params;

        return await db.query.sales.findMany({
            where: (sales, { and, gte, lte, or, like }) => {
                const conditions = [];

                if (startDate) conditions.push(gte(sales.createdAt, startDate));
                if (endDate) conditions.push(lte(sales.createdAt, endDate));

                // For search, we might need a more complex query if searching by member name, 
                // but Drizzle's query builder simple join filter is tricky. 
                // For now, let's filter by Invoice ID or Customer Name (if stored directly, but it's in relation).
                // Simplest is filtering by ID or customerName (which we added to sales table? Check schema).
                // Checking schema... sales has customerName.
                if (search) {
                    conditions.push(or(
                        like(sales.id, `%${search}%`),
                        like(sales.customerName, `%${search}%`)
                    ));
                }

                return and(...conditions);
            },
            orderBy: [desc(sales.createdAt)],
            with: {
                user: true,
                member: true,
                items: {
                    with: {
                        product: true
                    }
                }
            },
            limit: limit
        });
    }

    async findById(id: string) {
        return await db.query.sales.findFirst({
            where: eq(sales.id, id),
            with: {
                user: true,
                member: true,
                items: {
                    with: {
                        product: true
                    }
                },
                payments: true
            }
        });
    }
}
