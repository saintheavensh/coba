import { db } from "../../../../db";
import { sales, services, purchases, users, activityLogs, productBatches, salePayments } from "../../../../db/schema";
import { and, desc, eq, lte } from "drizzle-orm";
import { DBContext } from "../../../../shared/types/db-context";
import { IReportRepository } from "../../domain";
import {
    SaleReportDTO,
    PurchaseReportDTO,
    InventoryReportDTO,
    ReportServiceDTO,
    ReportServiceWithTechnicianDTO,
    ReportTechnicianDTO,
    ReportActivityLogDTO,
    ReportOperationalCostDTO,
    ReportLowStockDTO,
    ReportSalePaymentDTO
} from "../../../../shared/dtos/repositories/reports";

function mapToSaleReportDTO(row: any): SaleReportDTO {
    return {
        id: row.id,
        memberId: row.memberId,
        customerName: row.customerName,
        totalAmount: Number(row.totalAmount),
        discountAmount: row.discountAmount ? Number(row.discountAmount) : null,
        paymentMethod: row.paymentMethod,
        paymentStatus: row.paymentStatus,
        userId: row.userId,
        notes: row.notes,
        createdAt: row.createdAt,
        items: (row.items || []).map((item: any) => ({
            id: item.id,
            productId: item.productId,
            batchId: item.batchId,
            variant: item.variant,
            qty: item.qty,
            price: Number(item.price),
            batch: {
                id: item.batch?.id,
                currentStock: item.batch?.currentStock,
                buyPrice: Number(item.batch?.buyPrice),
                expiredAt: item.batch?.expiredAt
            }
        }))
    };
}

function mapToReportServiceDTO(row: any): ReportServiceDTO {
    return {
        id: row.id,
        no: row.no,
        customerName: row.customer?.name || "Unknown",
        customerPhone: row.customer?.phone || null,
        deviceName: `${row.device?.brand || ""} ${row.device?.model || ""}`.trim(),
        status: row.status,
        problems: row.complaint,
        dateIn: row.dateIn,
        dateOut: row.dateOut,
        estimatedCompletionDate: row.estimatedCompletionDate,
        totalCost: Number(row.costEstimate || 0),
        actualCost: row.actualCost ? Number(row.actualCost) : null,
        technicianId: row.technicianId,
        parts: row.parts,
        notes: row.notes
    };
}

function mapToPurchaseReportDTO(row: any): PurchaseReportDTO {
    return {
        id: row.id,
        supplierId: row.supplierId,
        userId: row.userId,
        totalAmount: Number(row.totalAmount),
        status: row.status,
        date: row.date,
        supplier: {
            id: row.supplier?.id || row.supplierId,
            name: row.supplier?.name || "Unknown"
        },
        items: (row.items || []).map((item: any) => ({
            id: item.id,
            productId: item.productId,
            qtyOrdered: item.qtyOrdered,
            qtyReceived: item.qtyReceived,
            buyPrice: Number(item.buyPrice)
        }))
    };
}

function mapToReportTechnicianDTO(row: any): ReportTechnicianDTO {
    return {
        id: row.id,
        name: row.name,
        role: row.role,
        image: row.image
    };
}

function mapToReportActivityLogDTO(row: any): ReportActivityLogDTO {
    return {
        id: row.id,
        userId: row.userId,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        description: row.description,
        createdAt: row.createdAt,
        user: row.user ? {
            id: row.user.id,
            name: row.user.name
        } : null
    };
}

function mapToReportOperationalCostDTO(row: any): ReportOperationalCostDTO {
    return {
        id: row.id,
        category: row.category,
        amount: Number(row.amount),
        date: row.date,
        description: row.description,
        status: row.status
    };
}

function mapToInventoryReportDTO(row: any): InventoryReportDTO {
    return {
        id: row.id,
        name: row.name,
        products: (row.products || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            batches: (p.batches || []).map((b: any) => ({
                id: b.id,
                currentStock: b.currentStock,
                buyPrice: Number(b.buyPrice),
                sellPrice: Number(b.sellPrice || 0)
            }))
        }))
    };
}

function mapToReportLowStockDTO(row: any): ReportLowStockDTO {
    return {
        id: row.id,
        currentStock: row.currentStock,
        variantLink: row.variantLink ? {
            id: row.variantLink.id,
            product: {
                id: row.variantLink.product?.id,
                name: row.variantLink.product?.name
            }
        } : null
    };
}

function mapToReportSalePaymentDTO(row: any): ReportSalePaymentDTO {
    return {
        id: row.id,
        saleId: row.saleId,
        amount: Number(row.amount),
        method: row.method,
        reference: row.reference,
        createdAt: row.createdAt
    };
}

export class ReportRepositoryAdapter implements IReportRepository {
    async getSalesData(conditions: any[], dbOrTx?: DBContext): Promise<SaleReportDTO[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.query.sales.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                items: {
                    with: {
                        batch: true
                    }
                }
            }
        });
        return results.map(mapToSaleReportDTO);
    }

    async getTransactions(conditions: any[], dbOrTx?: DBContext): Promise<SaleReportDTO[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.query.sales.findMany({
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
        return results.map(mapToSaleReportDTO);
    }

    async getServices(conditions: any[], dbOrTx?: DBContext): Promise<ReportServiceDTO[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.query.services.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined
        });
        return results.map(mapToReportServiceDTO);
    }

    async getServiceTransactions(conditions: any[], dbOrTx?: DBContext): Promise<ReportServiceDTO[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.query.services.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy: [desc(services.dateIn)]
        });
        return results.map(mapToReportServiceDTO);
    }

    async getPurchases(conditions: any[], dbOrTx?: DBContext): Promise<PurchaseReportDTO[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.query.purchases.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                items: true,
                supplier: true
            },
            orderBy: [desc(purchases.date)]
        });
        return results.map(mapToPurchaseReportDTO);
    }

    async getTechnicians(dbOrTx?: DBContext): Promise<ReportTechnicianDTO[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.query.users.findMany({
            where: eq(users.role, "teknisi")
        });
        return results.map(mapToReportTechnicianDTO);
    }

    async getServicesWithTechnicians(conditions: any[], dbOrTx?: DBContext): Promise<ReportServiceWithTechnicianDTO[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.query.services.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                technician: true
            }
        });
        return results.map((r: any) => ({
            ...mapToReportServiceDTO(r),
            technician: r.technician ? mapToReportTechnicianDTO(r.technician) : null
        })) as ReportServiceWithTechnicianDTO[];
    }

    async getActivityLogs(conditions: any[], limit: number = 100, dbOrTx?: DBContext): Promise<ReportActivityLogDTO[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.query.activityLogs.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                user: true
            },
            orderBy: [desc(activityLogs.createdAt)],
            limit
        });
        return results.map(mapToReportActivityLogDTO);
    }

    async getOperationalCosts(conditions: any[], dbOrTx?: DBContext): Promise<ReportOperationalCostDTO[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.query.operationalCosts.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined
        });
        return results.map(mapToReportOperationalCostDTO);
    }

    async getCategoriesWithStock(dbOrTx?: DBContext): Promise<InventoryReportDTO[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.query.categories.findMany({
            with: {
                products: {
                    with: {
                        batches: true
                    }
                }
            }
        });
        return results.map(mapToInventoryReportDTO);
    }

    async getLowStockItems(threshold: number, dbOrTx?: DBContext): Promise<ReportLowStockDTO[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.query.productBatches.findMany({
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
        return results.map(mapToReportLowStockDTO);
    }

    async getSalesPayments(conditions: any[], dbOrTx?: DBContext): Promise<ReportSalePaymentDTO[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.select()
            .from(salePayments)
            .where(conditions.length > 0 ? and(...conditions) : undefined);

        return results.map((r: any) => mapToReportSalePaymentDTO(r));
    }
}
