import { db } from "../../../../../shared/infrastructure/database/client";
import { sales, services, purchases, users, activityLogs, operationalCosts, categories, productBatches, salePayments, products, productVariants } from "../../../../../shared/infrastructure/database/schema";
import { and, desc, eq, lte } from "drizzle-orm";
import { DBContext } from "../../../../../shared/types/db-context";
import { IReportRepository } from "../../domain";

export class ReportRepositoryAdapter implements IReportRepository {
    async getSalesData(conditions: any[], dbOrTx?: DBContext): Promise<any[]> {
        const client = (dbOrTx as any) || db;
        return await client.query.sales.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                items: {
                    with: {
                        batch: true
                    }
                }
            }
        });
    }

    async getTransactions(conditions: any[], dbOrTx?: DBContext): Promise<any[]> {
        const client = (dbOrTx as any) || db;
        return await client.query.sales.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy: [desc(sales.createdAt)],
            with: {
                items: {
                    with: {
                        batch: true
                    }
                }
            }
        });
    }

    async getServices(conditions: any[], dbOrTx?: DBContext): Promise<any[]> {
        const client = (dbOrTx as any) || db;
        return await client.query.services.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined
        });
    }

    async getServiceTransactions(conditions: any[], dbOrTx?: DBContext): Promise<any[]> {
        const client = (dbOrTx as any) || db;
        return await client.query.services.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy: [desc(services.dateIn)]
        });
    }

    async getPurchases(conditions: any[], dbOrTx?: DBContext): Promise<any[]> {
        const client = (dbOrTx as any) || db;
        return await client.query.purchases.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                items: true,
                supplier: true
            },
            orderBy: [desc(purchases.date)]
        });
    }

    async getTechnicians(dbOrTx?: DBContext): Promise<any[]> {
        const client = (dbOrTx as any) || db;
        return await client.query.users.findMany({
            where: eq(users.role, "teknisi")
        });
    }

    async getServicesWithTechnicians(conditions: any[], dbOrTx?: DBContext): Promise<any[]> {
        const client = (dbOrTx as any) || db;
        return await client.query.services.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                technician: true
            }
        });
    }

    async getActivityLogs(conditions: any[], limit: number = 100, dbOrTx?: DBContext): Promise<any[]> {
        const client = (dbOrTx as any) || db;
        return await client.query.activityLogs.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                user: true
            },
            orderBy: [desc(activityLogs.createdAt)],
            limit
        });
    }

    async getOperationalCosts(conditions: any[], dbOrTx?: DBContext): Promise<any[]> {
        const client = (dbOrTx as any) || db;
        return await client.query.operationalCosts.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined
        });
    }

    async getCategoriesWithStock(dbOrTx?: DBContext): Promise<any[]> {
        const client = (dbOrTx as any) || db;
        return await client.query.categories.findMany({
            with: {
                products: {
                    with: {
                        batches: true
                    }
                }
            }
        });
    }
    async getLowStockItems(threshold: number, dbOrTx?: DBContext): Promise<any[]> {
        const client = (dbOrTx as any) || db;
        return await client.query.productBatches.findMany({
            where: lte(productBatches.currentStock, threshold),
            with: {
                variantLink: {
                    with: {
                        product: true
                    }
                }
            },
            orderBy: [desc(productBatches.currentStock)]
        });
    }

    async getSalesPayments(conditions: any[], dbOrTx?: DBContext): Promise<any[]> {
        const client = (dbOrTx as any) || db;
        // This is a bit tricky since salePayments refers to saleId.
        // If we have sales conditions, we might need to join or subquery.
        // For simple dates, we can often just query salePayments if they have createdAt.
        // But salePayments schema doesn't have createdAt? Let me check.

        // Joining sales and salePayments
        const results = await client.select()
            .from(salePayments)
            .innerJoin(sales, eq(sales.id, salePayments.saleId))
            .where(conditions.length > 0 ? and(...conditions) : undefined);

        // Return flattened salePayments
        return results.map((r: any) => r.sale_payments);
    }
}
