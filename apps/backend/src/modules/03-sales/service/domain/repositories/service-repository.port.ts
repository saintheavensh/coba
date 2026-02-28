import { DBContext } from "../../../../../shared/types/db-context";
import { ServiceTicket } from "../entities/service.entity";

export interface IServiceRepository {
    findAll(params: { status?: string; technicianId?: string }, dbOrTx?: DBContext): Promise<ServiceTicket[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<ServiceTicket | null>;
    findLastServiceNo(prefix: string, dbOrTx?: DBContext): Promise<{ no: string } | null>;
    getCountsByStatus(dbOrTx?: DBContext): Promise<Array<{ status: string; count: number }>>;
    getTechnicianStats(technicianId: string, start: Date, end: Date, dbOrTx?: DBContext): Promise<ServiceTicket[]>;
    create(data: any, dbOrTx?: DBContext): Promise<{ id: string }>;
    update(id: string, data: any, dbOrTx?: DBContext): Promise<void>;
    delete(id: string, dbOrTx?: DBContext): Promise<void>;
    logActivity(params: {
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        description: string;
        oldValue?: any;
        newValue?: any;
    }, dbOrTx?: DBContext): Promise<void>;
    getTimeline(entityId: string, dbOrTx?: DBContext): Promise<any[]>;
}
