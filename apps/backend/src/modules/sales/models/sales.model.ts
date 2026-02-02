import { db } from "../../../db";
import { sales, saleItems, salePayments } from "../../../db/schema";
import { eq, desc, and, between, sql } from "drizzle-orm";

export class SalesModel {
    async findAll(params: { startDate?: Date; endDate?: Date; search?: string; limit?: number } = {}, dbOrTx: any = db) {
        const { startDate, endDate, search, limit = 50 } = params;

        const results = await dbOrTx.query.sales.findMany({
            where: (sales: any, { and, gte, lte, or, like }: any) => {
                const conditions = [];

                if (startDate) conditions.push(gte(sales.createdAt, startDate));
                if (endDate) conditions.push(lte(sales.createdAt, endDate));

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

        // Map results to match shared Sale interface
        return results.map((sale: any) => ({
            ...sale,
            finalAmount: sale.totalAmount - (sale.discountAmount || 0),
            items: sale.items.map((item: any) => ({
                ...item,
                subtotal: item.qty * item.price
            }))
        }));
    }

    async findById(id: string, dbOrTx: any = db) {
        const sale = await dbOrTx.query.sales.findFirst({
            where: eq(sales.id, id),
            with: {
                user: true,
                member: true,
                items: {
                    with: {
                        product: true,
                        batch: true
                    }
                },
                payments: true
            }
        });

        if (!sale) return null;

        return {
            ...sale,
            finalAmount: sale.totalAmount - (sale.discountAmount || 0),
            items: sale.items.map((item: any) => ({
                ...item,
                subtotal: item.qty * item.price
            }))
        };
    }
}
