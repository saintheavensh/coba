import { eq, desc, like, count, and } from "drizzle-orm";
import { DBContext } from "../../../../shared/types/db-context";
import { db } from "../../../../db";
import { services, activityLogs, users } from "../../../../db/schema";
import { IServiceRepository, ServiceTicket } from "../../domain";

export class ServiceRepositoryAdapter implements IServiceRepository {
    async findAll(params: { status?: string; technicianId?: string } = {}, dbOrTx?: DBContext): Promise<ServiceTicket[]> {
        const client = (dbOrTx as any) || db;
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
                technician: true
            }
        });

        return results as ServiceTicket[];
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<ServiceTicket | null> {
        const client = (dbOrTx as any) || db;
        const result = await client.query.services.findFirst({
            where: eq(services.id, id),
            with: {
                technician: true,
                creator: true,
            }
        });

        return result ? (result as ServiceTicket) : null;
    }

    async findLastServiceNo(prefix: string, dbOrTx?: DBContext): Promise<{ no: string } | null> {
        const client = (dbOrTx as any) || db;
        const result = await client.query.services.findFirst({
            where: like(services.no, `${prefix}%`),
            orderBy: [desc(services.id)]
        });
        return result ? { no: result.no } : null;
    }

    async getCountsByStatus(dbOrTx?: DBContext): Promise<Array<{ status: string; count: number }>> {
        const client = (dbOrTx as any) || db;
        const results = await client.select({
            status: services.status,
            count: count()
        })
            .from(services)
            .groupBy(services.status);
        return results;
    }

    async getTechnicianStats(technicianId: string, start: Date, end: Date, dbOrTx?: DBContext): Promise<ServiceTicket[]> {
        const client = (dbOrTx as any) || db;
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
        const client = (dbOrTx as any) || db;
        const result = await client.insert(services).values(data).returning({ id: services.id });
        return { id: result[0].id };
    }

    async update(id: string, data: any, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.update(services).set(data).where(eq(services.id, id));
    }

    async delete(id: string, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        const srv = await this.findById(id, dbOrTx);
        if (!srv) return;

        await client.delete(activityLogs).where(eq(activityLogs.entityId, srv.no));
        await client.delete(services).where(eq(services.id, id));
    }

    async logActivity(params: any, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.insert(activityLogs).values({
            ...params,
            oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
            newValue: params.newValue ? JSON.stringify(params.newValue) : null,
        });
    }

    async getTimeline(entityId: string, dbOrTx?: DBContext): Promise<any[]> {
        const client = (dbOrTx as any) || db;
        const logs = await client.select({
            log: activityLogs,
            userName: users.name
        })
            .from(activityLogs)
            .leftJoin(users, eq(activityLogs.userId, users.id))
            .where(eq(activityLogs.entityId, entityId))
            .orderBy(desc(activityLogs.createdAt));

        return logs.map(({ log, userName }: any) => {
            let event = log.description || log.action;
            let details: any = {};

            if (log.action === 'CREATE') {
                event = 'Service Dibuat';
                try {
                    const data = JSON.parse(log.newValue as string || '{}');
                    details = {
                        customer: data.customer?.name,
                        phone: data.unit ? `${data.unit.brand} ${data.unit.model}` : null,
                        complaint: data.complaint,
                        technician: data.technicianId ? 'Assigned' : 'Belum ditugaskan',
                        isWalkin: data.isWalkin ? 'Walk-in' : 'Regular'
                    };
                } catch { }
            } else if (log.action === 'STATUS_CHANGE') {
                try {
                    const oldVal = JSON.parse(log.oldValue as string || '{}');
                    const newVal = JSON.parse(log.newValue as string || '{}');
                    event = `Status: ${oldVal.status || '-'} → ${newVal.status}`;
                    details = { from: oldVal.status, to: newVal.status };
                } catch {
                    event = log.description || 'Status changed';
                }
            } else if (log.action === 'ASSIGN') {
                event = 'Teknisi Ditugaskan';
            } else if (log.action === 'UPDATE') {
                event = 'Data Diperbarui';
            }

            return {
                event,
                by: userName || 'System',
                time: log.createdAt?.toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) || "-",
                action: log.action,
                details
            };
        });
    }
}
