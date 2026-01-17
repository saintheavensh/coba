import { db } from "./index";
import {
    users,
    suppliers,
    categories,
    products,
    productBatches,
    members,
    purchases,
    purchaseItems,
    sales,
    saleItems,
    salePayments,
    services,
    activityLogs,
    paymentMethods,
    paymentVariants
} from "./schema";
import { eq, sql } from "drizzle-orm";

async function main() {
    console.log("🌱 Seeding database...\n");

    // ============================================
    // 0. DEFINITIONS & CONSTANTS
    // ============================================

    // Dates
    const currentYear = new Date().getFullYear();
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);
    const twoDaysAgo = new Date(today); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const d1 = new Date(today); d1.setDate(d1.getDate() - 1);
    const d2 = new Date(today); d2.setDate(d2.getDate() - 2);
    const d3 = new Date(today); d3.setDate(d3.getDate() - 3);
    const urgentDate = new Date(today); urgentDate.setDate(urgentDate.getDate() + 1);

    // IDs
    const adminId = "USR-ADMIN001";
    const teknisiId = "USR-TEKNIS01"; // Keep for compat
    const teknisi1Id = "USR-TEKNIS01";
    const teknisi2Id = "USR-TEKNIS02";
    const kasirId = "USR-KASIR001";

    const catHandphone = "CAT-HP000001";
    const catSparepart = "CAT-SPARE001";
    const catAccessory = "CAT-ACCES001";

    const sup1 = "SUP-MAKMUR01";
    const sup2 = "SUP-JAYA0001";
    const sup3 = "SUP-BERKAH01";

    const cust1 = "CUST-ANDI0001";
    const cust2 = "CUST-BUDI0001";
    const cust3 = "CUST-CITRA001";

    const prod1 = "PRD-IPHONE01";
    const prod2 = "PRD-SAMSUNG1";
    const prod3 = "PRD-LCDIP001";
    const prod4 = "PRD-BATTRE01";
    const prod5 = "PRD-CASE0001";

    const batch1 = "B-IP13ORI01";
    const batch2 = "B-IP13OEM01";
    const batch3 = "B-SAMS23O1";
    const batch4 = "B-LCDIP001";
    const batch5 = "B-BATIP001";
    const batch6 = "B-CASE0001";

    const po1 = "PO-00000001";
    const po2 = "PO-00000002";

    const sale1 = "SAL-0000001";
    const sale2 = "SAL-0000002";
    const sale3 = "SAL-0000003";
    const sale4 = "SAL-0000004";
    const sale5 = "SAL-0000005";

    const serviceNos = [
        `SRV-${currentYear}-001`,
        `SRV-${currentYear}-002`,
        `SRV-${currentYear}-003`,
        `SRV-${currentYear}-004`,
        `SRV-${currentYear}-005`
    ];

    // ============================================
    // 2. INSERT USERS & MASTERS
    // ============================================
    console.log("Creating users, categories, suppliers, customers...");
    const hashedAdminPassword = await Bun.password.hash("admin");
    const hashedTeknisiPassword = await Bun.password.hash("teknisi");
    const hashedKasirPassword = await Bun.password.hash("kasir");

    await db.insert(users).values([
        { id: adminId, username: "admin", password: hashedAdminPassword, name: "Administrator", role: "admin" },
        { id: teknisi1Id, username: "teknisi1", password: hashedTeknisiPassword, name: "Ahmad Teknisi", role: "teknisi" },
        { id: teknisi2Id, username: "teknisi2", password: hashedTeknisiPassword, name: "Budi Teknisi", role: "teknisi" },
        { id: kasirId, username: "kasir", password: hashedKasirPassword, name: "Siti Kasir", role: "kasir" }
    ]).onConflictDoNothing();

    // Force update passwords to ensure they correct if users already existed
    console.log("Ensuring passwords and usernames are up to date...");
    await db.update(users).set({ password: hashedAdminPassword }).where(eq(users.username, "admin"));

    // Fix: 'teknisi' might exist from old seed, rename it to 'teknisi1' if ID matches or just force update based on ID
    // Actually, let's update by ID to be safe if IDs are stable.
    await db.update(users).set({ username: "teknisi1", password: hashedTeknisiPassword }).where(eq(users.id, teknisi1Id));

    await db.update(users).set({ password: hashedTeknisiPassword }).where(eq(users.username, "teknisi2"));
    await db.update(users).set({ password: hashedKasirPassword }).where(eq(users.username, "kasir"));

    // ... (existing categories, suppliers, members, products, batches, purchases, sales)

    // ============================================
    // 6. SERVICES
    // ============================================
    console.log("Creating services...");
    await db.insert(services).values([
        // TEKNISI 1 DATA
        // 1. Finished (Success) - This Month
        {
            no: "SRV-TEST-001",
            customer: { name: "Cust T1 A", phone: "08111" },
            device: { brand: "iPhone", model: "X" },
            complaint: "LCD Pecah",
            status: "selesai",
            technicianId: teknisi1Id,
            createdBy: adminId,
            costEstimate: 1000000,
            actualCost: 1000000, // Profit (Service Fee embedded or calculated)
            dateIn: lastWeek,
            dateOut: today
            // Note: Service Fee isn't explicit in schema yet, usually calc from total - parts. 
            // For simple stats, we might sum actualCost or introduce serviceFee column properly later.
            // Current schema has costEstimate and actualCost.
        },
        // 2. Finished (Success) - This Month
        {
            no: "SRV-TEST-002",
            customer: { name: "Cust T1 B", phone: "08112" },
            device: { brand: "Samsung", model: "S20" },
            complaint: "Baterai Drop",
            status: "selesai",
            technicianId: teknisi1Id,
            createdBy: adminId,
            costEstimate: 500000,
            actualCost: 500000,
            dateIn: lastWeek,
            dateOut: today
        },
        // 3. Failed (Batal) - This Month
        {
            no: "SRV-TEST-003",
            customer: { name: "Cust T1 C", phone: "08113" },
            device: { brand: "Xiaomi", model: "Mi 10" },
            complaint: "Mati Total",
            status: "batal",
            technicianId: teknisi1Id,
            createdBy: adminId,
            costEstimate: 0,
            dateIn: twoDaysAgo
        },
        // 4. Active (Dikerjakan)
        {
            no: "SRV-TEST-004",
            customer: { name: "Cust T1 D", phone: "08114" },
            device: { brand: "Oppo", model: "Reno 5" },
            complaint: "Speaker Sember",
            status: "dikerjakan",
            technicianId: teknisi1Id,
            createdBy: kasirId,
            costEstimate: 300000,
            dateIn: today
        },

        // TEKNISI 2 DATA (Should be invisible to Teknisi 1)
        // 1. Finished
        {
            no: "SRV-TEST-011",
            customer: { name: "Cust T2 A", phone: "08221" },
            device: { brand: "Vivo", model: "V20" },
            complaint: "Lupa Pola",
            status: "selesai",
            technicianId: teknisi2Id,
            createdBy: kasirId,
            costEstimate: 150000,
            actualCost: 150000,
            dateIn: lastWeek
        },
        // 2. Active
        {
            no: "SRV-TEST-012",
            customer: { name: "Cust T2 B", phone: "08222" },
            device: { brand: "Realme", model: "8 Pro" },
            complaint: "Ganti Housing",
            status: "dikerjakan",
            technicianId: teknisi2Id,
            createdBy: adminId,
            costEstimate: 400000,
            dateIn: today
        },

        // UNASSIGNED / QUEUE
        {
            no: "SRV-TEST-099",
            customer: { name: "Cust Queue", phone: "08333" },
            device: { brand: "Nokia", model: "3310" },
            complaint: "Antik",
            status: "antrian",
            technicianId: null, // No tech yet
            createdBy: kasirId,
            dateIn: today
        }
    ]).onConflictDoNothing();

    // ============================================
    // 7. PAYMENT METHODS (NEW)
    // ============================================
    console.log("Creating payment methods & variants...");

    // Clear old payment methods/variants if any (handled in cleanup step?)
    // Need to clear variants first due to FK
    await db.delete(paymentVariants);
    await db.delete(paymentMethods);

    // Methods
    const pmCash = "PM-CASH";
    const pmTransfer = "PM-TRANSFER";
    const pmQris = "PM-QRIS";
    const pmTempo = "PM-TEMPO";

    await db.insert(paymentMethods).values([
        { id: pmCash, name: "Tunai (Cash)", type: "cash", icon: "💵", enabled: true },
        { id: pmTransfer, name: "Transfer Bank", type: "transfer", icon: "🏦", enabled: true },
        { id: pmQris, name: "QRIS", type: "qris", icon: "📱", enabled: true },
        { id: pmTempo, name: "Tempo / Utang", type: "custom", icon: "⏳", enabled: true }
    ]);

    // Variants (Banks for Transfer)
    await db.insert(paymentVariants).values([
        { id: "VAR-BCA", methodId: pmTransfer, name: "BCA", accountNumber: "1234567890", accountHolder: "Saint Heavens", enabled: true },
        { id: "VAR-MANDIRI", methodId: pmTransfer, name: "Mandiri", accountNumber: "1230009876543", accountHolder: "Saint Heavens", enabled: true },
        { id: "VAR-BRI", methodId: pmTransfer, name: "BRI", accountNumber: "0111-01-000111-30-1", accountHolder: "Saint Heavens", enabled: true },
        { id: "VAR-BSI", methodId: pmTransfer, name: "BSI", accountNumber: "7778889990", accountHolder: "Saint Heavens", enabled: true }
    ]);

    // ============================================
    // 8. ACTIVITY LOGS
    // ============================================
    console.log("Creating activity logs...");
    await db.insert(activityLogs).values([
        { userId: adminId, action: "CREATE", entityType: "user", entityId: teknisiId, description: "Created new technician user", createdAt: lastWeek },
        { userId: adminId, action: "CREATE", entityType: "product", entityId: prod1, description: "Added new product iPhone 13 Pro", createdAt: lastWeek },
        { userId: kasirId, action: "CREATE", entityType: "service", entityId: serviceNos[0], description: "Registered new service for iPhone 12 Pro Max", createdAt: lastWeek },
        { userId: teknisiId, action: "STATUS_CHANGE", entityType: "service", entityId: serviceNos[0], description: "Started working on service", createdAt: twoDaysAgo },
        { userId: kasirId, action: "CREATE", entityType: "sale", entityId: sale1, description: "New sale transaction #SAL-0000001", createdAt: today },
        { userId: adminId, action: "UPDATE", entityType: "service", entityId: serviceNos[2], description: "Updated cost estimate to 1,500,000", createdAt: today }
    ]);

    console.log("\n✅ Database seeded successfully with Dashboard Data!");
    console.log("=".repeat(50));
    console.log("Users: admin/admin, teknisi/teknisi, kasir/kasir");
    console.log("=".repeat(50));
}

main().catch(console.error);
