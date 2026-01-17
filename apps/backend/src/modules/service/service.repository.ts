import { db } from "../../db";
import { services, activityLogs } from "../../db/schema";
import { eq, desc, like, count, and } from "drizzle-orm";

export class ServiceRepository {
    async findAll(params: { status?: string; technicianId?: string } = {}) {
        const conditions = [];

        if (params.status) {
            conditions.push(eq(services.status, params.status as any));
        }

        if (params.technicianId && params.technicianId !== 'all') {
            conditions.push(eq(services.technicianId, params.technicianId));
        }

        return await db.query.services.findMany({
            where: conditions.length > 0 ? (
                conditions.length === 1 ? conditions[0] : and(...conditions)
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
                technician: true,
                creator: true,
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

    async getStats(params: { technicianId?: string; startDate?: Date; endDate?: Date }) {
        const conditions = [];
        if (params.technicianId) {
            conditions.push(eq(services.technicianId, params.technicianId));
        }
        // Date range filter not strictly enforced in prompt but good for "This Month"
        // Since we need "This Month", we should filter by dateIn or dateOut.
        // Usually stats are based on creation date or completion date.
        // Let's assume based on dateIn for "Total Service" and dateOut/status update for "Profit".
        // For simplicity, let's just filter by dateIn for everything for now, or fetch all and filter in service logic if complex.
        // But Repo should handle basic filtering.
        // Actually, let's keep it simple: "Total Service This Month" -> dateIn this month.
        // "Profit This Month" -> dateOut this month AND status = selesai.

        // Return raw data or aggregated? 
        // Let's return sufficient data to aggregate in Service.
        // Or create specific aggregation queries methods.

        // Method 1: Get Profit (Sum actualCost where status=selesai and technician=id and dateOut in range)
        // Method 2: Get Counts (Count where technician=id and dateIn in range)
    }

    async getTechnicianStats(technicianId: string, start: Date, end: Date) {
        const servicesData = await db.query.services.findMany({
            where: (services, { and, eq, gte, lte }) => and(
                eq(services.technicianId, technicianId),
                gte(services.dateIn, start),
                lte(services.dateIn, end) // For "Total Service This Month"
            )
        });

        // For Profit (Selesai in range), we might need another query or just filter in memory if result set is small.
        // Let's do in-memory since per-tech per-moth volume is manageable.
        return servicesData;
    }

    async getAdminStats(start: Date, end: Date) {
        return await db.query.services.findMany({
            where: (services, { and, gte, lte }) => and(
                gte(services.dateIn, start),
                lte(services.dateIn, end)
            )
        });
    }
}
