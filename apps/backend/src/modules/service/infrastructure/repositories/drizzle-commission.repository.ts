import { DBContext } from "../../../../shared/types/db-context";
import { db } from "../../../../db";
import { ICommissionSettingsRepository, ICommissionRepository } from "../../domain/repositories/commission-repository.port";
import { technicianCommissionSettings, technicianCommissions } from "../schema/ServiceSchema";
import { eq, and, gte, lte } from "drizzle-orm";

export class DrizzleCommissionSettingsRepository implements ICommissionSettingsRepository {
    async findByTechnicianId(technicianId: string, dbOrTx?: DBContext): Promise<any | null> {
        const client = dbOrTx || db;
        const rows = await client.select()
            .from(technicianCommissionSettings)
            .where(eq(technicianCommissionSettings.technicianId, technicianId));
        return rows[0] || null;
    }

    async upsert(data: any, dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || db;
        const existing = await this.findByTechnicianId(data.technicianId, dbOrTx);
        if (existing) {
            await client.update(technicianCommissionSettings)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(technicianCommissionSettings.technicianId, data.technicianId));
        } else {
            await client.insert(technicianCommissionSettings).values(data);
        }
    }
}

export class DrizzleCommissionRepository implements ICommissionRepository {
    async create(data: any, dbOrTx?: DBContext): Promise<{ id: string }> {
        const client = dbOrTx || db;
        const rows = await client.insert(technicianCommissions).values(data).returning({ id: technicianCommissions.id });
        const firstRow = rows[0];
        if (!firstRow) throw new Error("Failed to create commission record");
        return { id: firstRow.id };
    }

    async findByTechnicianId(technicianId: string, startDate?: Date, endDate?: Date, dbOrTx?: DBContext): Promise<any[]> {
        const client = dbOrTx || db;
        let conditions = [eq(technicianCommissions.technicianId, technicianId)];

        if (startDate) conditions.push(gte(technicianCommissions.createdAt, startDate));
        if (endDate) conditions.push(lte(technicianCommissions.createdAt, endDate));

        const result = await client.select().from(technicianCommissions).where(and(...conditions));
        return result;
    }

    async markAsPaid(ids: string[], dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || db;
        for (const id of ids) {
            await client.update(technicianCommissions)
                .set({ paid: true, paidAt: new Date() })
                .where(eq(technicianCommissions.id, id));
        }
    }
}
