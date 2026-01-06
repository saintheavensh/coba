import { db } from "../../db";
import { sales, saleItems, productBatches, products, activityLogs } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export class SalesRepository {
    async findAll() {
        return await db.query.sales.findMany({
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
            limit: 50
        });
    }

    // Creating sales involves complex transaction, logic moved to service.
}
