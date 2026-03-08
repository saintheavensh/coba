import { db } from "../../../../db";
import { serviceCategories } from "../schema/ServiceSchema";
import { IServiceCategoryRepository } from "../../domain/repositories/service-category-repository.port";
import { eq } from "drizzle-orm";


export class DrizzleServiceCategoryRepository implements IServiceCategoryRepository {
    async findAll(dbOrTx: any = db): Promise<any[]> {
        return dbOrTx.select().from(serviceCategories);
    }
    async findById(id: string, dbOrTx: any = db): Promise<any | null> {
        const rows = await dbOrTx.select().from(serviceCategories).where(eq(serviceCategories.id, id));
        return rows[0] || null;
    }
    async create(data: { name: string; description?: string; minWeight?: number; maxWeight?: number }, dbOrTx: any = db): Promise<{ id: string }> {
        const rows = await dbOrTx.insert(serviceCategories).values(data).returning({ id: serviceCategories.id });
        return { id: rows[0].id };
    }
    async update(id: string, data: Partial<{ name: string; description: string; minWeight: number; maxWeight: number }>, dbOrTx: any = db): Promise<void> {
        await dbOrTx.update(serviceCategories).set(data).where(eq(serviceCategories.id, id));
    }
    async delete(id: string, dbOrTx: any = db): Promise<void> {
        await dbOrTx.delete(serviceCategories).where(eq(serviceCategories.id, id));
    }
}
