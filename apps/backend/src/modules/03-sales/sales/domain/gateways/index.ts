import { DBContext } from "../../../../../shared/types/db-context";

export interface IInventoryGateway {
    deductStockFIFO(params: {
        saleId: string;
        items: {
            productId: string;
            variant: string;
            quantity: number;
            unitPrice: number;
        }[];
    }, dbOrTx?: DBContext): Promise<{ allocations: any[]; cogsAmount: number }>;
}

export interface IAccountingGateway {
    isRegisterOpen(dbOrTx?: DBContext): Promise<boolean>;
    recordCashTransaction(params: {
        transactionType: string;
        transactionId: string;
        amount: number;
        description: string;
    }, dbOrTx?: DBContext): Promise<void>;
    createJournal(params: {
        description: string;
        referenceType: string;
        referenceId: string;
        lines: Array<{ accountId: string; debit: number; credit: number; description: string }>;
    }, userId: string, dbOrTx?: DBContext): Promise<void>;
}

export interface IMemberGateway {
    findById(id: string, dbOrTx?: DBContext): Promise<any>;
    updateDebt(id: string, delta: number, dbOrTx?: DBContext): Promise<void>;
}

export interface ISettingsGateway {
    getPaymentMethods(dbOrTx?: DBContext): Promise<any>;
}

export interface IApprovalGateway {
    needsApproval(type: 'DISCOUNT' | 'VOID' | 'REFUND', amount: number, data?: any): Promise<boolean>;
    isApproved(approvalId: string, entityType: string, entityId?: string): Promise<boolean>;
}
