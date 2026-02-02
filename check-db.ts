
import { db } from "./apps/backend/src/db";
import { sql } from "drizzle-orm";

async function checkTable(tableName: string) {
    try {
        const res = await db.execute(sql.raw(`SELECT count(*) FROM ${tableName}`));
        return res.rows[0].count;
    } catch (e) {
        return "ERROR";
    }
}

async function test() {
    const tables = [
        "products", "product_batches", "product_variants", "categories",
        "members", "sales", "sale_items", "sale_payments",
        "services", "users", "roles", "settings", "accounts",
        "journals", "journal_lines"
    ];

    console.log("Database Table Counts:");
    for (const table of tables) {
        const count = await checkTable(table);
        console.log(`${table.padEnd(20)}: ${count}`);
    }

    process.exit(0);
}

test();
