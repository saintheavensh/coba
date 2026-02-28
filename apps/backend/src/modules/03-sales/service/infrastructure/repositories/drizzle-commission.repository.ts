import { ICommissionSettingsRepository, ICommissionRepository } from "../../domain/repositories/commission-repository.port";
import { technicianCommissionSettings, technicianCommissions } from "../schema/ServiceSchema";
import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "../../../../../shared/infrastructure/database/client";

export class DrizzleCommissionSettingsRepository implements ICommissionSettingsRepository {
    async findByTechnicianId(technicianId: string): Promise<any | null> {
        const rows = await db.select()
            .from(technicianCommissionSettings)
            .where(eq(technicianCommissionSettings.technicianId, technicianId));
        return rows[0] || null;
    }

    async upsert(data: any): Promise<void> {
        const existing = await this.findByTechnicianId(data.technicianId);
        if (existing) {
            await db.update(technicianCommissionSettings)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(technicianCommissionSettings.technicianId, data.technicianId));
        } else {
            await db.insert(technicianCommissionSettings).values(data);
        }
    }
}

export class DrizzleCommissionRepository implements ICommissionRepository {
    async create(data: any): Promise<{ id: string }> {
        const rows = await db.insert(technicianCommissions).values(data).returning({ id: technicianCommissions.id });
        return { id: rows[0].id };
    }

    async findByTechnicianId(technicianId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
        let conditions = [eq(technicianCommissions.technicianId, technicianId)];

        if (startDate) conditions.push(gte(technicianCommissions.createdAt, startDate));
        if (endDate) conditions.push(lte(technicianCommissions.createdAt, endDate));

        const result = await db.select().from(technicianCommissions).where(and(...conditions));
        return result;
    }

    async markAsPaid(ids: string[]): Promise<void> {
        for (const id of ids) {
            await db.update(technicianCommissions)
                .set({ paid: true, paidAt: new Date() })
                .where(eq(technicianCommissions.id, id));
        }
    }
}
