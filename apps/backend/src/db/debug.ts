import { db } from "./index";
import { products, categories } from "./schema";

async function main() {
    console.log("🔍 Checking Categories...");
    try {
        const cats = await db.query.categories.findMany();
        console.log("✅ Categories:", cats);
    } catch (e) {
        console.error("❌ Failed to query categories:", e);
    }

    console.log("🔍 Checking Inventory with Relations...");
    try {
        const prods = await db.query.products.findMany({
            with: {
                category: true,
                batches: true
            }
        });
        console.log("✅ Products:", JSON.stringify(prods, null, 2));
    } catch (e) {
        console.error("❌ Failed to query products:", e);
    }
}

main();
