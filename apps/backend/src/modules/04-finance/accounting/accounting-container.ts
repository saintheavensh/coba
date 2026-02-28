import { db } from "../../../shared/infrastructure/database/client";
import {
    AccountRepositoryAdapter,
    JournalRepositoryAdapter,
    CashRegisterRepositoryAdapter,
    AssetRepositoryAdapter,
    RevenueTargetRepositoryAdapter,
    PurchasePaymentRepositoryAdapter,
    CommissionPaymentRepositoryAdapter
} from "./infrastructure";
import {
    CreateAccountUseCase,
    UpdateAccountUseCase,
    DeleteAccountUseCase,
    GetAccountTreeUseCase,
    CreateJournalUseCase,
    OpenRegisterUseCase,
    CloseRegisterUseCase,
    RecordCashExpenseUseCase,
    RecordCashTransactionUseCase,
    CreateAssetUseCase
} from "./application";

// Adapters
const accountRepository = new AccountRepositoryAdapter();
const journalRepository = new JournalRepositoryAdapter();
const registerRepository = new CashRegisterRepositoryAdapter();
const assetRepository = new AssetRepositoryAdapter();
const targetRepository = new RevenueTargetRepositoryAdapter();
const paymentRepository = new PurchasePaymentRepositoryAdapter();
const commissionRepository = new CommissionPaymentRepositoryAdapter();

// Use Cases
const createAccountUC = new CreateAccountUseCase(accountRepository);
const updateAccountUC = new UpdateAccountUseCase(accountRepository);
const deleteAccountUC = new DeleteAccountUseCase(accountRepository);
const getAccountTreeUC = new GetAccountTreeUseCase(accountRepository);
const createJournalUC = new CreateJournalUseCase(journalRepository, accountRepository);

const openRegisterUC = new OpenRegisterUseCase(registerRepository);
const closeRegisterUC = new CloseRegisterUseCase(registerRepository, createJournalUC);
const recordExpenseUC = new RecordCashExpenseUseCase(registerRepository, createJournalUC);
const recordTransactionUC = new RecordCashTransactionUseCase(registerRepository);
const createAssetUC = new CreateAssetUseCase(assetRepository, createJournalUC);

/**
 * AccountingService — Facade for external and presentation layers.
 */
export class AccountingService {
    // Accounts
    async getAccountTypes() { return await accountRepository.findTypes(); }
    async getAllAccounts(filters: any) { return await accountRepository.findAll(filters); }
    async getAccountTree(filters: any) { return await getAccountTreeUC.execute(filters); }
    async getAccountById(id: string) { return await accountRepository.findById(id); }
    async createAccount(input: any, userId?: string) { return await createAccountUC.execute(input, userId); }
    async updateAccount(id: string, input: any, userId?: string) { return await updateAccountUC.execute(id, input, userId); }
    async deleteAccount(id: string, userId?: string) { return await deleteAccountUC.execute(id, userId); }

    // Journals
    async createJournal(input: any, userId?: string, dbOrTx?: any): Promise<string> { return await createJournalUC.execute(input, userId, dbOrTx); }
    async getAllJournals(filters: any, dbOrTx?: any) { return await journalRepository.findAll(filters, dbOrTx); }
    async getJournalById(id: string, dbOrTx?: any) { return await journalRepository.findById(id, dbOrTx); }

    // Cash Register
    async getCurrentRegister(dbOrTx?: any) { return await registerRepository.getCurrent(dbOrTx); }
    async isRegisterOpen(dbOrTx?: any) { return (await registerRepository.getCurrent(dbOrTx)) !== null; }
    async openRegister(openingBalance: number, userId: string, dbOrTx?: any) { return await openRegisterUC.execute(openingBalance, userId, dbOrTx); }
    async closeRegister(actualClosing: number, notes: string, userId: string, reservation?: any, dbOrTx?: any) {
        return await closeRegisterUC.execute({ actualClosing, notes, reservation }, userId, dbOrTx);
    }
    async recordCashExpense(amount: number, category: string, description: string, userId: string, userRoles: string[], dbOrTx?: any) {
        return await recordExpenseUC.execute({ amount, category, description, userRoles }, userId, dbOrTx);
    }
    async recordCashTransaction(input: any, dbOrTx?: any) { return await recordTransactionUC.execute(input, dbOrTx); }
    async getRegisterHistory(filters: any, dbOrTx?: any) {
        const { limit = 50, offset = 0 } = filters;
        return await registerRepository.listHistory(limit, offset, dbOrTx);
    }
    async getRegisterSummary(registerId: string, dbOrTx?: any) { return await registerRepository.getSummary(registerId, dbOrTx); }
    async getTodayRegisterProgress(dbOrTx?: any) { return await registerRepository.getTodayProgress(dbOrTx); }

    // Assets
    async createAsset(input: any, userId: string, dbOrTx?: any) { return await createAssetUC.execute(input, userId, dbOrTx); }
    async getAllAssets(dbOrTx?: any) { return await assetRepository.findAll(dbOrTx); }
    async getAssetById(id: string, dbOrTx?: any) { return await assetRepository.findById(id, dbOrTx); }

    // Revenue Targets
    async getRevenueTarget(month: string) { return await targetRepository.findByMonth(month); }
    async upsertRevenueTarget(month: string, data: any) { return await targetRepository.upsert(month, data); }

    // Payments (Internal access for legacy services)
    get paymentRepository() { return paymentRepository; }
    get commissionRepository() { return commissionRepository; }
}

/** Singleton instance */
export const accountingService = new AccountingService();
export {
    createAccountUC,
    updateAccountUC,
    deleteAccountUC,
    getAccountTreeUC,
    createJournalUC,
    openRegisterUC,
    closeRegisterUC,
    recordExpenseUC,
    recordTransactionUC,
    createAssetUC
};
