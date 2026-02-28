import { eq } from "drizzle-orm";
import { db } from "../../../../../shared/infrastructure/database/client";
import { serviceParts } from "../schema/ServiceSchema";
import { IServicePartRepository } from "../../domain/repositories/service-part-repository.port";

export class DrizzleServicePartRepository implements IServicePartRepository {
    async findByServiceItemId(serviceItemId: string, dbOrTx: any = db): Promise<any[]> {
        return dbOrTx.select().from(serviceParts).where(eq(serviceParts.serviceItemId, serviceItemId));
    }

    async findById(id: string, dbOrTx: any = db): Promise<any | null> {
        const rows = await dbOrTx.select().from(serviceParts).where(eq(serviceParts.id, id));
        return rows[0] || null;
    }

    async create(data: any, dbOrTx: any = db): Promise<{ id: string }> {
        const rows = await dbOrTx.insert(serviceParts).values(data).returning({ id: serviceParts.id });
        return { id: rows[0].id };
    }

    async delete(id: string, dbOrTx: any = db): Promise<void> {
        await dbOrTx.delete(serviceParts).where(eq(serviceParts.id, id));
    }
}
