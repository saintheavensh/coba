import { db } from "../../../db";
import { sales, saleItems, productBatches, services, purchases, users, activityLogs, operationalCosts } from "../../../db/schema";
import { sql, eq, gte, lte, and, desc } from "drizzle-orm";

export class ReportsModel {
    async getSalesData(conditions: any[], dbOrTx: any = db) {
        return await dbOrTx.query.sales.findMany({
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

    async getTransactions(conditions: any[], dbOrTx: any = db) {
        return await dbOrTx.query.sales.findMany({
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

    async getServices(conditions: any[], dbOrTx: any = db) {
        return await dbOrTx.query.services.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined
        });
    }

    async getServiceTransactions(conditions: any[], dbOrTx: any = db) {
        return await dbOrTx.query.services.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy: [desc(services.dateIn)]
        });
    }

    async getPurchases(conditions: any[], dbOrTx: any = db) {
        return await dbOrTx.query.purchases.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                items: true,
                supplier: true
            },
            orderBy: [desc(purchases.date)]
        });
    }

    async getTechnicians(dbOrTx: any = db) {
        return await dbOrTx.query.users.findMany({
            where: eq(users.role, "teknisi")
        });
    }

    async getServicesWithTechnicians(conditions: any[], dbOrTx: any = db) {
        return await dbOrTx.query.services.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                technician: true
            }
        });
    }

    async getActivityLogs(conditions: any[], limit: number = 100, dbOrTx: any = db) {
        return await dbOrTx.query.activityLogs.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                user: true
            },
            orderBy: [desc(activityLogs.createdAt)],
            limit
        });
    }

    async getOperationalCosts(conditions: any[], dbOrTx: any = db) {
        return await dbOrTx.query.operationalCosts.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined
        });
    }

    async getCategoriesWithStock(dbOrTx: any = db) {
        return await dbOrTx.query.categories.findMany({
            with: {
                products: {
                    with: {
                        batches: true
                    }
                }
            }
        });
    }
}
