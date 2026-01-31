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
     * Reset all accounts (delete all) - used for Custom setup from scratch
     * WARNING: This will delete ALL accounts and related journal data.
     */
    static async resetAllAccounts(userId?: string): Promise<{ deleted: number }> {
        // Get count before delete
        const existing = await db.select({ count: sql<number>`count(*)` }).from(accounts);
        const count = Number(existing[0]?.count || 0);

        if (count === 0) {
            return { deleted: 0 };
        }

        // 1. Clear FK references in nullable columns
        await db.execute(sql`UPDATE assets SET account_id = NULL, depreciation_account_id = NULL`);
        await db.execute(sql`UPDATE purchase_payments SET account_id = NULL`);
        await db.execute(sql`UPDATE commission_payments SET account_id = NULL`);

        // 2. Delete journals (cascades to journal_lines)
        await db.execute(sql`DELETE FROM journals`);

        // 3. Delete all accounts
        await db.delete(accounts);

        // Log the action
        await AuditService.log({
            userId,
            action: "DELETE",
            entityType: "account",
            entityId: "ALL",
            tableName: "accounts",
            oldValues: { totalDeleted: count },
            newValues: { reason: "Pro Mode custom setup - start from scratch" },
        });

        return { deleted: count };
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
            // 1. Current Assets
            { code: "1100", name: "Kas & Bank", typeId: "ASSET", description: "Akun induk kas dan bank" }, // Parent
            { code: "1101", name: "Kas Toko", typeId: "ASSET", parentId: "1-1100", description: "Kas tunai di toko" },
            { code: "1102", name: "Kas Kecil", typeId: "ASSET", parentId: "1-1100", description: "Petty cash untuk pengeluaran kecil" },
            { code: "1110", name: "Bank BCA", typeId: "ASSET", parentId: "1-1100", description: "Rekening bank BCA" },
            { code: "1111", name: "Bank Mandiri", typeId: "ASSET", parentId: "1-1100", description: "Rekening bank Mandiri" },
            { code: "1112", name: "Bank BRI", typeId: "ASSET", parentId: "1-1100", description: "Rekening bank BRI" },

            { code: "1200", name: "Piutang", typeId: "ASSET", description: "Akun induk piutang" }, // Parent
            { code: "1201", name: "Piutang Usaha", typeId: "ASSET", parentId: "1-1200", description: "Piutang dari pelanggan" },
            { code: "1202", name: "Piutang Karyawan", typeId: "ASSET", parentId: "1-1200", description: "Piutang dipinjam karyawan" },

            { code: "1300", name: "Persediaan", typeId: "ASSET", description: "Akun induk persediaan" }, // Parent
            { code: "1301", name: "Persediaan Barang", typeId: "ASSET", parentId: "1-1300", description: "Stok barang dagang" },
            { code: "1302", name: "Persediaan Sparepart", typeId: "ASSET", parentId: "1-1300", description: "Stok sparepart service" },

            // 2. Fixed Assets
            { code: "1400", name: "Aset Tetap", typeId: "ASSET", description: "Akun induk aset tetap" }, // Parent
            { code: "1401", name: "Peralatan Kerja", typeId: "ASSET", parentId: "1-1400", description: "Peralatan servis (solder, multimeter, dll)" },
            { code: "1402", name: "Inventaris Toko", typeId: "ASSET", parentId: "1-1400", description: "Meja, kursi, etalase, dll" },
            { code: "1403", name: "Kendaraan", typeId: "ASSET", parentId: "1-1400", description: "Kendaraan operasional" },
            { code: "1404", name: "Bangunan", typeId: "ASSET", parentId: "1-1400", description: "Bangunan toko (jika milik sendiri)" },
            { code: "1405", name: "Tanah", typeId: "ASSET", parentId: "1-1400", description: "Tanah (tidak disusutkan)" },
            { code: "1490", name: "Aset Tetap Lainnya", typeId: "ASSET", parentId: "1-1400", description: "Aset tetap lainnya" },
            { code: "1499", name: "Akumulasi Penyusutan", typeId: "ASSET", parentId: "1-1400", description: "Akun kontra untuk penyusutan aset" },

            // ========== LIABILITIES (2-xxxx) ==========
            { code: "2100", name: "Hutang Jangka Pendek", typeId: "LIABILITY", description: "Kewajiban < 1 tahun" }, // Parent
            { code: "2101", name: "Hutang Usaha", typeId: "LIABILITY", parentId: "2-2100", description: "Hutang ke supplier" },
            { code: "2102", name: "Hutang Gaji", typeId: "LIABILITY", parentId: "2-2100", description: "Gaji/komisi yang belum dibayar" },
            { code: "2103", name: "Deposit Pelanggan", typeId: "LIABILITY", parentId: "2-2100", description: "Uang muka dari pelanggan" },

            { code: "2200", name: "Hutang Jangka Panjang", typeId: "LIABILITY", description: "Kewajiban > 1 tahun" }, // Parent
            { code: "2201", name: "Hutang Bank", typeId: "LIABILITY", parentId: "2-2200", description: "Pinjaman bank jangka panjang" },

            // ========== EQUITY (3-xxxx) ==========
            { code: "3100", name: "Modal", typeId: "EQUITY", description: "Akun induk modal" }, // Parent
            { code: "3101", name: "Modal Pemilik", typeId: "EQUITY", parentId: "3-3100", description: "Modal awal pemilik" },
            { code: "3102", name: "Prive/Pengambilan", typeId: "EQUITY", parentId: "3-3100", description: "Pengambilan pribadi pemilik" },
            { code: "3200", name: "Laba Ditahan", typeId: "EQUITY", description: "Laba tahun-tahun sebelumnya" },

            // ========== REVENUE (4-xxxx) ==========
            { code: "4100", name: "Pendapatan Usaha", typeId: "REVENUE", description: "Pendapatan operasional utama" }, // Parent
            { code: "4101", name: "Pendapatan Penjualan", typeId: "REVENUE", parentId: "4-4100", description: "Penjualan barang" },
            { code: "4102", name: "Pendapatan Service", typeId: "REVENUE", parentId: "4-4100", description: "Jasa perbaikan/servis" },
            { code: "4103", name: "Pendapatan Lainnya", typeId: "REVENUE", parentId: "4-4100", description: "Pendapatan diluar usaha utama" },

            { code: "4200", name: "Kontra Pendapatan", typeId: "REVENUE", description: "Pengurang pendapatan" }, // Parent
            { code: "4201", name: "Diskon Penjualan", typeId: "REVENUE", parentId: "4-4200", description: "Potongan harga ke pelanggan" },
            { code: "4202", name: "Retur Penjualan", typeId: "REVENUE", parentId: "4-4200", description: "Barang yang dikembalikan pelanggan" },

            // ========== EXPENSE (5-xxxx) ==========
            { code: "5100", name: "Harga Pokok Penjualan", typeId: "EXPENSE", description: "Biaya langsung produk/jasa" }, // Parent
            { code: "5101", name: "HPP Penjualan", typeId: "EXPENSE", parentId: "5-5100", description: "Harga pokok barang terjual" },
            { code: "5102", name: "HPP Service", typeId: "EXPENSE", parentId: "5-5100", description: "Sparepart untuk service" },

            { code: "5200", name: "Beban Operasional", typeId: "EXPENSE", description: "Biaya operasional sehari-hari" }, // Parent
            { code: "5201", name: "Beban Gaji", typeId: "EXPENSE", parentId: "5-5200", description: "Gaji karyawan" },
            { code: "5202", name: "Komisi Teknisi", typeId: "EXPENSE", parentId: "5-5200", description: "Komisi untuk teknisi" },
            { code: "5203", name: "Beban Sewa", typeId: "EXPENSE", parentId: "5-5200", description: "Sewa tempat usaha" },
            { code: "5204", name: "Beban Listrik", typeId: "EXPENSE", parentId: "5-5200", description: "Tagihan listrik" },
            { code: "5205", name: "Beban Air", typeId: "EXPENSE", parentId: "5-5200", description: "Tagihan air (PDAM)" },
            { code: "5206", name: "Beban Internet", typeId: "EXPENSE", parentId: "5-5200", description: "Tagihan internet/wifi" },
            { code: "5207", name: "Beban Perlengkapan", typeId: "EXPENSE", parentId: "5-5200", description: "ATK dan perlengkapan kantor" },
            { code: "5208", name: "Beban Transportasi", typeId: "EXPENSE", parentId: "5-5200", description: "Ongkos kirim, bensin, dll" },
            { code: "5209", name: "Beban Iklan", typeId: "EXPENSE", parentId: "5-5200", description: "Promosi dan marketing" },
            { code: "5210", name: "Beban Pemeliharaan", typeId: "EXPENSE", parentId: "5-5200", description: "Maintenance alat & gedung" },
            { code: "5211", name: "Beban Penyusutan", typeId: "EXPENSE", parentId: "5-5200", description: "Penyusutan aset tetap bulanan" },
            { code: "5900", name: "Beban Lain-lain", typeId: "EXPENSE", parentId: "5-5200", description: "Beban operasional lainnya" },
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
