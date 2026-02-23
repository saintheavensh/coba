import { DBContext } from "../../../../shared/types/db-context";

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

export interface IInventoryGateway {
    updateStock(batchId: string, delta: number, dbOrTx?: DBContext): Promise<void>;
    getBatch(batchId: string, dbOrTx?: DBContext): Promise<any>;
}

export interface INotificationGateway {
    technicianAssigned(technicianId: string, serviceNo: string, serviceId: string): Promise<void>;
    serviceStatusChanged(userId: string, serviceNo: string, status: string, serviceId: string): Promise<void>;
    sendWhatsApp(type: "new" | "status" | "complete", serviceData: any, extra: any): Promise<void>;
}

export interface ISettingsGateway {
    getWarrantyDays(label: string, dbOrTx?: DBContext): Promise<number>;
    getServiceSettings(dbOrTx?: DBContext): Promise<any>;
}

export interface IUserGateway {
    getTechnician(id: string, dbOrTx?: DBContext): Promise<any>;
}
