import { db } from "../../db";
import { accounts, accountTypes, journalLines, journals } from "../../db/schema";
import { eq, isNull, desc, sql, and } from "drizzle-orm";
import { AuditService } from "./audit.service";

export interface CreateAccountInput {
    code: string;
    name: string;
    typeId: string;
    parentId?: string;
    description?: string;
}

export interface UpdateAccountInput {
    name?: string;
    description?: string;
    isActive?: boolean;
}

export class AccountsService {
    /**
     * Get all account types
     */
    static async getAccountTypes() {
        return db.select().from(accountTypes).orderBy(accountTypes.id);
    }

    /**
     * Get all accounts (flat list)
     */
    static async getAll() {
        return db
            .select({
                id: accounts.id,
                code: accounts.code,
                name: accounts.name,
                typeId: accounts.typeId,
                typeName: accountTypes.name,
                parentId: accounts.parentId,
                description: accounts.description,
                isActive: accounts.isActive,
                balance: accounts.balance,
            })
            .from(accounts)
            .leftJoin(accountTypes, eq(accounts.typeId, accountTypes.id))
            .orderBy(accounts.code);
    }

    /**
     * Get accounts in tree structure
     */
    static async getTree() {
        const allAccounts = await this.getAll();

        // Build tree from flat list
        const accountMap = new Map<string, any>();
        const roots: any[] = [];

        // First pass: create map
        for (const account of allAccounts) {
            accountMap.set(account.id, { ...account, children: [] });
        }

        // Second pass: link children to parents
        for (const account of allAccounts) {
            const node = accountMap.get(account.id);
            if (account.parentId) {
                const parent = accountMap.get(account.parentId);
                if (parent) {
                    parent.children.push(node);
                }
            } else {
                roots.push(node);
            }
        }

        return roots;
    }

    /**
     * Get account by ID
     */
    static async getById(id: string) {
        const [account] = await db
            .select()
            .from(accounts)
            .where(eq(accounts.id, id));
        return account;
    }

    /**
     * Create a new account
     */
    static async create(input: CreateAccountInput, userId?: string): Promise<string> {
        // Validate account type
        const [type] = await db
            .select()
            .from(accountTypes)
            .where(eq(accountTypes.id, input.typeId));

        if (!type) {
            throw new Error(`Account type ${input.typeId} not found`);
        }

        // Generate ID based on type prefix
        const typePrefix = this.getTypePrefix(input.typeId);
        const id = `${typePrefix}-${input.code}`;

        await db.insert(accounts).values({
            id,
            code: input.code,
            name: input.name,
            typeId: input.typeId,
            parentId: input.parentId,
            description: input.description,
            balance: 0,
        });

        await AuditService.log({
            userId,
            action: "CREATE",
            entityType: "account",
            entityId: id,
            tableName: "accounts",
            newValues: { code: input.code, name: input.name, typeId: input.typeId },
        });

        return id;
    }

    /**
     * Update an account
     */
    static async update(id: string, input: UpdateAccountInput, userId?: string): Promise<void> {
        const oldAccount = await this.getById(id);
        if (!oldAccount) {
            throw new Error(`Account ${id} not found`);
        }

        await db
            .update(accounts)
            .set({
                ...input,
                updatedAt: new Date(),
            })
            .where(eq(accounts.id, id));

        await AuditService.log({
            userId,
            action: "UPDATE",
            entityType: "account",
            entityId: id,
            tableName: "accounts",
            oldValues: { name: oldAccount.name, description: oldAccount.description, isActive: oldAccount.isActive },
            newValues: input as Record<string, unknown>,
        });
    }

    /**
     * Get balance summary by account type
     */
    static async getBalanceSummary() {
        const allAccounts = await this.getAll();

        const summary: Record<string, { total: number; accounts: { name: string; balance: number }[] }> = {
            ASSET: { total: 0, accounts: [] },
            LIABILITY: { total: 0, accounts: [] },
            EQUITY: { total: 0, accounts: [] },
            REVENUE: { total: 0, accounts: [] },
            EXPENSE: { total: 0, accounts: [] },
        };

        for (const account of allAccounts) {
            if (account.typeId && summary[account.typeId]) {
                summary[account.typeId].total += account.balance || 0;
                if (account.balance !== 0) {
                    summary[account.typeId].accounts.push({
                        name: account.name,
                        balance: account.balance || 0,
                    });
                }
            }
        }

        return summary;
    }

    /**
     * Recalculate and sync balance for a specific account based on journal lines
     */
    static async recalculateBalance(accountId: string): Promise<number> {
        // Sum all debit and credit from posted journals for this account
        const result = await db
            .select({
                debit: sql<number>`COALESCE(SUM(debit), 0)`,
                credit: sql<number>`COALESCE(SUM(credit), 0)`,
            })
            .from(journalLines)
            .innerJoin(journals, eq(journalLines.journalId, journals.id))
            .where(
                and(
                    eq(journalLines.accountId, accountId),
                    eq(journals.status, "posted")
                )
            );

        const debit = Number(result[0]?.debit || 0);
        const credit = Number(result[0]?.credit || 0);

        // Calculate balance based on account type
        // ASSET, EXPENSE: Debit - Credit
        // LIABILITY, EQUITY, REVENUE: Credit - Debit
        const account = await this.getById(accountId);
        if (!account) return 0;

        let balance = 0;
        const typeId = account.typeId;

        if (typeId === "ASSET" || typeId === "EXPENSE") {
            balance = debit - credit;
        } else {
            balance = credit - debit;
        }

        await db
            .update(accounts)
            .set({ balance, updatedAt: new Date() })
            .where(eq(accounts.id, accountId));

        return balance;
    }

    /**
     * Sync all account balances
     */
    static async syncAllBalances(): Promise<void> {
        const allAccounts = await db.select().from(accounts);
        for (const account of allAccounts) {
            await this.recalculateBalance(account.id);
        }
    }

    /**
     * Recalculate balance for an account based on journal entries
     */
    static async recalculateBalance(accountId: string): Promise<number> {
        // Sum debits and credits from posted journals
        const result = await db
            .select({
                totalDebit: sql<number>`COALESCE(SUM(${journalLines.debit}), 0)`,
                totalCredit: sql<number>`COALESCE(SUM(${journalLines.credit}), 0)`,
            })
            .from(journalLines)
            .innerJoin(journals, eq(journalLines.journalId, journals.id))
            .where(
                and(
                    eq(journalLines.accountId, accountId),
                    eq(journals.status, "posted")
                )
            );

        const debit = Number(result[0]?.totalDebit || 0);
        const credit = Number(result[0]?.totalCredit || 0);

        const account = await this.getById(accountId);
        if (!account) return 0;

        // Calculate balance based on account type
        const isDebitNormal = account.typeId === "ASSET" || account.typeId === "EXPENSE";
        const balance = isDebitNormal ? (debit - credit) : (credit - debit);

        await db
            .update(accounts)
            .set({ balance, updatedAt: new Date() })
            .where(eq(accounts.id, accountId));

        return balance;
    }

    /**
     * Sync all account balances
     */
    static async syncAllBalances(): Promise<void> {
        const allAccounts = await this.getAll();
        for (const account of allAccounts) {
            await this.recalculateBalance(account.id);
        }
    }

    /**
     * Get type prefix for account ID generation
     */
    private static getTypePrefix(typeId: string): string {
        const prefixes: Record<string, string> = {
            ASSET: "1",
            LIABILITY: "2",
            EQUITY: "3",
            REVENUE: "4",
            EXPENSE: "5",
        };
        return prefixes[typeId] || "9";
    }
}
