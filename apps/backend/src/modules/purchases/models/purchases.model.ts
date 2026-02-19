import { db } from "../../../db";
import { purchases, purchaseItems, productBatches, products, suppliers, activityLogs, purchasePayments } from "../../../db/schema";
import { eq, desc, and, between, sql, gte, lte } from "drizzle-orm";

import { Logger } from "../../../lib/logger";

export class PurchasesModel {
    async findAll(params: { startDate?: Date; endDate?: Date; search?: string; limit?: number; userId?: string; status?: string } = {}, dbOrTx: any = db) {
        const conditions = [];

        if (params.startDate && params.endDate) {
            conditions.push(between(purchases.date, params.startDate, params.endDate));
        }

        if (params.userId) {
            conditions.push(eq(purchases.userId, params.userId));
        }

        if (params.status) {
            conditions.push(eq(purchases.status, params.status as any));
        }

        if (params.search) {
            // Basic search logic if needed
        }

        const query = dbOrTx.query.purchases.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
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


    async getUnpaid(dbOrTx: any = db) {
        // Fetch all VERIFIED purchases with payments
        // We filter in-memory for simplicity given ORM complexity with HAVING + Relations
        const results = await dbOrTx.query.purchases.findMany({
            where: eq(purchases.status, "VERIFIED"),
            with: {
                supplier: true,
                payments: true // This requires 'payments' relation to be defined in schema relations
            },
            orderBy: [desc(purchases.date)]
        });

        // Calculate remaining debt
        return results.map((po: any) => {
            const paid = (po.payments || []).reduce((sum: number, p: any) => sum + p.amount, 0);
            return {
                ...po,
                paidAmount: paid,
                remainingAmount: po.totalAmount - paid
            };
        }).filter((po: any) => po.remainingAmount > 0);
    }
}
