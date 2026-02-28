import { eq, desc, inArray } from "drizzle-orm";
import { DBContext } from "../../../../../shared/types/db-context";
import { db } from "../../../../../shared/infrastructure/database/client";
import { defectiveItems } from "../../../../../shared/infrastructure/database/schema";
import { IDefectiveItemRepository, DefectiveItem, DefectiveItemStatus } from "../../domain";

export class DefectiveItemRepositoryAdapter implements IDefectiveItemRepository {
    async findAll(status?: DefectiveItemStatus, dbOrTx?: DBContext): Promise<DefectiveItem[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.query.defectiveItems.findMany({
            where: status ? eq(defectiveItems.status, status) : undefined,
            with: {
                product: true,
                batch: {
                    with: {
                        supplier: true
                    }
                },
                supplier: true
            },
            orderBy: [desc(defectiveItems.createdAt)]
        });
        return results as DefectiveItem[];
    }

    async findByIds(ids: string[], dbOrTx?: DBContext): Promise<DefectiveItem[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.query.defectiveItems.findMany({
            where: inArray(defectiveItems.id, ids),
            with: {
                batch: true
            }
        });
        return results as DefectiveItem[];
    }

    async create(data: any, dbOrTx?: DBContext): Promise<DefectiveItem> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.insert(defectiveItems).values(data).returning();
        return result as DefectiveItem;
    }

    async updateStatus(ids: string[], status: DefectiveItemStatus, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.update(defectiveItems)
            .set({ status })
            .where(inArray(defectiveItems.id, ids));
    }
}
