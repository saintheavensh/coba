import { db } from "./db";
import { CategoryRepositoryAdapter } from "./modules/categories/infrastructure/repositories/category.repository.adapter";
import { DeviceRepositoryAdapter } from "./modules/devices/infrastructure/repositories/device.repository.adapter";

async function diagnose() {
    console.log("--- DIAGNOSING 500 ERRORS ---");

    try {
        console.log("Testing Categories.findAll()...");
        const categories = new CategoryRepositoryAdapter();
        const cats = await categories.findAll();
        console.log("SUCCESS: Categories retrieved, count:", cats.length);
    } catch (e: any) {
        console.error("FAILED Categories.findAll():", e.message);
        if (e.stack) console.error(e.stack);
    }

    try {
        console.log("\nTesting Devices.findAll()...");
        const devices = new DeviceRepositoryAdapter();
        const devs = await devices.findAll({});
        console.log("SUCCESS: Devices retrieved, count:", devs.length);
    } catch (e: any) {
        console.error("FAILED Devices.findAll():", e.message);
        if (e.stack) console.error(e.stack);
    }

    try {
        console.log("\nTesting DB connection directly...");
        const result = await db.execute("SELECT 1");
        console.log("SUCCESS: DB connection OK");
    } catch (e: any) {
        console.error("FAILED DB direct call:", e.message);
    }
}

diagnose();
