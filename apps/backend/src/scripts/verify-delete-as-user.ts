
import { db } from "../db";
import { assets, users, assetDepreciationLogs } from "../db/schema";
import { AssetsService } from "../modules/accounting/assets.service";

async function main() {
    console.log("Starting Asset Deletion with User ID...");

    // 1. Get a user
    const [user] = await db.select().from(users).limit(1);
    if (!user) {
        console.error("No users found to test with!");
        process.exit(1);
    }
    console.log(`Using user: ${user.name} (${user.id})`);

    // 2. Create asset
    const id = await AssetsService.create({
        name: "Delete Test Asset With User",
        category: "tool",
        purchaseDate: new Date(),
        purchaseCost: 1000000,
        salvageValue: 0,
        usefulLifeMonths: 12,
        notes: "To be deleted",
        sourceAccountId: "1-1000"
    }, user.id);
    console.log(`Created asset: ${id}`);

    // 2.5 Add logs
    await db.insert(assetDepreciationLogs).values({
        assetId: id,
        period: "2026-01",
        amount: 100000,
        valueAfter: 900000,
    });

    // 3. Delete
    try {
        console.log("Deleting...");
        await AssetsService.delete(id, user.id);
        console.log("Deletion SUCCESSFUL");
    } catch (e) {
        console.error("Deletion FAILED:", e);
    }
    process.exit(0);
}

main();
