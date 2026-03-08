import { DBContext } from "../../../../shared/types/db-context";
import { CashRegister, CashTransaction } from "../entities/cash-register.entity";
import { FixedAsset, DepreciationEntry } from "../entities/asset.entity";
import {
    RegisterSummaryDTO,
    TodayProgressDTO,
    RevenueTargetDTO,
    AccountingPurchasePaymentDTO,
    AccountingCommissionPaymentDTO
} from "../../../../shared/dtos/repositories/accounting";

export interface ICashRegisterRepository {
    getCurrent(dbOrTx?: DBContext): Promise<CashRegister | null>;
    getById(id: string, dbOrTx?: DBContext): Promise<CashRegister | null>;
    create(data: Partial<CashRegister>, dbOrTx?: DBContext): Promise<{ id: string }>;
    update(id: string, data: Partial<CashRegister>, dbOrTx?: DBContext): Promise<void>;
    listHistory(limit: number, offset: number, dbOrTx?: DBContext): Promise<CashRegister[]>;

    createTransaction(data: Partial<CashTransaction>, dbOrTx?: DBContext): Promise<void>;
    getTransactions(registerId: string, dbOrTx?: DBContext): Promise<CashTransaction[]>;
    getSummary(registerId: string, dbOrTx?: DBContext): Promise<RegisterSummaryDTO>;
    getTodayProgress(dbOrTx?: DBContext): Promise<TodayProgressDTO>;
}

export interface IAssetRepository {
    findAll(dbOrTx?: DBContext): Promise<FixedAsset[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<FixedAsset | null>;
    create(data: Partial<FixedAsset>, dbOrTx?: DBContext): Promise<{ id: string }>;
    update(id: string, data: Partial<FixedAsset>, dbOrTx?: DBContext): Promise<void>;
    delete(id: string, dbOrTx?: DBContext): Promise<void>;

    createDepreciation(data: Partial<DepreciationEntry>, dbOrTx?: DBContext): Promise<void>;
    getDepreciationHistory(assetId: string, dbOrTx?: DBContext): Promise<DepreciationEntry[]>;
}

export interface IRevenueTargetRepository {
    findByMonth(month: string, dbOrTx?: DBContext): Promise<RevenueTargetDTO | null>;
    upsert(month: string, data: Partial<RevenueTargetDTO>, dbOrTx?: DBContext): Promise<void>;
}

export interface IPurchasePaymentRepository {
    findById(id: string, dbOrTx?: DBContext): Promise<AccountingPurchasePaymentDTO | null>;
    create(data: Partial<AccountingPurchasePaymentDTO>, dbOrTx?: DBContext): Promise<{ id: string }>;
    getTotalPaid(purchaseId: string, dbOrTx?: DBContext): Promise<number>;
    findHistoryByPurchaseId(purchaseId: string, dbOrTx?: DBContext): Promise<AccountingPurchasePaymentDTO[]>;
    findPurchaseById(id: string, dbOrTx?: DBContext): Promise<any | null>;
}

export interface ICommissionPaymentRepository {
    create(data: Partial<AccountingCommissionPaymentDTO>, dbOrTx?: DBContext): Promise<{ id: string }>;
    findHistory(technicianId?: string, period?: string, dbOrTx?: DBContext): Promise<AccountingCommissionPaymentDTO[]>;
    getPaidServiceIds(period: string, dbOrTx?: DBContext): Promise<Set<string>>;
}
