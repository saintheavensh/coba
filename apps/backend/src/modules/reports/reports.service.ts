import { db } from "../../db";
import { sales, saleItems, productBatches, services, purchases, users } from "../../db/schema";
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
        let completedCount = 0;

        for (const svc of servicesData) {
            const status = svc.status || 'antrian';
            statusCounts[status] = (statusCounts[status] || 0) + 1;

            if (svc.actualCost) {
                totalRevenue += svc.actualCost;
            }

            if (status === 'selesai' || status === 'diambil') {
                completedCount++;
            }
        }

        return {
            total: servicesData.length,
            completed: completedCount,
            byStatus: statusCounts,
            revenue: totalRevenue
        };
    }

    /**
     * Get service transactions list
     */
    async getServiceTransactions(filters: ReportFilters = {}): Promise<ServiceReport[]> {
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
                where: and(...conditions),
                orderBy: [desc(services.dateIn)]
            })
            : await db.query.services.findMany({
                orderBy: [desc(services.dateIn)]
            });

        return servicesData.map(svc => {
            const customer = svc.customer as { name?: string } | null;
            const device = svc.device as { brand?: string; model?: string } | null;

            return {
                id: svc.id,
                no: svc.no,
                date: svc.dateIn!,
                customerName: customer?.name || '-',
                deviceInfo: device ? `${device.brand || ''} ${device.model || ''}`.trim() : '-',
                status: svc.status || 'antrian',
                estimatedCost: svc.costEstimate || 0,
                actualCost: svc.actualCost || 0
            };
        });
    }

    /**
     * Get purchases summary
     */
    async getPurchasesSummary(filters: ReportFilters = {}): Promise<PurchasesSummary> {
        let conditions = [];

        if (filters.startDate) {
            const start = new Date(filters.startDate);
            conditions.push(gte(purchases.date, start));
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(purchases.date, end));
        }

        const purchasesData = conditions.length > 0
            ? await db.query.purchases.findMany({
                where: and(...conditions),
                with: {
                    items: true
                }
            })
            : await db.query.purchases.findMany({
                with: {
                    items: true
                }
            });

        let totalAmount = 0;
        let totalItems = 0;

        for (const purchase of purchasesData) {
            totalAmount += purchase.totalAmount;
            for (const item of (purchase.items || [])) {
                totalItems += item.qtyReceived;
            }
        }

        return {
            totalAmount,
            totalTransactions: purchasesData.length,
            totalItems
        };
    }

    /**
     * Get purchase transactions list
     */
    async getPurchaseTransactions(filters: ReportFilters = {}): Promise<PurchaseReport[]> {
        let conditions = [];

        if (filters.startDate) {
            const start = new Date(filters.startDate);
            conditions.push(gte(purchases.date, start));
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(purchases.date, end));
        }

        const purchasesData = conditions.length > 0
            ? await db.query.purchases.findMany({
                where: and(...conditions),
                orderBy: [desc(purchases.date)],
                with: {
                    supplier: true,
                    items: true
                }
            })
            : await db.query.purchases.findMany({
                orderBy: [desc(purchases.date)],
                with: {
                    supplier: true,
                    items: true
                }
            });

        return purchasesData.map(purchase => {
            let itemCount = 0;
            for (const item of (purchase.items || [])) {
                itemCount += item.qtyReceived;
            }

            return {
                id: purchase.id,
                date: purchase.date!,
                supplierId: purchase.supplierId,
                supplierName: purchase.supplier?.name || null,
                items: itemCount,
                totalAmount: purchase.totalAmount,
                notes: purchase.notes || null
            };
        });
    }

    /**
     * Get technician performance statistics
     */
    async getTechnicianStats(filters: ReportFilters = {}): Promise<TechnicianReport[]> {
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

        // Get all technicians (users with role teknisi)
        const technicians = await db.query.users.findMany({
            where: eq(users.role, "teknisi")
        });

        // Get all services in date range
        const servicesData = conditions.length > 0
            ? await db.query.services.findMany({
                where: and(...conditions),
                with: {
                    technician: true
                }
            })
            : await db.query.services.findMany({
                with: {
                    technician: true
                }
            });

        // Group services by technician
        const technicianMap: Map<string, {
            id: string;
            name: string;
            image: string | null;
            totalServices: number;
            completed: number;
            inProgress: number;
            cancelled: number;
            revenue: number;
        }> = new Map();

        // Initialize with all technicians (even those with 0 services)
        for (const tech of technicians) {
            technicianMap.set(tech.id, {
                id: tech.id,
                name: tech.name,
                image: tech.image || null,
                totalServices: 0,
                completed: 0,
                inProgress: 0,
                cancelled: 0,
                revenue: 0
            });
        }

        // Count services per technician
        for (const svc of servicesData) {
            if (!svc.technicianId) continue;

            let techData = technicianMap.get(svc.technicianId);
            if (!techData) {
                // Technician exists but not in teknisi role, or user was deleted
                const techUser = svc.technician;
                techData = {
                    id: svc.technicianId,
                    name: techUser?.name || 'Unknown',
                    image: techUser?.image || null,
                    totalServices: 0,
                    completed: 0,
                    inProgress: 0,
                    cancelled: 0,
                    revenue: 0
                };
                technicianMap.set(svc.technicianId, techData);
            }

            techData.totalServices++;

            if (svc.status === 'selesai' || svc.status === 'diambil') {
                techData.completed++;
                if (svc.actualCost) {
                    techData.revenue += svc.actualCost;
                }
            } else if (svc.status === 'batal') {
                techData.cancelled++;
            } else {
                techData.inProgress++;
            }
        }

        // Convert to array and calculate completion rate
        const result: TechnicianReport[] = [];
        for (const [, data] of technicianMap) {
            result.push({
                ...data,
                completionRate: data.totalServices > 0
                    ? Math.round((data.completed / data.totalServices) * 100)
                    : 0
            });
        }

        // Sort by total services descending
        result.sort((a, b) => b.totalServices - a.totalServices);

        return result;
    }

    /**
     * Get parts usage report
     */
    async getPartsUsageReport(filters: ReportFilters = {}): Promise<PartsUsageReport[]> {
        let conditions = [];

        // We only care about services that are completed/picked up OR have parts used
        // Usually parts are consumed when status is selesai/diambil, but we can list all usage.

        if (filters.startDate) {
            const start = new Date(filters.startDate);
            conditions.push(gte(services.dateIn, start));
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(services.dateIn, end));
        }

        // We need to fetch services and process the JSON parts
        // In SQL we could use jsonb_array_elements but Drizzle support is tricky.
        // We will fetch services and process in application layer.

        const servicesData = conditions.length > 0
            ? await db.query.services.findMany({
                where: and(...conditions),
                orderBy: [desc(services.dateIn)]
            })
            : await db.query.services.findMany({
                orderBy: [desc(services.dateIn)]
            });

        const report: PartsUsageReport[] = [];

        for (const svc of servicesData) {
            const parts = (svc.parts as any[]) || [];
            if (parts.length === 0) continue;

            for (const part of parts) {
                report.push({
                    serviceId: svc.id,
                    serviceNo: svc.no,
                    date: svc.dateOut || svc.dateIn || new Date(),
                    partName: part.name,
                    source: part.source,
                    qty: part.qty,
                    price: part.price,
                    subtotal: (part.subtotal || (part.price * part.qty)),
                    variant: part.variant
                });
            }
        }

        return report;
    }
}

export interface PartsUsageReport {
    serviceId: number;
    serviceNo: string;
    date: Date;
    partName: string;
    source: string;
    variant?: string;
    qty: number;
    price: number;
    subtotal: number;
}

// Additional interfaces
export interface PurchasesSummary {
    totalAmount: number;
    totalTransactions: number;
    totalItems: number;
}

export interface PurchaseReport {
    id: string;
    date: Date;
    supplierId: string;
    supplierName: string | null;
    items: number;
    totalAmount: number;
    notes: string | null;
}

export interface ServiceReport {
    id: number;
    no: string;
    date: Date;
    customerName: string;
    deviceInfo: string;
    status: string;
    estimatedCost: number;
    actualCost: number;
}

export interface TechnicianReport {
    id: string;
    name: string;
    image: string | null;
    totalServices: number;
    completed: number;
    inProgress: number;
    cancelled: number;
    revenue: number;
    completionRate: number;
}


