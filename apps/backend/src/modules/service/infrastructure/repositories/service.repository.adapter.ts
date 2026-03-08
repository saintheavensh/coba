import { eq, desc, like, count, and } from "drizzle-orm";
import { DBContext } from "../../../../shared/types/db-context";
import { db } from "../../../../db";
import { services, activityLogs, users } from "../../../../db/schema";
import { IServiceRepository, ServiceTicket } from "../../domain";
import { ServiceTimelineRowDTO } from "../../../../shared/dtos/repositories/service/ServiceTimelineDTO";

export class ServiceRepositoryAdapter implements IServiceRepository {
    async findAll(params: { status?: string | undefined; technicianId?: string | undefined } = {}, dbOrTx?: DBContext): Promise<ServiceTicket[]> {
        const client = dbOrTx || db;
        const conditions = [];

        if (params.status) {
            conditions.push(eq(services.status, params.status as any));
        }

        if (params.technicianId && params.technicianId !== 'all') {
            conditions.push(eq(services.technicianId, params.technicianId));
        }

        const results = await client.query.services.findMany({
            where: conditions.length > 0 ? (
                conditions.length === 1 ? conditions[0] : and(...conditions)
            ) : undefined,
            orderBy: [desc(services.dateIn)],
            with: {
                technician: true,
                items: {
                    with: {
                        parts: true,
                        serviceType: true,
                        technician: true
                    }
                }
            }
        });

        return results as ServiceTicket[];
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<ServiceTicket | null> {
        const client = dbOrTx || db;
        const result = await client.query.services.findFirst({
            where: eq(services.id, id),
            with: {
                technician: true,
                creator: true,
                items: {
                    with: {
                        parts: {
                            with: { variantBatch: true }
                        },
                        serviceType: true,
                        technician: true
                    }
                }
            }
        });

        return result ? (result as ServiceTicket) : null;
    }

    async findLastServiceNo(prefix: string, dbOrTx?: DBContext): Promise<{ no: string } | null> {
        const client = dbOrTx || db;
        const result = await client.query.services.findFirst({
            where: like(services.no, `${prefix}%`),
            orderBy: [desc(services.id)]
        });
        return result ? { no: result.no } : null;
    }

    async getCountsByStatus(dbOrTx?: DBContext): Promise<Array<{ status: string; count: number }>> {
        const client = dbOrTx || db;
        const results = await client.select({
            status: services.status,
            count: count()
        })
            .from(services)
            .groupBy(services.status);
        return results.map(r => ({
            status: r.status || "antrian",
            count: Number(r.count)
        }));
    }

    async getTechnicianStats(technicianId: string, start: Date, end: Date, dbOrTx?: DBContext): Promise<ServiceTicket[]> {
        const client = dbOrTx || db;
        const results = await client.query.services.findMany({
            where: (services: any, { and, eq, gte, lte }: any) => and(
                eq(services.technicianId, technicianId),
                gte(services.dateIn, start),
                lte(services.dateIn, end)
            )
        });
        return results as ServiceTicket[];
    }

    async create(data: any, dbOrTx?: DBContext): Promise<{ id: string }> {
        const client = dbOrTx || db;
        const result = await client.insert(services).values(data).returning({ id: services.id });
        if (!result[0]) throw new Error("Failed to create service");
        return { id: result[0].id };
    }

    async update(id: string, data: any, dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || db;
        await client.update(services).set(data).where(eq(services.id, id));
    }

    async delete(id: string, dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || db;
        const srv = await this.findById(id, dbOrTx);
        if (!srv) return;

        await client.delete(activityLogs).where(eq(activityLogs.entityId, srv.no));
        await client.delete(services).where(eq(services.id, id));
    }

    async logActivity(params: any, dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || db;
        await client.insert(activityLogs).values({
            ...params,
            oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
            newValue: params.newValue ? JSON.stringify(params.newValue) : null,
        });
    }

    async getTimeline(entityId: string, dbOrTx?: DBContext): Promise<ServiceTimelineRowDTO[]> {
        const client = dbOrTx || db;
        const results = await client.select({
            id: activityLogs.id,
            action: activityLogs.action,
            description: activityLogs.description,
            entityId: activityLogs.entityId,
            entityType: activityLogs.entityType,
            oldValue: activityLogs.oldValue,
            newValue: activityLogs.newValue,
            createdAt: activityLogs.createdAt,
            userName: users.name
        })
            .from(activityLogs)
            .leftJoin(users, eq(activityLogs.userId, users.id))
            .where(eq(activityLogs.entityId, entityId))
            .orderBy(desc(activityLogs.createdAt));

        return results.map((r: any) => ({
            id: r.id,
            action: r.action,
            description: r.description,
            entityId: r.entityId,
            entityType: r.entityType,
            oldValue: r.oldValue,
            newValue: r.newValue,
            createdAt: r.createdAt,
            userName: r.userName
        }));
    }
}
