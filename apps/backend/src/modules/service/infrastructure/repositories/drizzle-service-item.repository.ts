import { eq } from "drizzle-orm";
import { db } from "../../../../db";
import { serviceItems } from "../schema/ServiceSchema";
import { IServiceItemRepository } from "../../domain/repositories/service-item-repository.port";

export class DrizzleServiceItemRepository implements IServiceItemRepository {
    async findByServiceId(serviceId: string, dbOrTx: any = db): Promise<any[]> {
        return dbOrTx.select().from(serviceItems).where(eq(serviceItems.serviceId, serviceId));
    }

    async findById(id: string, dbOrTx: any = db): Promise<any | null> {
        const rows = await dbOrTx.select().from(serviceItems).where(eq(serviceItems.id, id));
        return rows[0] || null;
    }

    async create(data: any, dbOrTx: any = db): Promise<{ id: string }> {
        const rows = await dbOrTx.insert(serviceItems).values(data).returning({ id: serviceItems.id });
        return { id: rows[0].id };
    }

    async update(id: string, data: any, dbOrTx: any = db): Promise<void> {
        await dbOrTx.update(serviceItems).set(data).where(eq(serviceItems.id, id));
    }

    async delete(id: string, dbOrTx: any = db): Promise<void> {
        await dbOrTx.delete(serviceItems).where(eq(serviceItems.id, id));
    }
}
