import { eq, and, sql, desc, gte, lte } from "drizzle-orm";
import { db } from "../../../../../shared/infrastructure/database/client";
import { accounts, journals, journalLines, accountTypes } from "../../../../../shared/infrastructure/database/schema";
import { DBContext } from "../../../../../shared/types/db-context";
import { IAccountRepository, IJournalRepository, Account, JournalEntry, JournalLine } from "../../domain";

export class AccountRepositoryAdapter implements IAccountRepository {
    async findAll(filters: { typeId?: string }, dbOrTx?: DBContext): Promise<Account[]> {
        const client = (dbOrTx as any) || db;
        const results = await client
            .select({
                id: accounts.id,
                code: accounts.code,
                name: accounts.name,
                typeId: accounts.typeId,
                parentId: accounts.parentId,
                description: accounts.description,
                isActive: accounts.isActive,
                isSystem: accounts.isSystem,
                balance: accounts.balance,
                createdAt: accounts.createdAt,
                updatedAt: accounts.updatedAt,
            })
            .from(accounts)
            .where(filters.typeId ? eq(accounts.typeId, filters.typeId) : undefined)
            .orderBy(accounts.code);

        return results as Account[];
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<Account | null> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.select().from(accounts).where(eq(accounts.id, id));
        return (result as Account) || null;
    }

    async findByCode(code: string, dbOrTx?: DBContext): Promise<Account | null> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.select().from(accounts).where(eq(accounts.code, code));
        return (result as Account) || null;
    }

    async findTypes(dbOrTx?: DBContext): Promise<any[]> {
        const client = (dbOrTx as any) || db;
        return await client.select().from(accountTypes).orderBy(accountTypes.id);
    }

    async findTypeById(id: string, dbOrTx?: DBContext): Promise<any | null> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.select().from(accountTypes).where(eq(accountTypes.id, id));
        return result || null;
    }

    async create(data: Partial<Account>, dbOrTx?: DBContext): Promise<{ id: string }> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.insert(accounts).values(data).returning({ id: accounts.id });
        return result;
    }

    async update(id: string, data: Partial<Account>, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.update(accounts).set(data).where(eq(accounts.id, id));
    }

    async delete(id: string, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.delete(accounts).where(eq(accounts.id, id));
    }
}

export class JournalRepositoryAdapter implements IJournalRepository {
    async findAll(filters: any, dbOrTx?: DBContext): Promise<JournalEntry[]> {
        const client = (dbOrTx as any) || db;
        let where = and();
        if (filters.startDate) where = and(where, gte(journals.date, new Date(filters.startDate)));
        if (filters.endDate) where = and(where, lte(journals.date, new Date(filters.endDate)));
        if (filters.status) where = and(where, eq(journals.status, filters.status));

        const results = await client
            .select()
            .from(journals)
            .where(where)
            .orderBy(desc(journals.date))
            .limit(filters.limit || 50)
            .offset(filters.offset || 0);

        return results as JournalEntry[];
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<JournalEntry | null> {
        const client = (dbOrTx as any) || db;
        const [journal] = await client.select().from(journals).where(eq(journals.id, id));
        if (!journal) return null;

        const lines = await client
            .select({
                id: journalLines.id,
                accountId: journalLines.accountId,
                debit: journalLines.debit,
                credit: journalLines.credit,
                description: journalLines.description,
            })
            .from(journalLines)
            .where(eq(journalLines.journalId, id));

        return { ...journal, lines } as JournalEntry;
    }

    async countToday(prefix: string, dbOrTx?: DBContext): Promise<number> {
        const client = (dbOrTx as any) || db;
        const result = await client
            .select({ count: sql<number>`count(*)` })
            .from(journals)
            .where(sql`${journals.id} LIKE ${prefix + '%'}`);
        return Number(result[0]?.count || 0);
    }

    async create(data: Partial<JournalEntry>, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.insert(journals).values(data);
    }

    async createLine(data: Partial<JournalLine>, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.insert(journalLines).values(data);
    }

    async update(id: string, data: Partial<JournalEntry>, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.update(journals).set(data).where(eq(journals.id, id));
    }

    async delete(id: string, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.delete(journals).where(eq(journals.id, id));
    }

    async deleteByReference(type: string, id: string, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.delete(journals).where(and(eq(journals.referenceType, type as any), eq(journals.referenceId, id)));
    }
}
