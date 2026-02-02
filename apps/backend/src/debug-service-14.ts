
import { db } from "./db";
import { services, activityLogs } from "./db/schema";
import { eq, desc } from "drizzle-orm";
import { ServiceService } from "./modules/service/services/service.service";

async function main() {
    const id = 14;
    console.log(`🔍 Debugging Service ID: ${id}`);

    // 1. Fetch Service direct from DB
    const service = await db.query.services.findFirst({
        where: eq(services.id, id)
    });

    if (!service) {
        console.log("❌ Service not found");
        return;
    }

    console.log("Service found:", {
        id: service.id,
        no: service.no,
        status: service.status
    });

    // 2. Fetch Raw Logs (no join)
    const rawLogs = await db.select().from(activityLogs).where(eq(activityLogs.entityId, service.no));
    console.log(`\n📋 Raw Activity Logs count for '${service.no}': ${rawLogs.length}`);
    if (rawLogs.length > 0) {
        console.table(rawLogs.map(l => ({
            id: l.id,
            action: l.action,
            entityId: l.entityId,
            userId: l.userId
        })));
    } else {
        console.log("⚠️ No raw logs found!");
    }

    // 3. Test ServiceService.getById logic
    const srvService = new ServiceService();
    const result = await srvService.getById(id);

    console.log("\n🛠 ServiceService.getById Result:");
    console.log("Timeline entries:", result?.timeline?.length);
    if (result?.timeline?.length === 0) {
        console.log("Status Timeline:", result?.timeline);
    }

    process.exit(0);
}

main();
