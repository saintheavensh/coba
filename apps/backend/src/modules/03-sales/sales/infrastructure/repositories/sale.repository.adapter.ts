import { eq, desc, asc } from "drizzle-orm";
import { DBContext } from "../../../../../shared/types/db-context";
import { db } from "../../../../../shared/infrastructure/database/client";
import { sales, saleItems, salePayments } from "../../../../../shared/infrastructure/database/schema";
import { ISaleRepository, Sale } from "../../domain";

export class SaleRepositoryAdapter implements ISaleRepository {
    async findAll(params: { startDate?: Date; endDate?: Date; search?: string; limit?: number }, dbOrTx?: DBContext): Promise<Sale[]> {
        const client = (dbOrTx as any) || db;
        const { startDate, endDate, search, limit = 50 } = params;

        const results = await client.query.sales.findMany({
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

        return results.map((sale: any) => ({
            ...sale,
            finalAmount: sale.totalAmount - (sale.discountAmount || 0),
            items: sale.items.map((item: any) => ({
                ...item,
                subtotal: item.qty * item.price
            }))
        })) as Sale[];
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<Sale | null> {
        const client = (dbOrTx as any) || db;
        const sale = await client.query.sales.findFirst({
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
        } as Sale;
    }

    async create(sale: any, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.insert(sales).values(sale);
    }

    async createItem(item: any, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.insert(saleItems).values(item);
    }

    async createPayment(payment: any, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.insert(salePayments).values(payment);
    }
}
