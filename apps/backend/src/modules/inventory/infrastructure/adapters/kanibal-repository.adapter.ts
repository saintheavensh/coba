import { eq, desc } from "drizzle-orm";
import { db } from "../../../../db";
import { DBContext } from "../../../../shared/types/db-context";
import { forfeitedDevices, partHarvestLogs } from "../schema/GamblingSchema";
import { IKanibalRepository, ForfeitedDevice, PartHarvestLog, ForfeitedDeviceStatus } from "../../domain/repositories/kanibal-repository.port";

export class KanibalRepositoryAdapter implements IKanibalRepository {
    async saveForfeitedDevice(device: Partial<ForfeitedDevice>, dbOrTx?: DBContext): Promise<ForfeitedDevice> {
        const client = dbOrTx || db;
        const [result] = await client.insert(forfeitedDevices).values(device as any).returning();
        return result as any;
    }

    async saveHarvestLog(log: Partial<PartHarvestLog>, dbOrTx?: DBContext): Promise<PartHarvestLog> {
        const client = dbOrTx || db;
        const [result] = await client.insert(partHarvestLogs).values(log as any).returning();
        return result as any;
    }

    async findForfeitedDevices(_filters?: any, dbOrTx?: DBContext): Promise<ForfeitedDevice[]> {
        const client = dbOrTx || db;
        return await client.query.forfeitedDevices.findMany({
            orderBy: [desc(forfeitedDevices.forfeitedDate)]
        }) as any[];
    }

    async findForfeitedDeviceById(id: string, dbOrTx?: DBContext): Promise<ForfeitedDevice | null> {
        const client = dbOrTx || db;
        const result = await client.query.forfeitedDevices.findFirst({
            where: eq(forfeitedDevices.id, id)
        });
        return (result as any) || null;
    }

    async updateForfeitedStatus(id: string, status: ForfeitedDeviceStatus, dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || db;
        await client.update(forfeitedDevices)
            .set({ status })
            .where(eq(forfeitedDevices.id, id));
    }
}
