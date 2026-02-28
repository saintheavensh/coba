import { db } from "../../../../../shared/infrastructure/database/client";
import { serviceTypes } from "../schema/ServiceSchema";
import { IServiceTypeRepository } from "../../domain/repositories/service-type-repository.port";
import { eq } from "drizzle-orm";
import { DBContext } from "../../../../../shared/types/db-context";

export class DrizzleServiceTypeRepository implements IServiceTypeRepository {
    async findAll(categoryId?: string, dbOrTx: any = db): Promise<any[]> {
        let query = dbOrTx.select().from(serviceTypes);
        if (categoryId) {
            query = query.where(eq(serviceTypes.categoryId, categoryId)) as any;
        }
        return query;
    }
    async findById(id: string, dbOrTx: any = db): Promise<any | null> {
        const rows = await dbOrTx.select().from(serviceTypes).where(eq(serviceTypes.id, id));
        return rows[0] || null;
    }
    async create(data: { categoryId: string; name: string; weight: number; defaultPrice?: number; commissionPercent?: number; warrantyDays?: number; isActive?: boolean }, dbOrTx: any = db): Promise<{ id: string }> {
        const insertedData: any = { ...data };
        if (insertedData.commissionPercent !== undefined) {
            insertedData.commissionPercent = insertedData.commissionPercent !== null ? String(insertedData.commissionPercent) : null;
        }
        const rows = await dbOrTx.insert(serviceTypes).values(insertedData).returning({ id: serviceTypes.id });
        return { id: rows[0].id };
    }
    async update(id: string, data: Partial<{ name: string; weight: number; defaultPrice: number; commissionPercent: number; warrantyDays: number; isActive: boolean }>, dbOrTx: any = db): Promise<void> {
        const updateData: any = { ...data };
        if (updateData.commissionPercent !== undefined) {
            updateData.commissionPercent = updateData.commissionPercent !== null ? String(updateData.commissionPercent) : null;
        }
        await dbOrTx.update(serviceTypes).set(updateData).where(eq(serviceTypes.id, id));
    }
    async delete(id: string, dbOrTx: any = db): Promise<void> {
        await dbOrTx.delete(serviceTypes).where(eq(serviceTypes.id, id));
    }
}
