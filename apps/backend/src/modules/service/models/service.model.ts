import { db } from "../../../db";
import { services, activityLogs } from "../../../db/schema";
import { eq, desc, like, count, and } from "drizzle-orm";

export class ServiceModel {
    async findAll(params: { status?: string; technicianId?: string } = {}, dbOrTx: any = db) {
        const conditions = [];

        if (params.status) {
            conditions.push(eq(services.status, params.status as any));
        }

        if (params.technicianId && params.technicianId !== 'all') {
            conditions.push(eq(services.technicianId, params.technicianId));
        }

        return await dbOrTx.query.services.findMany({
            where: conditions.length > 0 ? (
                conditions.length === 1 ? conditions[0] : and(...conditions)
            ) : undefined,
            orderBy: [desc(services.dateIn)],
            with: {
                technician: true
            }
        });
    }

    async findById(id: number, dbOrTx: any = db) {
        return await dbOrTx.query.services.findFirst({
            where: eq(services.id, id),
            with: {
                technician: true,
                creator: true,
            }
        });
    }

    async findLastServiceNo(prefix: string, dbOrTx: any = db) {
        return await dbOrTx.query.services.findFirst({
            where: like(services.no, `${prefix}%`),
            orderBy: [desc(services.id)]
        });
    }

    async getCountsByStatus(dbOrTx: any = db) {
        return await dbOrTx.select({
            status: services.status,
            count: count()
        })
            .from(services)
            .groupBy(services.status);
    }

    async getTechnicianStats(technicianId: string, start: Date, end: Date, dbOrTx: any = db) {
        const servicesData = await dbOrTx.query.services.findMany({
            where: (services: any, { and, eq, gte, lte }: any) => and(
                eq(services.technicianId, technicianId),
                gte(services.dateIn, start),
                lte(services.dateIn, end)
            )
        });

        return servicesData;
    }

    async getAdminStats(start: Date, end: Date, dbOrTx: any = db) {
        return await dbOrTx.query.services.findMany({
            where: (services: any, { and, gte, lte }: any) => and(
                gte(services.dateIn, start),
                lte(services.dateIn, end)
            )
        });
    }
}
