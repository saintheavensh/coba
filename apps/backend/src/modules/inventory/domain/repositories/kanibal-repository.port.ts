import { DBContext } from "../../../../shared/types/db-context";
export type ForfeitedDeviceStatus = 'UTUH' | 'HARVESTED';

export interface ForfeitedDevice {
    id: string;
    serviceId?: string | undefined;
    deviceName?: string | undefined;
    forfeitedDate: Date;
    status: ForfeitedDeviceStatus;
    notes?: string | undefined;
}

export interface PartHarvestLog {
    id: string;
    forfeitedDeviceId?: string | undefined;
    deadPhoneId?: string | undefined;
    partType: string;
    partCondition?: string | undefined;
    targetServiceId?: string | undefined;
    technicianId?: string | undefined;
    harvestDate: Date;
    newBatchId?: string | undefined;
    notes?: string | undefined;
}

export interface IKanibalRepository {
    saveForfeitedDevice(device: Partial<ForfeitedDevice>, dbOrTx?: DBContext): Promise<ForfeitedDevice>;
    saveHarvestLog(log: Partial<PartHarvestLog>, dbOrTx?: DBContext): Promise<PartHarvestLog>;
    findForfeitedDevices(filters?: any, dbOrTx?: DBContext): Promise<ForfeitedDevice[]>;
    findForfeitedDeviceById(id: string, dbOrTx?: DBContext): Promise<ForfeitedDevice | null>;
    updateForfeitedStatus(id: string, status: ForfeitedDeviceStatus, dbOrTx?: DBContext): Promise<void>;
}
