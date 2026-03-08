export const TYPES = {
    // Repositories
    IAccountRepository: Symbol.for("IAccountRepository"),
    IJournalRepository: Symbol.for("IJournalRepository"),
    ICashRegisterRepository: Symbol.for("ICashRegisterRepository"),
    IRevenueTargetRepository: Symbol.for("IRevenueTargetRepository"),
    IPurchasePaymentRepository: Symbol.for("IPurchasePaymentRepository"),
    ICommissionPaymentRepository: Symbol.for("ICommissionPaymentRepository"),

    // Services
    AccountingService: Symbol.for("AccountingService"),
    AccountingReportService: Symbol.for("AccountingReportService"),
    LiabilitiesService: Symbol.for("LiabilitiesService"),
    SupplierPaymentService: Symbol.for("SupplierPaymentService"),
    RevenueTargetService: Symbol.for("RevenueTargetService"),
    AssetsService: Symbol.for("AssetsService"),
    AuditService: Symbol.for("AuditService"),

    // Use Cases
    CreateAccountUseCase: Symbol.for("CreateAccountUseCase"),
    UpdateAccountUseCase: Symbol.for("UpdateAccountUseCase"),
    DeleteAccountUseCase: Symbol.for("DeleteAccountUseCase"),
    GetAccountTreeUseCase: Symbol.for("GetAccountTreeUseCase"),
    CreateJournalUseCase: Symbol.for("CreateJournalUseCase"),
    OpenRegisterUseCase: Symbol.for("OpenRegisterUseCase"),
    CloseRegisterUseCase: Symbol.for("CloseRegisterUseCase"),
    RecordCashExpenseUseCase: Symbol.for("RecordCashExpenseUseCase"),
    RecordCashTransactionUseCase: Symbol.for("RecordCashTransactionUseCase")
};
