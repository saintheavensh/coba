import { eq, sql, desc, and } from "drizzle-orm";
import { db } from "../../../../../shared/infrastructure/database/client";
import {
    cashRegisters,
    cashRegisterTransactions,
    assets,
    assetDepreciationLogs,
    revenueTargets,
    purchasePayments,
    commissionPayments,
    purchases,
    suppliers
} from "../../../../../shared/infrastructure/database/schema";
import { DBContext } from "../../../../../shared/types/db-context";
import {
    ICashRegisterRepository,
    IAssetRepository,
    IRevenueTargetRepository,
    IPurchasePaymentRepository,
    ICommissionPaymentRepository,
    CashRegister,
    CashTransaction,
    FixedAsset,
    DepreciationEntry
} from "../../domain";

export class CashRegisterRepositoryAdapter implements ICashRegisterRepository {
    async getCurrent(dbOrTx?: DBContext): Promise<CashRegister | null> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.select().from(cashRegisters).where(eq(cashRegisters.status, "open")).limit(1);
        return (result as CashRegister) || null;
    }

    async getById(id: string, dbOrTx?: DBContext): Promise<CashRegister | null> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.select().from(cashRegisters).where(eq(cashRegisters.id, id));
        return (result as CashRegister) || null;
    }

    async create(data: Partial<CashRegister>, dbOrTx?: DBContext): Promise<{ id: string }> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.insert(cashRegisters).values(data).returning({ id: cashRegisters.id });
        return result;
    }

    async update(id: string, data: Partial<CashRegister>, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.update(cashRegisters).set(data).where(eq(cashRegisters.id, id));
    }

    async listHistory(limit: number, offset: number, dbOrTx?: DBContext): Promise<CashRegister[]> {
        const client = (dbOrTx as any) || db;
        return await client.select().from(cashRegisters).orderBy(desc(cashRegisters.openedAt)).limit(limit).offset(offset) as CashRegister[];
    }

    async createTransaction(data: Partial<CashTransaction>, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        // Map domain type to schema transactionType
        const { type, ...rest } = data as any;
        await client.insert(cashRegisterTransactions).values({
            ...rest,
            transactionType: type,
        });
    }

    async getTransactions(registerId: string, dbOrTx?: DBContext): Promise<CashTransaction[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.select().from(cashRegisterTransactions).where(eq(cashRegisterTransactions.registerId, registerId));
        return results.map((r: any) => ({ ...r, type: r.transactionType })) as CashTransaction[];
    }

    async getSummary(registerId: string, dbOrTx?: DBContext): Promise<any> {
        const transactions = await this.getTransactions(registerId, dbOrTx);
        const summary: any = {
            sale: { count: 0, total: 0 },
            service: { count: 0, total: 0 },
            expense: { count: 0, total: 0 },
            refund: { count: 0, total: 0 },
            adjustment: { count: 0, total: 0 },
        };

        for (const tx of transactions) {
            const type = tx.type as any;
            if (summary[type]) {
                summary[type].count++;
                summary[type].total += tx.amount;
            }
        }

        return {
            transactionCount: transactions.length,
            byType: summary,
            totalIn: transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
            totalOut: transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
        };
    }

    async getTodayProgress(dbOrTx?: DBContext): Promise<any> {
        const register = await this.getCurrent(dbOrTx);
        if (!register) {
            return { isOpen: false, progress: 0, totalSales: 0, totalServices: 0 };
        }

        const summary = await this.getSummary(register.id, dbOrTx);
        const client = (dbOrTx as any) || db;
        const recentTransactions = await client
            .select()
            .from(cashRegisterTransactions)
            .where(eq(cashRegisterTransactions.registerId, register.id))
            .orderBy(desc(cashRegisterTransactions.createdAt))
            .limit(10);

        return {
            isOpen: true,
            registerId: register.id,
            openingBalance: register.openingBalance,
            expectedClosing: register.expectedClosing,
            totalSales: summary.byType.sale.total,
            totalServices: summary.byType.service.total,
            totalExpenses: Math.abs(summary.byType.expense.total),
            transactionCount: summary.transactionCount,
            recentTransactions
        };
    }
}

export class AssetRepositoryAdapter implements IAssetRepository {
    async findAll(dbOrTx?: DBContext): Promise<FixedAsset[]> {
        const client = (dbOrTx as any) || db;
        return await client.select().from(assets) as FixedAsset[];
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<FixedAsset | null> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.select().from(assets).where(eq(assets.id, id));
        return (result as FixedAsset) || null;
    }

    async create(data: Partial<FixedAsset>, dbOrTx?: DBContext): Promise<{ id: string }> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.insert(assets).values(data).returning({ id: assets.id });
        return result;
    }

    async update(id: string, data: Partial<FixedAsset>, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.update(assets).set(data).where(eq(assets.id, id));
    }

    async delete(id: string, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.delete(assets).where(eq(assets.id, id));
    }

    async createDepreciation(data: Partial<DepreciationEntry>, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.insert(assetDepreciationLogs).values(data);
    }

    async getDepreciationHistory(assetId: string, dbOrTx?: DBContext): Promise<DepreciationEntry[]> {
        const client = (dbOrTx as any) || db;
        return await client.select().from(assetDepreciationLogs).where(eq(assetDepreciationLogs.assetId, assetId)) as DepreciationEntry[];
    }
}

export class RevenueTargetRepositoryAdapter implements IRevenueTargetRepository {
    async findByMonth(month: string, dbOrTx?: DBContext): Promise<any | null> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.select().from(revenueTargets).where(eq(revenueTargets.month, month));
        return result || null;
    }

    async upsert(month: string, data: any, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        const existing = await this.findByMonth(month, dbOrTx);
        if (existing) {
            await client.update(revenueTargets).set(data).where(eq(revenueTargets.month, month));
        } else {
            await client.insert(revenueTargets).values({ ...data, month });
        }
    }
}

export class PurchasePaymentRepositoryAdapter implements IPurchasePaymentRepository {
    async findById(id: string, dbOrTx?: DBContext): Promise<any | null> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.select().from(purchasePayments).where(eq(purchasePayments.id, id));
        return result || null;
    }

    async create(data: any, dbOrTx?: DBContext): Promise<{ id: string }> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.insert(purchasePayments).values(data).returning({ id: purchasePayments.id });
        return result;
    }

    async getTotalPaid(purchaseId: string, dbOrTx?: DBContext): Promise<number> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.select({
            total: sql<number>`sum(${purchasePayments.amount})`
        }).from(purchasePayments).where(eq(purchasePayments.purchaseId, purchaseId));
        return Number(result?.total) || 0;
    }

    async findHistoryByPurchaseId(purchaseId: string, dbOrTx?: DBContext): Promise<any[]> {
        const client = (dbOrTx as any) || db;
        return await client.select().from(purchasePayments).where(eq(purchasePayments.purchaseId, purchaseId)).orderBy(desc(purchasePayments.createdAt));
    }

    async findPurchaseById(id: string, dbOrTx?: DBContext): Promise<any | null> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.select().from(purchases).where(eq(purchases.id, id));
        return result || null;
    }
}

export class CommissionPaymentRepositoryAdapter implements ICommissionPaymentRepository {
    async create(data: any, dbOrTx?: DBContext): Promise<{ id: string }> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.insert(commissionPayments).values(data).returning({ id: commissionPayments.id });
        return result;
    }

    async findHistory(technicianId?: string, period?: string, dbOrTx?: DBContext): Promise<any[]> {
        const client = (dbOrTx as any) || db;
        const conditions = [];
        if (technicianId) conditions.push(eq(commissionPayments.technicianId, technicianId));
        if (period) conditions.push(eq(commissionPayments.period, period));

        const query = client.select().from(commissionPayments).orderBy(desc(commissionPayments.paidAt));
        if (conditions.length > 0) {
            return await query.where(and(...conditions));
        }
        return await query;
    }

    async getPaidServiceIds(period: string, dbOrTx?: DBContext): Promise<Set<string>> {
        const client = (dbOrTx as any) || db;
        const results = await client.select({ serviceIds: commissionPayments.serviceIds })
            .from(commissionPayments)
            .where(eq(commissionPayments.period, period));

        const paidServiceIds = new Set<string>();
        for (const row of results) {
            const ids = row.serviceIds as string[];
            if (ids) {
                ids.forEach(id => paidServiceIds.add(id));
            }
        }
        return paidServiceIds;
    }
}
