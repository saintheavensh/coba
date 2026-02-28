export type ForfeitedDeviceStatus = 'UTUH' | 'HARVESTED';

export interface ForfeitedDevice {
    id: string;
    serviceId?: string;
    deviceName?: string;
    forfeitedDate: Date;
    status: ForfeitedDeviceStatus;
    notes?: string;
}

export interface PartHarvestLog {
    id: string;
    forfeitedDeviceId?: string;
    deadPhoneId?: string;
    partType: string;
    partCondition?: string;
    targetServiceId?: string;
    technicianId?: string;
    harvestDate: Date;
    newBatchId?: string;
    notes?: string;
}

export interface IKanibalRepository {
    saveForfeitedDevice(device: Partial<ForfeitedDevice>): Promise<ForfeitedDevice>;
    saveHarvestLog(log: Partial<PartHarvestLog>): Promise<PartHarvestLog>;
    findForfeitedDevices(filters?: any): Promise<ForfeitedDevice[]>;
    findForfeitedDeviceById(id: string): Promise<ForfeitedDevice | null>;
    updateForfeitedStatus(id: string, status: ForfeitedDeviceStatus): Promise<void>;
}
