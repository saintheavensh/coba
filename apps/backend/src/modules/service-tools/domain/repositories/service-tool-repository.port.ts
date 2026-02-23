import { DBContext } from "../../../../shared/types/db-context";
import { ServiceTool, ServiceToolRequest } from "../entities/service-tool.entity";

export interface IServiceToolRepository {
    findAll(dbOrTx?: DBContext): Promise<ServiceTool[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<ServiceTool | null>;
    findByUserId(userId: string, dbOrTx?: DBContext): Promise<ServiceTool[]>;
    findLast(dbOrTx?: DBContext): Promise<ServiceTool | null>;
    create(data: any, dbOrTx?: DBContext): Promise<ServiceTool>;
    update(id: string, data: any, dbOrTx?: DBContext): Promise<void>;
    delete(id: string, dbOrTx?: DBContext): Promise<void>;

    // Tool Requests
    findAllRequests(dbOrTx?: DBContext): Promise<ServiceToolRequest[]>;
    findRequestsByUserId(userId: string, dbOrTx?: DBContext): Promise<ServiceToolRequest[]>;
    createRequest(data: any, dbOrTx?: DBContext): Promise<ServiceToolRequest>;
    updateRequestStatus(id: string, status: string, dbOrTx?: DBContext): Promise<void>;
}
