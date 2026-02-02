import { db } from "../../../db";
import { purchases, purchaseItems, productBatches, products, suppliers, activityLogs } from "../../../db/schema";
import { eq, desc, and, between, sql, gte, lte } from "drizzle-orm";

import { Logger } from "../../../lib/logger";

export class PurchasesModel {
    async findAll(params: { startDate?: Date; endDate?: Date; search?: string; limit?: number; userId?: string } = {}, dbOrTx: any = db) {
        const conditions = [];

        if (params.startDate && params.endDate) {
            conditions.push(between(purchases.date, params.startDate, params.endDate));
        }

        if (params.userId) {
            conditions.push(eq(purchases.userId, params.userId));
        }

        if (params.search) {
            // Basic search logic if needed
        }

        const query = dbOrTx.query.purchases.findMany({
            where: and(...conditions),
            with: {
                supplier: true,
                items: {
                    with: {
                        product: true
                    }
                },
                user: true
            },
            orderBy: [desc(purchases.date)],
            limit: params.limit
        });

        return await query;
    }

    async findById(id: string, dbOrTx: any = db) {
        return await dbOrTx.query.purchases.findFirst({
            where: eq(purchases.id, id),
            with: {
                supplier: true,
                items: {
                    with: {
                        product: true
                    }
                },
                user: true
            }
        });
    }

    async getBatchByProductAndVariant(productId: string, variant: string, dbOrTx: any = db) {
        return await dbOrTx.query.productBatches.findFirst({
            where: and(
                eq(productBatches.productId, productId),
                eq(productBatches.variantId, variant)
            )
        });
    }
}
