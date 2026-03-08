import { eq } from "drizzle-orm";
import { db } from "../../../../db";
import {
    settings, salePayments, saleItems, sales,
    purchaseReturnItems, purchaseReturns, purchaseItems,
    purchases, services, activityLogs, notifications,
    productBatches, productVariants, products,
    categories, suppliers, members
} from "../../../../db/schema";
import { DBContext } from "../../../../shared/types/db-context";
import { ISettingsRepository, Setting } from "../../domain";

export class SettingsRepositoryAdapter implements ISettingsRepository {
    async findByKey(key: string, dbOrTx?: DBContext): Promise<Setting | null> {
        const client = dbOrTx || db;
        const result = await client.query.settings.findFirst({
            where: eq(settings.key, key)
        });
        return (result as Setting) || null;
    }

    async upsert(key: string, value: any, dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || db;
        const existing = await this.findByKey(key, client);

        if (existing) {
            await client.update(settings)
                .set({ value })
                .where(eq(settings.key, key));
        } else {
            await client.insert(settings).values({
                key,
                value
            });
        }
    }

    async factoryReset(mode: "data" | "full", dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || db;
        if (mode === "data" || mode === "full") {
            // Delete in reverse order of dependencies
            await client.delete(salePayments);
            await client.delete(saleItems);
            await client.delete(sales);

            await client.delete(purchaseReturnItems);
            await client.delete(purchaseReturns);

            await client.delete(purchaseItems);
            await client.delete(purchases);

            await client.delete(services);

            await client.delete(activityLogs);
            await client.delete(notifications);

            if (mode === "full") {
                await client.delete(productBatches);
                await client.delete(productVariants);
                await client.delete(products);
                await client.delete(categories);
                await client.delete(suppliers);
                await client.delete(members);
            }
        }
    }
}
