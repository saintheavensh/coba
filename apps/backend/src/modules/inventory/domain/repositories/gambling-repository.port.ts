export type DeadPhoneStatus = 'STORED' | 'TESTED' | 'HARVESTED';

export interface DeadPhonePurchase {
    id: string;
    deviceName: string;
    imei?: string;
    purchasePrice: number;
    purchaseDate: Date;
    supplierId?: string;
    suspectedIssue?: string;
    visualCondition?: string;
    status: DeadPhoneStatus;
    storageLocation?: string;
    createdAt?: Date;
}

export interface IGamblingRepository {
    savePurchase(purchase: Partial<DeadPhonePurchase>): Promise<DeadPhonePurchase>;
    saveTestLog(log: any): Promise<any>;
    findById(id: string): Promise<DeadPhonePurchase | null>;
    findAll(filters?: any): Promise<DeadPhonePurchase[]>;
    updateStatus(id: string, status: DeadPhoneStatus): Promise<void>;
}
