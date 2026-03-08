import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import {
    AccountRepositoryAdapter,
    JournalRepositoryAdapter,
    CashRegisterRepositoryAdapter,
    RevenueTargetRepositoryAdapter,
    PurchasePaymentRepositoryAdapter,
    CommissionPaymentRepositoryAdapter
} from "../infrastructure";
import {
    CreateAccountUseCase,
    UpdateAccountUseCase,
    DeleteAccountUseCase,
    GetAccountTreeUseCase,
    CreateJournalUseCase,
    OpenRegisterUseCase,
    CloseRegisterUseCase,
    RecordCashExpenseUseCase,
    RecordCashTransactionUseCase
} from "../application";

/**
 * AccountingService — Facade for external and presentation layers.
 */
@injectable()
export class AccountingService {
    constructor(
        @inject(TYPES.IAccountRepository) private readonly accountRepository: AccountRepositoryAdapter,
        @inject(TYPES.IJournalRepository) private readonly journalRepository: JournalRepositoryAdapter,
        @inject(TYPES.ICashRegisterRepository) private readonly registerRepository: CashRegisterRepositoryAdapter,
        @inject(TYPES.IRevenueTargetRepository) private readonly targetRepository: RevenueTargetRepositoryAdapter,
        @inject(TYPES.IPurchasePaymentRepository) private readonly paymentRepository: PurchasePaymentRepositoryAdapter,
        @inject(TYPES.ICommissionPaymentRepository) private readonly commissionRepository: CommissionPaymentRepositoryAdapter,

        @inject(TYPES.CreateAccountUseCase) private readonly createAccountUC: CreateAccountUseCase,
        @inject(TYPES.UpdateAccountUseCase) private readonly updateAccountUC: UpdateAccountUseCase,
        @inject(TYPES.DeleteAccountUseCase) private readonly deleteAccountUC: DeleteAccountUseCase,
        @inject(TYPES.GetAccountTreeUseCase) private readonly getAccountTreeUC: GetAccountTreeUseCase,
        @inject(TYPES.CreateJournalUseCase) private readonly createJournalUC: CreateJournalUseCase,
        @inject(TYPES.OpenRegisterUseCase) private readonly openRegisterUC: OpenRegisterUseCase,
        @inject(TYPES.CloseRegisterUseCase) private readonly closeRegisterUC: CloseRegisterUseCase,
        @inject(TYPES.RecordCashExpenseUseCase) private readonly recordExpenseUC: RecordCashExpenseUseCase,
        @inject(TYPES.RecordCashTransactionUseCase) private readonly recordTransactionUC: RecordCashTransactionUseCase
    ) { }

    // Accounts
    async getAccountTypes() { return await this.accountRepository.findTypes(); }
    async getAllAccounts(filters: any) { return await this.accountRepository.findAll(filters); }
    async getAccountTree(filters: any) { return await this.getAccountTreeUC.execute(filters); }
    async getAccountById(id: string) { return await this.accountRepository.findById(id); }
    async createAccount(input: any, userId?: string) { return await this.createAccountUC.execute(input, userId); }
    async updateAccount(id: string, input: any, userId?: string) { return await this.updateAccountUC.execute(id, input, userId); }
    async deleteAccount(id: string, userId?: string) { return await this.deleteAccountUC.execute(id, userId); }

    // Journals
    async createJournal(input: any, userId?: string, dbOrTx?: any): Promise<string> { return await this.createJournalUC.execute(input, userId, dbOrTx); }
    async getAllJournals(filters: any, dbOrTx?: any) { return await this.journalRepository.findAll(filters, dbOrTx); }
    async getJournalById(id: string, dbOrTx?: any) { return await this.journalRepository.findById(id, dbOrTx); }

    // Cash Register
    async getCurrentRegister(dbOrTx?: any) { return await this.registerRepository.getCurrent(dbOrTx); }
    async isRegisterOpen(dbOrTx?: any) { return (await this.registerRepository.getCurrent(dbOrTx)) !== null; }
    async openRegister(openingBalance: number, userId: string, dbOrTx?: any) { return await this.openRegisterUC.execute(openingBalance, userId, dbOrTx); }
    async closeRegister(actualClosing: number, notes: string, userId: string, reservation?: any, dbOrTx?: any) {
        return await this.closeRegisterUC.execute({ actualClosing, notes, reservation }, userId, dbOrTx);
    }
    async recordCashExpense(amount: number, category: string, description: string, userId: string, userRoles: string[], dbOrTx?: any) {
        return await this.recordExpenseUC.execute({ amount, category, description, userRoles }, userId, dbOrTx);
    }
    async recordCashTransaction(input: any, dbOrTx?: any) { return await this.recordTransactionUC.execute(input, dbOrTx); }
    async getRegisterHistory(filters: any, dbOrTx?: any) {
        const { limit = 50, offset = 0 } = filters;
        return await this.registerRepository.listHistory(limit, offset, dbOrTx);
    }
    async getRegisterSummary(registerId: string, dbOrTx?: any) { return await this.registerRepository.getSummary(registerId, dbOrTx); }
    async getTodayRegisterProgress(dbOrTx?: any) { return await this.registerRepository.getTodayProgress(dbOrTx); }

    // Assets (Stubbed for compilation, logic should be in Use Cases)
    async createAsset(_input: any, _userId: string, _dbOrTx?: any): Promise<{ id: string }> { return { id: "TEMP" }; }
    async getAllAssets(_dbOrTx?: any): Promise<any[]> { return []; }
    async getAssetById(_id: string, _dbOrTx?: any): Promise<any | null> { return null; }

    // Revenue Targets
    async getRevenueTarget(month: string) { return await this.targetRepository.findByMonth(month); }
    async upsertRevenueTarget(month: string, data: any) { return await this.targetRepository.upsert(month, data); }

    // Payments (Internal access for legacy services)
    get iPaymentRepository() { return this.paymentRepository; }
    get iCommissionRepository() { return this.commissionRepository; }
}
