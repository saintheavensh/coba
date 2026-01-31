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

    /**
     * Seed standard Chart of Accounts for new installations
     * Used when enabling Professional Mode for the first time
     */
    static async seedStandardAccounts(userId?: string): Promise<{ created: number; skipped: boolean }> {
        // Check if accounts already exist
        const existing = await db.select({ count: sql<number>`count(*)` }).from(accounts);
        if (Number(existing[0]?.count || 0) > 0) {
            return { created: 0, skipped: true };
        }

        // Standard Chart of Accounts for Phone/Electronics Repair Shop
        const standardAccounts = [
            // ========== ASSETS (1-xxxx) ==========
            // Current Assets
            { code: "1001", name: "Kas Toko", typeId: "ASSET", description: "Kas tunai di toko" },
            { code: "1002", name: "Kas Kecil", typeId: "ASSET", description: "Petty cash untuk pengeluaran kecil" },
            { code: "1010", name: "Bank BCA", typeId: "ASSET", description: "Rekening bank BCA" },
            { code: "1011", name: "Bank Mandiri", typeId: "ASSET", description: "Rekening bank Mandiri" },
            { code: "1012", name: "Bank BRI", typeId: "ASSET", description: "Rekening bank BRI" },
            { code: "2000", name: "Piutang Usaha", typeId: "ASSET", description: "Piutang dari pelanggan" },
            { code: "2001", name: "Piutang Karyawan", typeId: "ASSET", description: "Piutang dipinjam karyawan" },
            { code: "3000", name: "Persediaan Barang", typeId: "ASSET", description: "Stok barang dagang" },
            { code: "3001", name: "Persediaan Sparepart", typeId: "ASSET", description: "Stok sparepart service" },
            // Fixed Assets
            { code: "4001", name: "Peralatan Kerja", typeId: "ASSET", description: "Peralatan servis (solder, multimeter, dll)" },
            { code: "4002", name: "Inventaris Toko", typeId: "ASSET", description: "Meja, kursi, etalase, dll" },
            { code: "4003", name: "Kendaraan", typeId: "ASSET", description: "Kendaraan operasional" },
            { code: "4004", name: "Bangunan", typeId: "ASSET", description: "Bangunan toko (jika milik sendiri)" },
            { code: "4005", name: "Tanah", typeId: "ASSET", description: "Tanah (tidak disusutkan)" },
            { code: "4090", name: "Aset Tetap Lainnya", typeId: "ASSET", description: "Aset tetap lainnya" },
            { code: "4099", name: "Akumulasi Penyusutan", typeId: "ASSET", description: "Akun kontra untuk penyusutan aset" },

            // ========== LIABILITIES (2-xxxx) ==========
            { code: "1000", name: "Hutang Usaha", typeId: "LIABILITY", description: "Hutang ke supplier" },
            { code: "1001", name: "Hutang Bank", typeId: "LIABILITY", description: "Pinjaman bank" },
            { code: "1002", name: "Hutang Karyawan", typeId: "LIABILITY", description: "Gaji/komisi yang belum dibayar" },
            { code: "2000", name: "Deposit Pelanggan", typeId: "LIABILITY", description: "Uang muka dari pelanggan" },

            // ========== EQUITY (3-xxxx) ==========
            { code: "1000", name: "Modal Pemilik", typeId: "EQUITY", description: "Modal awal pemilik" },
            { code: "2000", name: "Laba Ditahan", typeId: "EQUITY", description: "Laba tahun-tahun sebelumnya" },
            { code: "3000", name: "Prive/Pengambilan", typeId: "EQUITY", description: "Pengambilan pribadi pemilik" },

            // ========== REVENUE (4-xxxx) ==========
            { code: "1000", name: "Pendapatan Penjualan", typeId: "REVENUE", description: "Penjualan barang" },
            { code: "2000", name: "Pendapatan Service", typeId: "REVENUE", description: "Jasa perbaikan/servis" },
            { code: "3000", name: "Pendapatan Lainnya", typeId: "REVENUE", description: "Pendapatan diluar usaha utama" },
            { code: "4000", name: "Diskon Penjualan", typeId: "REVENUE", description: "Potongan harga ke pelanggan (pengurang)" },
            { code: "5000", name: "Retur Penjualan", typeId: "REVENUE", description: "Barang yang dikembalikan pelanggan" },

            // ========== EXPENSE (5-xxxx) ==========
            // Cost of Goods Sold
            { code: "1001", name: "HPP Penjualan", typeId: "EXPENSE", description: "Harga pokok barang terjual" },
            { code: "1002", name: "HPP Service", typeId: "EXPENSE", description: "Sparepart untuk service" },
            // Operating Expenses
            { code: "2000", name: "Beban Gaji", typeId: "EXPENSE", description: "Gaji karyawan" },
            { code: "2001", name: "Komisi Teknisi", typeId: "EXPENSE", description: "Komisi untuk teknisi" },
            { code: "2100", name: "Beban Sewa", typeId: "EXPENSE", description: "Sewa tempat usaha" },
            { code: "2200", name: "Beban Listrik", typeId: "EXPENSE", description: "Tagihan listrik" },
            { code: "2201", name: "Beban Air", typeId: "EXPENSE", description: "Tagihan air (PDAM)" },
            { code: "2202", name: "Beban Internet", typeId: "EXPENSE", description: "Tagihan internet/wifi" },
            { code: "2300", name: "Beban Perlengkapan", typeId: "EXPENSE", description: "ATK dan perlengkapan kantor" },
            { code: "2400", name: "Beban Transportasi", typeId: "EXPENSE", description: "Ongkos kirim, bensin, dll" },
            { code: "2500", name: "Beban Iklan", typeId: "EXPENSE", description: "Promosi dan marketing" },
            { code: "2600", name: "Beban Pemeliharaan", typeId: "EXPENSE", description: "Maintenance alat & gedung" },
            { code: "3000", name: "Beban Penyusutan", typeId: "EXPENSE", description: "Penyusutan aset tetap bulanan" },
            { code: "9000", name: "Beban Lain-lain", typeId: "EXPENSE", description: "Beban operasional lainnya" },
        ];

        let created = 0;
        for (const acc of standardAccounts) {
            try {
                await this.create(acc, userId);
                created++;
            } catch (e) {
                // Skip if already exists (edge case)
                console.warn(`Skipped account ${acc.code}: ${e}`);
            }
        }

        return { created, skipped: false };
    }
}
