
import { db } from "../db";
import { assets } from "../db/schema";

async function main() {
    console.log("Listing all assets...");
    const allAssets = await db.select().from(assets);
    console.log(`Total Assets: ${allAssets.length}`);
    allAssets.forEach(a => {
        console.log(`- ${a.id}: ${a.name} (${a.status})`);
    });

    // Check for AST-0011 specifically
    const target = allAssets.find(a => a.id === 'AST-0011');
    if (target) {
        console.log("AST-0011 FOUND.");
    } else {
        console.log("AST-0011 NOT FOUND.");
    }
    process.exit(0);
}

main();
