import { eq, desc } from "drizzle-orm";
import { DBContext } from "../../../../../shared/types/db-context";
import { db } from "../../../../../shared/infrastructure/database/client";
import { purchaseReturns, purchaseReturnItems } from "../../../../../shared/infrastructure/database/schema";
import { IPurchaseReturnRepository, PurchaseReturn, PurchaseReturnItem } from "../../domain";

export class PurchaseReturnRepositoryAdapter implements IPurchaseReturnRepository {
    async findAll(dbOrTx?: DBContext): Promise<PurchaseReturn[]> {
        const client = (dbOrTx as any) || db;
        return await client.query.purchaseReturns.findMany({
            with: {
                supplier: true,
                user: true,
                items: {
                    with: {
                        product: true
                    }
                }
            },
            orderBy: [desc(purchaseReturns.date)]
        }) as PurchaseReturn[];
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<PurchaseReturn | null> {
        const client = (dbOrTx as any) || db;
        const result = await client.query.purchaseReturns.findFirst({
            where: eq(purchaseReturns.id, id),
            with: {
                supplier: true,
                user: true,
                items: {
                    with: {
                        product: true,
                        batch: true
                    }
                }
            }
        });
        return (result as PurchaseReturn) || null;
    }

    async create(data: Omit<PurchaseReturn, 'items' | 'createdAt'>, dbOrTx?: DBContext): Promise<PurchaseReturn> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.insert(purchaseReturns).values(data).returning();
        return result as PurchaseReturn;
    }

    async createItems(items: Omit<PurchaseReturnItem, 'id' | 'createdAt'>[], dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.insert(purchaseReturnItems).values(items);
    }
}
