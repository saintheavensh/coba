import { db } from "../../../db";
import { settings, salePayments, saleItems, sales, purchaseReturnItems, purchaseReturns, purchaseItems, purchases, services, activityLogs, notifications, productBatches, productVariants, products, categories, suppliers, members } from "../../../db/schema";
import { eq } from "drizzle-orm";

export class SettingsModel {
    static async findByKey(key: string, dbOrTx: any = db) {
        return dbOrTx.query.settings.findFirst({
            where: eq(settings.key, key)
        });
    }

    static async upsert(key: string, value: any, dbOrTx: any = db) {
        const existing = await this.findByKey(key, dbOrTx);

        if (existing) {
            return dbOrTx.update(settings)
                .set({ value: value as any })
                .where(eq(settings.key, key));
        } else {
            return dbOrTx.insert(settings).values({
                key,
                value: value as any
            });
        }
    }

    static async factoryReset(mode: "data" | "full", dbOrTx: any = db) {
        if (mode === "data" || mode === "full") {
            // Delete in reverse order of dependencies
            await dbOrTx.delete(salePayments);
            await dbOrTx.delete(saleItems);
            await dbOrTx.delete(sales);

            await dbOrTx.delete(purchaseReturnItems);
            await dbOrTx.delete(purchaseReturns);

            await dbOrTx.delete(purchaseItems);
            await dbOrTx.delete(purchases);

            await dbOrTx.delete(services);

            await dbOrTx.delete(activityLogs);
            await dbOrTx.delete(notifications);

            if (mode === "full") {
                await dbOrTx.delete(productBatches);
                await dbOrTx.delete(productVariants);
                await dbOrTx.delete(products);
                await dbOrTx.delete(categories);
                await dbOrTx.delete(suppliers);
                await dbOrTx.delete(members);
            }
        }
    }
}
