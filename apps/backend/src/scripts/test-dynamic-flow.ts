import { NotificationService } from "../lib/notification.service";

async function testDynamicFlow() {
    console.log("🚀 Starting Dynamic Notification Flow Test...");

    // Simulate Case 1: Cashier assigns a Technician
    console.log("\n--- Case 1: Technician Assignment ---");
    console.log("🔔 Sending 'Tugas Baru' to Technician (user-admin-001)...");
    await NotificationService.technicianAssigned(
        "user-admin-001",
        "SRV-20260202-001",
        "10"
    );
    console.log("✅ Assignment notification sent.");

    // Simulate Case 2: Technician updates status for Cashier
    console.log("\n--- Case 2: Status Update for Cashier ---");
    console.log("🔔 Sending 'Status Servis Berubah' to Cashier (user-admin-001)...");
    // In this test we use the same user ID to simplify verification in one window
    await NotificationService.serviceStatusChanged(
        "user-admin-001",
        "SRV-20260202-001",
        "selesai",
        "10"
    );
    console.log("✅ Status update notification sent.");

    console.log("\n🏁 Test complete! Check your frontend for Success (Green) and Info (Blue) toasts.");
}

testDynamicFlow().catch(console.error);
