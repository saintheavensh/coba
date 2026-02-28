import { IServiceItemRepository } from "../../domain/repositories/service-item-repository.port";
import { IServiceTypeRepository } from "../../domain/repositories/service-type-repository.port";

export interface ICommissionSettingsRepository {
    findByTechnicianId(technicianId: string): Promise<any | null>;
    upsert(data: any): Promise<void>;
}

export interface ICommissionRepository {
    create(data: any): Promise<{ id: string }>;
    findByTechnicianId(technicianId: string, startDate?: Date, endDate?: Date): Promise<any[]>;
    markAsPaid(ids: string[]): Promise<void>;
}
