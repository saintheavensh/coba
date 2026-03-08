import { DBContext } from "../../../../shared/types/db-context";

export interface ICommissionSettingsRepository {
    findByTechnicianId(technicianId: string, dbOrTx?: DBContext): Promise<any | null>;
    upsert(data: any, dbOrTx?: DBContext): Promise<void>;
}

export interface ICommissionRepository {
    create(data: any, dbOrTx?: DBContext): Promise<{ id: string }>;
    findByTechnicianId(technicianId: string, startDate?: Date, endDate?: Date, dbOrTx?: DBContext): Promise<any[]>;
    markAsPaid(ids: string[], dbOrTx?: DBContext): Promise<void>;
}
