import { eq, desc } from "drizzle-orm";
import { db } from "../../../../db";
import { forfeitedDevices, partHarvestLogs } from "../schema/GamblingSchema";
import { IKanibalRepository, ForfeitedDevice, PartHarvestLog, ForfeitedDeviceStatus } from "../../domain/repositories/kanibal-repository.port";

export class KanibalRepositoryAdapter implements IKanibalRepository {
    async saveForfeitedDevice(device: Partial<ForfeitedDevice>): Promise<ForfeitedDevice> {
        const [result] = await db.insert(forfeitedDevices).values(device as any).returning();
        return result as any;
    }

    async saveHarvestLog(log: Partial<PartHarvestLog>): Promise<PartHarvestLog> {
        const [result] = await db.insert(partHarvestLogs).values(log as any).returning();
        return result as any;
    }

    async findForfeitedDevices(filters?: any): Promise<ForfeitedDevice[]> {
        return await db.query.forfeitedDevices.findMany({
            orderBy: [desc(forfeitedDevices.forfeitedDate)]
        }) as any[];
    }

    async findForfeitedDeviceById(id: string): Promise<ForfeitedDevice | null> {
        const result = await db.query.forfeitedDevices.findFirst({
            where: eq(forfeitedDevices.id, id)
        });
        return (result as any) || null;
    }

    async updateForfeitedStatus(id: string, status: ForfeitedDeviceStatus): Promise<void> {
        await db.update(forfeitedDevices)
            .set({ status })
            .where(eq(forfeitedDevices.id, id));
    }
}
