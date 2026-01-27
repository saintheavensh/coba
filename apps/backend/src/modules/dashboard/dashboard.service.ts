
import { ReportsService } from "../reports/reports.service";
import { db } from "../../db";
import { activityLogs, saleItems, products, sales, services, users } from "../../db/schema";
import { desc, eq, sql, and, gte, lte } from "drizzle-orm";

export class DashboardService {
    private reports: ReportsService;

    constructor() {
        this.reports = new ReportsService();
    }

    async getDashboardData() {
        // Time Ranges
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 86400000 - 1);

        // 1. Cards Data
        // Revenue Today
        const salesStats = await this.reports.getSalesSummary({
            startDate: startOfDay.toISOString(),
            endDate: endOfDay.toISOString()
        });
        const serviceStats = await this.reports.getServiceStats({
            startDate: startOfDay.toISOString(),
            endDate: endOfDay.toISOString()
        });

        const totalRevenueToday = salesStats.totalRevenue + serviceStats.revenue; // Assuming serviceStats.revenue is actualCost paid today?

        // Active Services (All time - Status not completed/cancelled)
        const activeServices = await db.select({ count: sql<number>`count(*)` })
            .from(services)
            .where(
                and(
                    sql`${services.status} NOT IN ('selesai', 'diambil', 'batal')`
                )
            );

        // Ready for Pickup
        const readyServices = await db.select({ count: sql<number>`count(*)` })
            .from(services)
            .where(eq(services.status, 'selesai'));

        // Low Stock (Stock <= MinStock)
        const lowStock = await db.select({ count: sql<number>`count(*)` })
            .from(products)
            .where(sql`${products.stock} <= ${products.minStock}`);

        // 2. Charts Data
        // Top 10 Best Selling Items (All time or last 30 days? Let's say All time for now, or maybe last 30 days for relevance)
        // using simple aggregation
        const topProducts = await db.select({
            id: products.id,
            name: products.name,
            sold: sql<number>`sum(${saleItems.qty})`
        })
            .from(saleItems)
            .leftJoin(products, eq(saleItems.productId, products.id))
            .groupBy(products.id)
            .orderBy(desc(sql`sum(${saleItems.qty})`))
            .limit(10);

        // Revenue Trend (Last 7 Days)
        const revenueTrend = await this.getRevenueTrend7Days();

        // Slow Moving: Products with Stock > 0 AND (No sales in 30 days OR Created > 30 days ago and 0 sales)
        // For simplicity: High stock, created long ago, low sales. 
        // Let's just pick items with stock > 0 and no sales in last 30 days.
        // Or just return simple low stock items list for now if "Slow Moving" is complex to query efficiently without subqueries.
        // Let's implement Top Products first. 

        return {
            cards: {
                revenueToday: totalRevenueToday,
                activeServices: activeServices[0].count,
                readyPickup: readyServices[0].count,
                lowStock: lowStock[0].count
            },
            charts: {
                revenueTrend,
                topProducts: topProducts.map(p => ({ name: p.name, value: p.sold }))
            }
        };
    }

    async getRevenueTrend7Days() {
        const result = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const startStr = d.toISOString().slice(0, 10);

            // Re-using reports might be heavy if we call it 7 times in loop sequentially.
            // But it's simple to implement. 
            const sStart = new Date(d.setHours(0, 0, 0, 0)).toISOString();
            const sEnd = new Date(d.setHours(23, 59, 59, 999)).toISOString();

            const pSales = await this.reports.getSalesSummary({ startDate: sStart, endDate: sEnd });
            const pService = await this.reports.getServiceStats({ startDate: sStart, endDate: sEnd });

            result.push({
                date: startStr,
                revenue: pSales.totalRevenue + pService.revenue
            });
        }
        return result;
    }

    async getRecentActivities(limit = 10) {
        // Fetch logs
        // We might want to join with User to get names if 'userId' is just an ID.
        // Assuming activityLogs has userId. 
        // We can use the existing 'users' schema.

        /* 
           Schema Reminder:
           activityLogs: id, userId, action, entityType, entityId, description, createdAt
        */

        // Join with Users to get name
        // (Assuming you have users table imported)
        // Need to import 'users' from schema if not present. Added in import.

        return await db.select({
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

    async getRecentServices(limit = 5) {
        return await db.query.services.findMany({
            orderBy: [desc(services.dateIn)],
            limit: limit,
            with: {
                // customer and device are JSON columns, no relation
            }
        });
    }

    // Urgent services (e.g. deadline passed or today)
    async getUrgentServices(limit = 5) {
        // Service with status != completed/cancelled AND estimatedCompletionDate <= Now + 1 day?
        // Or just estimatedCompletionDate is not null and not done.
        const now = new Date();
        return await db.query.services.findMany({
            where: and(
                sql`${services.status} NOT IN ('selesai', 'diambil', 'batal')`,
                sql`${services.estimatedCompletionDate} IS NOT NULL`
            ),
            orderBy: [sql`${services.estimatedCompletionDate} ASC`], // Oldest deadline first
            limit: limit
        });
    }

    // Technician Dashboard
    async getTechnicianDashboard(technicianId: string) {
        // My assigned jobs
        const myJobs = await db.query.services.findMany({
            where: and(
                eq(services.technicianId, technicianId),
                sql`${services.status} NOT IN ('selesai', 'diambil', 'batal')`
            ),
            orderBy: [desc(services.dateIn)]
        });

        // Queue (unassigned antrian)
        const queue = await db.query.services.findMany({
            where: and(
                eq(services.status, 'antrian'),
                sql`${services.technicianId} IS NULL`
            ),
            orderBy: [desc(services.dateIn)],
            limit: 10
        });

        // Stats
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const completedToday = await db.select({ count: sql<number>`count(*)` })
            .from(services)
            .where(and(
                eq(services.technicianId, technicianId),
                eq(services.status, 'selesai'),
                gte(services.dateOut, startOfDay)
            ));

        const inProgress = await db.select({ count: sql<number>`count(*)` })
            .from(services)
            .where(and(
                eq(services.technicianId, technicianId),
                sql`${services.status} IN ('dicek', 'dikerjakan', 're-konfirmasi')`
            ));

        return {
            myJobs,
            queue,
            stats: {
                completedToday: completedToday[0]?.count || 0,
                inProgress: inProgress[0]?.count || 0,
                totalQueue: queue.length
            }
        };
    }

    // Cashier Dashboard
    async getCashierDashboard() {
        // Ready for pickup (selesai)
        const readyPickup = await db.query.services.findMany({
            where: eq(services.status, 'selesai'),
            orderBy: [desc(services.dateIn)],
            limit: 20
        });

        // Today's pickups
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const pickedUpToday = await db.select({ count: sql<number>`count(*)` })
            .from(services)
            .where(and(
                eq(services.status, 'diambil'),
                gte(services.dateOut, startOfDay)
            ));

        // Today's revenue from services
        const revenueToday = await db.select({
            total: sql<number>`COALESCE(SUM(${services.actualCost}), 0)`
        })
            .from(services)
            .where(and(
                eq(services.status, 'diambil'),
                gte(services.dateOut, startOfDay)
            ));

        // Pending confirmation
        const pendingConfirm = await db.select({ count: sql<number>`count(*)` })
            .from(services)
            .where(sql`${services.status} IN ('konfirmasi', 're-konfirmasi')`);

        return {
            readyPickup,
            stats: {
                readyCount: readyPickup.length,
                pickedUpToday: pickedUpToday[0]?.count || 0,
                revenueToday: revenueToday[0]?.total || 0,
                pendingConfirm: pendingConfirm[0]?.count || 0
            }
        };
    }

    async getProfitAndLoss(startDate?: string, endDate?: string) {
        return await this.reports.getProfitAndLoss({ startDate, endDate });
    }
}
