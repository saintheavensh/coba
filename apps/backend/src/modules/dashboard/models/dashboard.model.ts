import { db } from "../../../db";
import { activityLogs, saleItems, products, services, users, purchases } from "../../../db/schema";
import { desc, eq, sql, and, gte, inArray } from "drizzle-orm";

export class DashboardModel {
    async getActiveServicesCount(dbOrTx: any = db) {
        const result = await dbOrTx.select({ count: sql<number>`count(*)` })
            .from(services)
            .where(sql`${services.status} NOT IN ('selesai', 'diambil', 'batal')`);
        return result[0].count;
    }

    async getReadyPickupCount(dbOrTx: any = db) {
        const result = await dbOrTx.select({ count: sql<number>`count(*)` })
            .from(services)
            .where(eq(services.status, 'selesai'));
        return result[0].count;
    }

    async getLowStockCount(dbOrTx: any = db) {
        const result = await dbOrTx.select({ count: sql<number>`count(*)` })
            .from(products)
            .where(sql`${products.stock} <= ${products.minStock}`);
        return result[0].count;
    }

    async getPendingVerificationsCount(dbOrTx: any = db) {
        const result = await dbOrTx.select({ count: sql<number>`count(*)` })
            .from(purchases)
            .where(eq(purchases.status, "RECEIVED"));
        return result[0].count;
    }

    async getTopProducts(limit = 10, dbOrTx: any = db) {
        return await dbOrTx.select({
            id: products.id,
            name: products.name,
            sold: sql<number>`sum(${saleItems.qty})`
        })
            .from(saleItems)
            .leftJoin(products, eq(saleItems.productId, products.id))
            .groupBy(products.id)
            .orderBy(desc(sql`sum(${saleItems.qty})`))
            .limit(limit);
    }

    async getRecentActivities(limit: number, dbOrTx: any = db) {
        return await dbOrTx.select({
            id: activityLogs.id,
            user: users.name,
            action: activityLogs.action,
            description: activityLogs.description,
            time: activityLogs.createdAt,
            entityType: activityLogs.entityType
        })
            .from(activityLogs)
            .leftJoin(users, eq(activityLogs.userId, users.id))
            .orderBy(desc(activityLogs.createdAt))
            .limit(limit);
    }

    async getRecentServices(limit: number, dbOrTx: any = db) {
        return await dbOrTx.query.services.findMany({
            orderBy: [desc(services.dateIn)],
            limit: limit
        });
    }

    async getUrgentServices(limit: number, dbOrTx: any = db) {
        return await dbOrTx.query.services.findMany({
            where: and(
                sql`${services.status} NOT IN ('selesai', 'diambil', 'batal')`,
                sql`${services.estimatedCompletionDate} IS NOT NULL`
            ),
            orderBy: [sql`${services.estimatedCompletionDate} ASC`],
            limit: limit
        });
    }

    async getTechnicianJobs(technicianId: string, dbOrTx: any = db) {
        return await dbOrTx.query.services.findMany({
            where: and(
                eq(services.technicianId, technicianId),
                sql`${services.status} NOT IN ('selesai', 'diambil', 'batal')`
            ),
            orderBy: [desc(services.dateIn)]
        });
    }

    async getTechnicianQueue(dbOrTx: any = db) {
        return await dbOrTx.query.services.findMany({
            where: and(
                eq(services.status, 'antrian'),
                sql`${services.technicianId} IS NULL`
            ),
            orderBy: [desc(services.dateIn)],
            limit: 10
        });
    }

    async getTechnicianStats(technicianId: string, startOfDay: Date, dbOrTx: any = db) {
        const completedToday = await dbOrTx.select({ count: sql<number>`count(*)` })
            .from(services)
            .where(and(
                eq(services.technicianId, technicianId),
                eq(services.status, 'selesai'),
                gte(services.dateOut, startOfDay)
            ));

        const inProgress = await dbOrTx.select({ count: sql<number>`count(*)` })
            .from(services)
            .where(and(
                eq(services.technicianId, technicianId),
                sql`${services.status} IN ('dicek', 'dikerjakan', 're-konfirmasi')`
            ));

        return {
            completedToday: completedToday[0]?.count || 0,
            inProgress: inProgress[0]?.count || 0
        };
    }

    async getCashierStats(startOfDay: Date, dbOrTx: any = db) {
        const readyPickup = await dbOrTx.query.services.findMany({
            where: eq(services.status, 'selesai'),
            orderBy: [desc(services.dateIn)],
            limit: 20
        });

        const pickedUpToday = await dbOrTx.select({ count: sql<number>`count(*)` })
            .from(services)
            .where(and(
                eq(services.status, 'diambil'),
                gte(services.dateOut, startOfDay)
            ));

        const revenueToday = await dbOrTx.select({
            total: sql<number>`COALESCE(SUM(${services.actualCost}), 0)`
        })
            .from(services)
            .where(and(
                eq(services.status, 'diambil'),
                gte(services.dateOut, startOfDay)
            ));

        const pendingConfirm = await dbOrTx.select({ count: sql<number>`count(*)` })
            .from(services)
            .where(sql`${services.status} IN ('konfirmasi', 're-konfirmasi')`);

        return {
            readyPickup,
            pickedUpToday: pickedUpToday[0]?.count || 0,
            revenueToday: revenueToday[0]?.total || 0,
            pendingConfirm: pendingConfirm[0]?.count || 0
        };
    }

    async getWarehouseStats(dbOrTx: any = db) {
        const totalProducts = await dbOrTx.select({ count: sql<number>`count(*)` }).from(products);
        const lowStock = await this.getLowStockCount(dbOrTx);

        const pendingPurchases = await dbOrTx.select({ count: sql<number>`count(*)` })
            .from(purchases)
            .where(eq(purchases.status, "ORDERED"));

        return {
            totalProducts: totalProducts[0]?.count || 0,
            lowStock: lowStock || 0,
            pendingPurchases: pendingPurchases[0]?.count || 0
        };
    }

    async getIncomingOrders(limit = 5, dbOrTx: any = db) {
        return await dbOrTx.query.purchases.findMany({
            where: eq(purchases.status, "ORDERED"),
            with: {
                supplier: true,
                user: true
            },
            orderBy: [desc(purchases.date)],
            limit
        });
    }

    async getLowStockProducts(limit = 10, dbOrTx: any = db) {
        return await dbOrTx.select()
            .from(products)
            .where(sql`${products.stock} <= ${products.minStock}`)
            .orderBy(products.stock)
            .limit(limit);
    }

    async getProcurementTasks(limit = 5, dbOrTx: any = db) {
        return await dbOrTx.query.purchases.findMany({
            where: inArray(purchases.status, ["ORDERED", "RECEIVED"]),
            with: {
                supplier: true,
                user: true
            },
            orderBy: [desc(purchases.date)],
            limit
        });
    }
}
