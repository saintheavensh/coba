import { eq, desc } from "drizzle-orm";
import { DBContext } from "../../../../../shared/types/db-context";
import { db } from "../../../../../shared/infrastructure/database/client";
import { serviceTools, serviceToolRequests } from "../../../../../shared/infrastructure/database/schema";
import { IServiceToolRepository, ServiceTool, ServiceToolRequest } from "../../domain";

export class ServiceToolRepositoryAdapter implements IServiceToolRepository {
    async findAll(dbOrTx?: DBContext): Promise<ServiceTool[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.select().from(serviceTools).orderBy(desc(serviceTools.createdAt));
        return results as ServiceTool[];
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<ServiceTool | null> {
        const client = (dbOrTx as any) || db;
        const results = await client.select().from(serviceTools).where(eq(serviceTools.id, id));
        return results[0] ? (results[0] as ServiceTool) : null;
    }

    async findByUserId(userId: string, dbOrTx?: DBContext): Promise<ServiceTool[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.select().from(serviceTools).where(eq(serviceTools.userId, userId)).orderBy(desc(serviceTools.createdAt));
        return results as ServiceTool[];
    }

    async findLast(dbOrTx?: DBContext): Promise<ServiceTool | null> {
        const client = (dbOrTx as any) || db;
        const results = await client.select().from(serviceTools).orderBy(desc(serviceTools.id)).limit(1);
        return results[0] ? (results[0] as ServiceTool) : null;
    }

    async create(data: any, dbOrTx?: DBContext): Promise<ServiceTool> {
        const client = (dbOrTx as any) || db;
        const result = await client.insert(serviceTools).values(data).returning();
        return result[0] as ServiceTool;
    }

    async update(id: string, data: any, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.update(serviceTools).set(data).where(eq(serviceTools.id, id));
    }

    async delete(id: string, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.delete(serviceTools).where(eq(serviceTools.id, id));
    }

    // Tool Requests
    async findAllRequests(dbOrTx?: DBContext): Promise<ServiceToolRequest[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.select().from(serviceToolRequests).orderBy(desc(serviceToolRequests.createdAt));
        return results as ServiceToolRequest[];
    }

    async findRequestsByUserId(userId: string, dbOrTx?: DBContext): Promise<ServiceToolRequest[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.select().from(serviceToolRequests).where(eq(serviceToolRequests.userId, userId)).orderBy(desc(serviceToolRequests.createdAt));
        return results as ServiceToolRequest[];
    }

    async createRequest(data: any, dbOrTx?: DBContext): Promise<ServiceToolRequest> {
        const client = (dbOrTx as any) || db;
        const result = await client.insert(serviceToolRequests).values(data).returning();
        return result[0] as ServiceToolRequest;
    }

    async updateRequestStatus(id: string, status: string, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.update(serviceToolRequests).set({ status: status as any }).where(eq(serviceToolRequests.id, id));
    }
}
