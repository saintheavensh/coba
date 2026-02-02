
import { SettingsModel } from "./apps/backend/src/modules/settings/models/settings.model";
import { db } from "./apps/backend/src/db";

async function test() {
    console.log("Testing SettingsModel...");
    try {
        const result = await SettingsModel.findByKey("store_info");
        console.log("Result:", result);
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

test();
