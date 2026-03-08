export type DeadPhoneStatus = 'STORED' | 'TESTED' | 'HARVESTED';

export interface DeadPhonePurchase {
    id: string;
    deviceName: string;
    imei?: string | undefined;
    purchasePrice: number;
    purchaseDate: Date;
    supplierId?: string | undefined;
    suspectedIssue?: string | undefined;
    visualCondition?: string | undefined;
    status: DeadPhoneStatus;
    storageLocation?: string | undefined;
    createdAt?: Date | undefined;
}

export interface IGamblingRepository {
    savePurchase(purchase: Partial<DeadPhonePurchase>): Promise<DeadPhonePurchase>;
    saveTestLog(log: any): Promise<any>;
    findById(id: string): Promise<DeadPhonePurchase | null>;
    findAll(filters?: any): Promise<DeadPhonePurchase[]>;
    updateStatus(id: string, status: DeadPhoneStatus): Promise<void>;
}
