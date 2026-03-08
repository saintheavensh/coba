import { eq, desc, and, sum } from "drizzle-orm";
import { db } from "../../../../db";
import {
    cashRegisters,
    cashRegisterTransactions,
    revenueTargets,
    purchasePayments,
    purchases,
    commissionPayments
} from "../../../../db/schema";
import { DBContext } from "../../../../shared/types/db-context";
import { CashRegister, CashTransaction } from "../../domain/entities/cash-register.entity";
import {
    ICashRegisterRepository,
    IRevenueTargetRepository,
    IPurchasePaymentRepository,
    ICommissionPaymentRepository
} from "../../domain";
import {
    RevenueTargetDTO,
    AccountingPurchasePaymentDTO,
    AccountingCommissionPaymentDTO
} from "../../../../shared/dtos/repositories/accounting";

function mapToRevenueTargetDTO(row: any): RevenueTargetDTO {
    return {
        id: row.id,
        month: row.month,
        workingDays: row.workingDays || 0,
        monthlyOperational: Number(row.monthlyOperational || 0),
        monthlyDepreciation: Number(row.monthlyDepreciation || 0),
        monthlyTotal: Number(row.monthlyTotal || 0),
        dailyBreakeven: Number(row.dailyBreakeven || 0),
        profitMarginPercent: Number(row.profitMarginPercent || 0),
        dailyTarget: Number(row.dailyTarget || 0),
        createdBy: row.createdBy,
        createdAt: row.createdAt
    };
}

function mapToAccountingPurchasePaymentDTO(row: any): AccountingPurchasePaymentDTO {
    return {
        id: row.id,
        purchaseId: row.purchaseId,
        amount: Number(row.amount),
        method: row.method,
        date: row.date,
        reference: row.reference,
        notes: row.notes,
        supplierId: row.supplierId,
        accountId: row.accountId,
        journalId: row.journalId,
        createdBy: row.createdBy
    };
}

function mapToAccountingCommissionPaymentDTO(row: any): AccountingCommissionPaymentDTO {
    return {
        id: row.id,
        technicianId: row.technicianId,
        period: row.period,
        amount: Number(row.amount),
        status: row.status,
        serviceIds: row.serviceIds,
        paidAt: row.paidAt,
        createdAt: row.createdAt,
        paidBy: row.paidBy,
        journalId: row.journalId,
        accountId: row.accountId
    };
}

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
            recentTransactions: recentTransactions
        };
    }
}

export class RevenueTargetRepositoryAdapter implements IRevenueTargetRepository {
    async findByMonth(month: string, dbOrTx?: DBContext): Promise<RevenueTargetDTO | null> {
        const client = (dbOrTx as any) || db;
        const result = await client.query.revenueTargets.findFirst({
            where: eq(revenueTargets.month, month)
        });
        return result ? mapToRevenueTargetDTO(result) : null;
    }

    async upsert(month: string, data: Partial<RevenueTargetDTO>, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        const existing = await this.findByMonth(month, dbOrTx);

        if (existing) {
            await client.update(revenueTargets)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(revenueTargets.month, month));
        } else {
            await client.insert(revenueTargets)
                .values({
                    ...data,
                    month,
                    createdAt: new Date()
                });
        }
    }
}

export class PurchasePaymentRepositoryAdapter implements IPurchasePaymentRepository {
    async findById(id: string, dbOrTx?: DBContext): Promise<AccountingPurchasePaymentDTO | null> {
        const client = (dbOrTx as any) || db;
        const result = await client.query.purchasePayments.findFirst({
            where: eq(purchasePayments.id, id)
        });
        return result ? mapToAccountingPurchasePaymentDTO(result) : null;
    }
    async create(data: Partial<AccountingPurchasePaymentDTO>, dbOrTx?: DBContext): Promise<{ id: string }> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.insert(purchasePayments).values(data).returning({ id: purchasePayments.id });
        return result;
    }

    async getTotalPaid(purchaseId: string, dbOrTx?: DBContext): Promise<number> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.select({ value: sum(purchasePayments.amount) })
            .from(purchasePayments)
            .where(eq(purchasePayments.purchaseId, purchaseId));
        return Number(result?.value || 0);
    }

    async findHistoryByPurchaseId(purchaseId: string, dbOrTx?: DBContext): Promise<AccountingPurchasePaymentDTO[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.query.purchasePayments.findMany({
            where: eq(purchasePayments.purchaseId, purchaseId),
            orderBy: [desc(purchasePayments.date)]
        });
        return results.map(mapToAccountingPurchasePaymentDTO);
    }

    async findPurchaseById(id: string, dbOrTx?: DBContext): Promise<any | null> {
        const client = (dbOrTx as any) || db;
        return await client.query.purchases.findFirst({
            where: eq(purchases.id, id)
        });
    }
}

export class CommissionPaymentRepositoryAdapter implements ICommissionPaymentRepository {
    async create(data: Partial<AccountingCommissionPaymentDTO>, dbOrTx?: DBContext): Promise<{ id: string }> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.insert(commissionPayments).values(data).returning({ id: commissionPayments.id });
        return result;
    }

    async findHistory(technicianId?: string, period?: string, dbOrTx?: DBContext): Promise<AccountingCommissionPaymentDTO[]> {
        const client = (dbOrTx as any) || db;
        let conditions = [];
        if (technicianId) conditions.push(eq(commissionPayments.technicianId, technicianId));
        if (period) conditions.push(eq(commissionPayments.period, period));

        const results = await client.query.commissionPayments.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy: [desc(commissionPayments.createdAt)]
        });
        return results.map(mapToAccountingCommissionPaymentDTO);
    }

    async getPaidServiceIds(period: string, dbOrTx?: DBContext): Promise<Set<string>> {
        const client = (dbOrTx as any) || db;
        const results = await client.query.commissionPayments.findMany({
            where: eq(commissionPayments.period, period)
        });

        const ids = new Set<string>();
        for (const r of results) {
            const serviceIds = (r.serviceIds as string[]) || [];
            serviceIds.forEach(id => ids.add(id));
        }
        return ids;
    }
}
