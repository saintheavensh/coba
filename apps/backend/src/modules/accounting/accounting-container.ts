import { ContainerModule } from "inversify";
import { TYPES } from "./types";
import {
    AccountRepositoryAdapter,
    JournalRepositoryAdapter,
    CashRegisterRepositoryAdapter,
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
    RecordCashTransactionUseCase
} from "./application";
import {
    AccountingService,
    AccountingReportService,
    LiabilitiesService,
    SupplierPaymentService,
    RevenueTargetService,
    AssetsService,
    AuditService
} from "./services/index";
import { AccountingController } from "./presentation/accounting.controller";

/**
 * Accounting Module Container
 * Configures all dependencies for the Accounting module using Inversify.
 */
export const accountingContainerModule = new ContainerModule(({ bind }) => {
    // Repositories (Concrete classes)
    bind(AccountRepositoryAdapter).toSelf().inSingletonScope();
    bind(JournalRepositoryAdapter).toSelf().inSingletonScope();
    bind(CashRegisterRepositoryAdapter).toSelf().inSingletonScope();
    bind(RevenueTargetRepositoryAdapter).toSelf().inSingletonScope();
    bind(PurchasePaymentRepositoryAdapter).toSelf().inSingletonScope();
    bind(CommissionPaymentRepositoryAdapter).toSelf().inSingletonScope();

    // Repository Interfaces (Mappings)
    bind(TYPES.IAccountRepository).to(AccountRepositoryAdapter).inSingletonScope();
    bind(TYPES.IJournalRepository).to(JournalRepositoryAdapter).inSingletonScope();
    bind(TYPES.ICashRegisterRepository).to(CashRegisterRepositoryAdapter).inSingletonScope();
    bind(TYPES.IRevenueTargetRepository).to(RevenueTargetRepositoryAdapter).inSingletonScope();
    bind(TYPES.IPurchasePaymentRepository).to(PurchasePaymentRepositoryAdapter).inSingletonScope();
    bind(TYPES.ICommissionPaymentRepository).to(CommissionPaymentRepositoryAdapter).inSingletonScope();

    // Application / Use Cases
    bind<CreateAccountUseCase>(TYPES.CreateAccountUseCase).to(CreateAccountUseCase).inSingletonScope();
    bind<UpdateAccountUseCase>(TYPES.UpdateAccountUseCase).to(UpdateAccountUseCase).inSingletonScope();
    bind<DeleteAccountUseCase>(TYPES.DeleteAccountUseCase).to(DeleteAccountUseCase).inSingletonScope();
    bind<GetAccountTreeUseCase>(TYPES.GetAccountTreeUseCase).to(GetAccountTreeUseCase).inSingletonScope();
    bind<CreateJournalUseCase>(TYPES.CreateJournalUseCase).to(CreateJournalUseCase).inSingletonScope();
    bind<OpenRegisterUseCase>(TYPES.OpenRegisterUseCase).to(OpenRegisterUseCase).inSingletonScope();
    bind<CloseRegisterUseCase>(TYPES.CloseRegisterUseCase).to(CloseRegisterUseCase).inSingletonScope();
    bind<RecordCashExpenseUseCase>(TYPES.RecordCashExpenseUseCase).to(RecordCashExpenseUseCase).inSingletonScope();
    bind<RecordCashTransactionUseCase>(TYPES.RecordCashTransactionUseCase).to(RecordCashTransactionUseCase).inSingletonScope();

    // Domain Services
    bind<AccountingService>(TYPES.AccountingService).to(AccountingService).inSingletonScope();
    bind<AccountingReportService>(TYPES.AccountingReportService).to(AccountingReportService).inSingletonScope();
    bind<LiabilitiesService>(TYPES.LiabilitiesService).to(LiabilitiesService).inSingletonScope();
    bind<SupplierPaymentService>(TYPES.SupplierPaymentService).to(SupplierPaymentService).inSingletonScope();
    bind<RevenueTargetService>(TYPES.RevenueTargetService).to(RevenueTargetService).inSingletonScope();
    bind<AssetsService>(TYPES.AssetsService).to(AssetsService).inSingletonScope();
    bind<AuditService>(TYPES.AuditService).to(AuditService).inSingletonScope();

    // Controllers
    bind<AccountingController>(AccountingController).toSelf().inSingletonScope();
});

import { Container } from "inversify";

const getAccountingController = (): AccountingController => {
    const { container } = require("../../container");
    return (container as Container).get<AccountingController>(AccountingController);
};

export const accountingController = new Proxy({} as AccountingController, {
    get: (_target, prop) => {
        const controller = getAccountingController();
        const value = (controller as any)[prop];
        if (typeof value === "function") {
            return value.bind(controller);
        }
        return value;
    }
});
