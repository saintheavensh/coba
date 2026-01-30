
import { db } from "../db";
import { assets, journals, journalLines } from "../db/schema";
import { AssetsService } from "../modules/accounting/assets.service";
import { eq, and } from "drizzle-orm";

async function main() {
    console.log("Starting Full Asset Deletion Verification...");
    try {
        // 1. Create asset
        const id = await AssetsService.create({
            name: "Final Clear Test Asset",
            category: "tool",
            purchaseDate: new Date(),
            purchaseCost: 2500000,
            salvageValue: 0,
            usefulLifeMonths: 24,
            notes: "Testing journals cleanup",
            sourceAccountId: "1-1001" // Kas Toko
        });
        console.log(`Asset created: ${id}`);

        // 2. Verify journal exists
        const [purchaseJournal] = await db.select().from(journals).where(
            and(
                eq(journals.referenceId, id),
                eq(journals.referenceType, "asset_purchase")
            )
        );

        if (purchaseJournal) {
            console.log(`Found purchase journal: ${purchaseJournal.id}`);
        } else {
            throw new Error("Purchase journal NOT found!");
        }

        // 3. Delete asset
        console.log("Deleting asset (and its journals)...");
        await AssetsService.delete(id);

        // 4. Verify journals are gone
        const remainingJournals = await db.select().from(journals).where(
            eq(journals.referenceId, id)
        );

        if (remainingJournals.length === 0) {
            console.log("SUCCESS: Associated journals were deleted.");
        } else {
            console.error(`FAILURE: ${remainingJournals.length} journals still exist!`);
        }

        // 5. Verify asset is gone
        const [remainingAsset] = await db.select().from(assets).where(eq(assets.id, id));
        if (!remainingAsset) {
            console.log("SUCCESS: Asset record was deleted.");
        } else {
            console.error("FAILURE: Asset record still exists!");
        }

    } catch (error) {
        console.error("Verification FAILED:", error);
    } finally {
        process.exit(0);
    }
}

main();
