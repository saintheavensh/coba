import { DBContext } from "../../../../../shared/types/db-context";

export interface IServiceItemRepository {
    findByServiceId(serviceId: string, dbOrTx?: DBContext): Promise<any[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<any | null>;
    create(data: { serviceId: string; serviceTypeId?: string; technicianId?: string; description?: string; estimatedCost?: number; actualCost?: number; status?: string }, dbOrTx?: DBContext): Promise<{ id: string }>;
    update(id: string, data: Partial<{ serviceTypeId: string; technicianId: string; description: string; estimatedCost: number; actualCost: number; status: string; completedAt: Date }>, dbOrTx?: DBContext): Promise<void>;
    delete(id: string, dbOrTx?: DBContext): Promise<void>;
}
