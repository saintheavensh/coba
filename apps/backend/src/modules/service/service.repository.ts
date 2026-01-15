import { db } from "../../db";
import { services, activityLogs } from "../../db/schema";
import { eq, desc, like, count } from "drizzle-orm";

export class ServiceRepository {
    async findAll(params: { status?: string } = {}) {
        const conditions = [];
        if (params.status) {
            conditions.push(eq(services.status, params.status as any));
        }

        return await db.query.services.findMany({
            where: conditions.length > 0 ? (
                conditions.length === 1 ? conditions[0] : undefined // Simple for now, import 'and' if multiple
            ) : undefined,
            orderBy: [desc(services.dateIn)],
            with: {
                technician: true
            }
        });
    }

    async findById(id: number) {
        return await db.query.services.findFirst({
            where: eq(services.id, id),
            with: {
                technician: true
            }
        });
    }

    async findLastServiceNo(prefix: string) {
        return await db.query.services.findFirst({
            where: like(services.no, `${prefix}%`),
            orderBy: [desc(services.id)]
        });
    }
    async getCountsByStatus() {
        return await db.select({
            status: services.status,
            count: count()
        })
            .from(services)
            .groupBy(services.status);
    }
}
