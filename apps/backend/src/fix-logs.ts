
import { db } from "./db";
import { services, activityLogs } from "./db/schema";
import { eq, isNull } from "drizzle-orm";

async function main() {
    console.log("🛠 Handling missing activity logs...");

    // Get all services
    const allServices = await db.select().from(services);

    for (const srv of allServices) {
        // Check if logs exist
        const logs = await db.select().from(activityLogs).where(eq(activityLogs.entityId, srv.no));

        if (logs.length === 0) {
            console.log(`Adding logs for ${srv.no} (${srv.status})...`);

            // 1. Create Log
            await db.insert(activityLogs).values({
                userId: srv.createdBy || "USR-ADMIN",
                action: "CREATE",
                entityType: "service",
                entityId: srv.no,
                description: `New Service ${srv.no} created for ${srv.customer.name}`,
                newValue: JSON.stringify({
                    customer: srv.customer,
                    unit: srv.device,
                    complaint: srv.complaint,
                    isWalkin: false
                }),
                createdAt: srv.dateIn || new Date()
            });

            // 2. Status Log (if not antrian)
            if (srv.status !== "antrian") {
                await db.insert(activityLogs).values({
                    userId: srv.technicianId || "USR-ADMIN",
                    action: "STATUS_CHANGE",
                    entityType: "service",
                    entityId: srv.no,
                    description: `Service status updated to ${srv.status}`,
                    oldValue: JSON.stringify({ status: "antrian" }),
                    newValue: JSON.stringify({ status: srv.status }),
                    createdAt: srv.dateOut || new Date()
                });
            }
        }
    }

    console.log("✅ Backfill complete.");
    process.exit(0);
}

main();
