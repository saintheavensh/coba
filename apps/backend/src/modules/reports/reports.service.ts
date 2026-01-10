import { db } from "../../db";
import { sales, saleItems, productBatches, services } from "../../db/schema";
import { sql, eq, gte, lte, and, count, sum, desc } from "drizzle-orm";

export interface ReportFilters {
    startDate?: string;
    endDate?: string;
}

export interface SalesSummary {
    totalRevenue: number;
    totalHPP: number;
    totalProfit: number;
    totalTransactions: number;
    totalItems: number;
    profitMargin: number;
}

export interface TransactionReport {
    id: string;
    date: Date;
    nota: string;
    customerName: string | null;
    items: number;
    total: number;
    hpp: number;
    profit: number;
}

export class ReportsService {
    /**
     * Get sales summary with revenue, HPP, profit
     */
    async getSalesSummary(filters: ReportFilters = {}): Promise<SalesSummary> {
        let conditions = [];

        if (filters.startDate) {
            const start = new Date(filters.startDate);
            conditions.push(gte(sales.createdAt, start));
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(sales.createdAt, end));
        }

        // Get all sales in date range
        const salesData = conditions.length > 0
            ? await db.query.sales.findMany({
                where: and(...conditions),
                with: {
                    items: {
                        with: {
                            batch: true
                        }
                    }
                }
            })
            : await db.query.sales.findMany({
                with: {
                    items: {
                        with: {
                            batch: true
                        }
                    }
                }
            });

        let totalRevenue = 0;
        let totalHPP = 0;
        let totalItems = 0;

        for (const sale of salesData) {
            totalRevenue += sale.finalAmount;

            for (const item of (sale.items || [])) {
                totalItems += item.qty;
                // HPP = buyPrice * qty
                const buyPrice = (item as any).batch?.buyPrice || 0;
                totalHPP += buyPrice * item.qty;
            }
        }

        const totalProfit = totalRevenue - totalHPP;
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        return {
            totalRevenue,
            totalHPP,
            totalProfit,
            totalTransactions: salesData.length,
            totalItems,
            profitMargin: Math.round(profitMargin * 100) / 100
        };
    }

    /**
     * Get transaction list with profit details
     */
    async getTransactions(filters: ReportFilters = {}): Promise<TransactionReport[]> {
        let conditions = [];

        if (filters.startDate) {
            const start = new Date(filters.startDate);
            conditions.push(gte(sales.createdAt, start));
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(sales.createdAt, end));
        }

        const salesData = conditions.length > 0
            ? await db.query.sales.findMany({
                where: and(...conditions),
                orderBy: [desc(sales.createdAt)],
                with: {
                    items: {
                        with: {
                            batch: true
                        }
                    }
                }
            })
            : await db.query.sales.findMany({
                orderBy: [desc(sales.createdAt)],
                with: {
                    items: {
                        with: {
                            batch: true
                        }
                    }
                }
            });

        return salesData.map(sale => {
            let hpp = 0;
            let itemCount = 0;

            for (const item of (sale.items || [])) {
                itemCount += item.qty;
                const buyPrice = (item as any).batch?.buyPrice || 0;
                hpp += buyPrice * item.qty;
            }

            return {
                id: sale.id,
                date: sale.createdAt!,
                nota: sale.id,
                customerName: sale.customerName,
                items: itemCount,
                total: sale.finalAmount,
                hpp,
                profit: sale.finalAmount - hpp
            };
        });
    }

    /**
     * Get service statistics
     */
    async getServiceStats(filters: ReportFilters = {}) {
        let conditions = [];

        if (filters.startDate) {
            const start = new Date(filters.startDate);
            conditions.push(gte(services.dateIn, start));
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(services.dateIn, end));
        }

        const servicesData = conditions.length > 0
            ? await db.query.services.findMany({
                where: and(...conditions)
            })
            : await db.query.services.findMany();

        const statusCounts: Record<string, number> = {};
        let totalRevenue = 0;

        for (const svc of servicesData) {
            const status = svc.status || 'antrian';
            statusCounts[status] = (statusCounts[status] || 0) + 1;

            if (svc.actualCost) {
                totalRevenue += svc.actualCost;
            }
        }

        return {
            total: servicesData.length,
            byStatus: statusCounts,
            revenue: totalRevenue
        };
    }
}
