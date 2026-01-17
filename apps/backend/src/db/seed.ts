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
    const teknisiId = "USR-TEKNIS01";
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
    // 1. CLEANUP (DELETE OLD DATA)
    // ============================================
    console.log("🧹 Cleaning up old data to prevent duplicates...");

    // Purchases
    await db.delete(purchaseItems).where(sql`${purchaseItems.purchaseId} IN (${po1}, ${po2})`);
    await db.delete(purchases).where(sql`${purchases.id} IN (${po1}, ${po2})`);

    // Sales
    const allSaleIds = [sale1, sale2, sale3, sale4, sale5];
    // Need to handle list for IN clause, manually building string or looping?
    // Drizzle's 'inArray' is better but we imported 'eq'. Let's use 'sql' with spread?
    // Or just loop delete for simplicity in seed script.
    for (const sid of allSaleIds) {
        await db.delete(saleItems).where(eq(saleItems.saleId, sid));
        await db.delete(salePayments).where(eq(salePayments.saleId, sid));
        await db.delete(sales).where(eq(sales.id, sid));
    }

    // Services
    for (const sno of serviceNos) {
        await db.delete(services).where(eq(services.no, sno));
    }

    // Activity Logs - Optional cleanup (truncate recent?)
    // leaving logs for now

    // ============================================
    // 2. INSERT USERS & MASTERS
    // ============================================
    console.log("Creating users, categories, suppliers, customers...");
    const hashedAdminPassword = await Bun.password.hash("admin");
    const hashedTeknisiPassword = await Bun.password.hash("teknisi");
    const hashedKasirPassword = await Bun.password.hash("kasir");

    await db.insert(users).values([
        { id: adminId, username: "admin", password: hashedAdminPassword, name: "Administrator", role: "admin" },
        { id: teknisiId, username: "teknisi", password: hashedTeknisiPassword, name: "Ahmad Teknisi", role: "teknisi" },
        { id: kasirId, username: "kasir", password: hashedKasirPassword, name: "Siti Kasir", role: "kasir" }
    ]).onConflictDoNothing();

    await db.insert(categories).values([
        { id: catHandphone, name: "Handphone", description: "Smartphone dan Tablet" },
        { id: catSparepart, name: "Sparepart", description: "LCD, Baterai, Fleksibel, dll" },
        { id: catAccessory, name: "Aksesoris", description: "Case, Tempered Glass, Charger" }
    ]).onConflictDoNothing();

    await db.insert(suppliers).values([
        { id: sup1, name: "CV. Makmur Jaya", contact: "Budi", phone: "08123456789", address: "Jakarta Pusat" },
        { id: sup2, name: "PT. Jaya Elektronik", contact: "Dewi", phone: "08234567890", address: "Bandung" },
        { id: sup3, name: "UD. Berkah Selalu", contact: "Rudi", phone: "08345678901", address: "Surabaya" }
    ]).onConflictDoNothing();

    await db.insert(members).values([
        { id: cust1, name: "Andi Wijaya", phone: "081111111111", email: "andi@email.com", creditLimit: 5000000, debt: 0, points: 100, discountPercent: 5 },
        { id: cust2, name: "Budi Santoso", phone: "082222222222", email: "budi@email.com", creditLimit: 3000000, debt: 500000, points: 50, discountPercent: 0 },
        { id: cust3, name: "Citra Dewi", phone: "083333333333", email: "citra@email.com", creditLimit: 10000000, debt: 0, points: 200, discountPercent: 10 }
    ]).onConflictDoNothing();

    await db.insert(products).values([
        { id: prod1, code: "IP13PRO", name: "iPhone 13 Pro", categoryId: catHandphone, stock: 6, minStock: 2 },
        { id: prod2, code: "SAMS23U", name: "Samsung Galaxy S23 Ultra", categoryId: catHandphone, stock: 4, minStock: 2 },
        { id: prod3, code: "LCDIP13", name: "LCD iPhone 13 Pro", categoryId: catSparepart, stock: 8, minStock: 5 },
        { id: prod4, code: "BATIP13", name: "Baterai iPhone 13 Pro", categoryId: catSparepart, stock: 15, minStock: 10 },
        { id: prod5, code: "CASEIP13", name: "Case iPhone 13 Pro", categoryId: catAccessory, stock: 45, minStock: 20 }
    ]).onConflictDoUpdate({ target: products.id, set: { stock: sql`excluded.stock` } });

    // ============================================
    // 3. PRODUCT BATCHES
    // ============================================
    console.log("Creating product batches...");
    await db.insert(productBatches).values([
        { id: batch1, productId: prod1, supplierId: sup1, variant: "Original 128GB", supplierName: "CV. Makmur Jaya", buyPrice: 15000000, sellPrice: 17000000, initialStock: 5, currentStock: 3 },
        { id: batch2, productId: prod1, supplierId: sup2, variant: "Inter 256GB", supplierName: "PT. Jaya Elektronik", buyPrice: 16000000, sellPrice: 18000000, initialStock: 3, currentStock: 3 },
        { id: batch3, productId: prod2, supplierId: sup1, variant: "SEIN 256GB", supplierName: "CV. Makmur Jaya", buyPrice: 12000000, sellPrice: 14000000, initialStock: 4, currentStock: 4 },
        { id: batch4, productId: prod3, supplierId: sup3, variant: "Original", supplierName: "UD. Berkah Selalu", buyPrice: 1500000, sellPrice: 2000000, initialStock: 10, currentStock: 8 },
        { id: batch5, productId: prod4, supplierId: sup3, variant: "OEM", supplierName: "UD. Berkah Selalu", buyPrice: 150000, sellPrice: 250000, initialStock: 20, currentStock: 15 },
        { id: batch6, productId: prod5, supplierId: sup2, variant: "Soft Case Black", supplierName: "PT. Jaya Elektronik", buyPrice: 25000, sellPrice: 50000, initialStock: 50, currentStock: 45 }
    ]).onConflictDoNothing();

    // ============================================
    // 4. PURCHASES
    // ============================================
    console.log("Creating purchases...");
    await db.insert(purchases).values([
        { id: po1, supplierId: sup1, userId: adminId, totalAmount: 123000000, notes: "Pembelian awal iPhone & Samsung" },
        { id: po2, supplierId: sup3, userId: adminId, totalAmount: 18000000, notes: "Restok sparepart LCD & Baterai" }
    ]);

    await db.insert(purchaseItems).values([
        { purchaseId: po1, productId: prod1, variant: "Original 128GB", qtyOrdered: 5, qtyReceived: 5, buyPrice: 15000000, sellPrice: 17000000, batchId: batch1 },
        { purchaseId: po1, productId: prod2, variant: "SEIN 256GB", qtyOrdered: 4, qtyReceived: 4, buyPrice: 12000000, sellPrice: 14000000, batchId: batch3 },
        { purchaseId: po2, productId: prod3, variant: "Original", qtyOrdered: 10, qtyReceived: 10, buyPrice: 1500000, sellPrice: 2000000, batchId: batch4 },
        { purchaseId: po2, productId: prod4, variant: "OEM", qtyOrdered: 20, qtyReceived: 20, buyPrice: 150000, sellPrice: 250000, batchId: batch5 }
    ]);

    // ============================================
    // 5. SALES
    // ============================================
    console.log("Creating sales...");
    await db.insert(sales).values([
        { id: sale1, memberId: cust1, customerName: "Andi Wijaya", totalAmount: 17000000, discountAmount: 850000, finalAmount: 16150000, paymentMethod: "cash", paymentStatus: "paid", userId: kasirId, notes: "Pembelian iPhone" },
        { id: sale2, memberId: cust2, customerName: "Budi Santoso", totalAmount: 250000, discountAmount: 0, finalAmount: 250000, paymentMethod: "mixed", paymentStatus: "unpaid", userId: kasirId, notes: "Beli baterai - tempo" },
        { id: sale3, memberId: cust3, customerName: "Citra Dewi", totalAmount: 500000, finalAmount: 500000, paymentMethod: "qris", userId: kasirId, createdAt: d1 },
        { id: sale4, memberId: cust1, customerName: "Andi Wijaya", totalAmount: 150000, finalAmount: 150000, paymentMethod: "cash", userId: kasirId, createdAt: d2 },
        { id: sale5, memberId: cust2, customerName: "Budi Santoso", totalAmount: 2000000, finalAmount: 2000000, paymentMethod: "transfer", userId: adminId, createdAt: d3 }
    ]);

    await db.insert(salePayments).values([
        { saleId: sale1, method: "cash", amount: 16150000 },
        { saleId: sale2, method: "tempo", amount: 250000 }
    ]);

    await db.insert(saleItems).values([
        { saleId: sale1, productId: prod1, batchId: batch1, variant: "Original 128GB", qty: 1, price: 17000000, subtotal: 17000000 },
        { saleId: sale2, productId: prod4, batchId: batch5, variant: "OEM", qty: 1, price: 250000, subtotal: 250000 },
        { saleId: sale3, productId: prod5, batchId: batch6, variant: "Soft Case", qty: 2, price: 50000, subtotal: 100000 },
        { saleId: sale4, productId: prod4, batchId: batch5, variant: "OEM", qty: 1, price: 150000, subtotal: 150000 },
        { saleId: sale5, productId: prod3, batchId: batch4, variant: "Original", qty: 1, price: 2000000, subtotal: 2000000 }
    ]);

    // ============================================
    // 6. SERVICES
    // ============================================
    console.log("Creating services...");
    await db.insert(services).values([
        {
            no: serviceNos[0],
            customer: { name: "Doni Prasetyo", phone: "084444444444", address: "Jl. Merdeka No. 10" },
            device: { brand: "iPhone", model: "iPhone 12 Pro Max", imei: "123456789012345", equipment: "Unit + Charger" },
            complaint: "Layar retak dan baterai boros",
            diagnosis: "LCD pecah, baterai 70%",
            status: "dikerjakan",
            technicianId: teknisiId,
            createdBy: adminId,
            costEstimate: 2000000,
            dateIn: lastWeek,
            estimatedCompletionDate: urgentDate
        },
        {
            no: serviceNos[1],
            customer: { name: "Eka Putri", phone: "085555555555" },
            device: { brand: "Samsung", model: "Galaxy A54", equipment: "Unit saja" },
            complaint: "Tidak bisa charge",
            status: "antrian",
            createdBy: kasirId,
            costEstimate: 350000,
            dateIn: yesterday
        },
        {
            no: serviceNos[2],
            customer: { name: "Fajar Rahman", phone: "086666666666", address: "Jl. Asia Afrika No. 20" },
            device: { brand: "Xiaomi", model: "Redmi Note 12", imei: "987654321098765" },
            complaint: "Mati total setelah jatuh ke air",
            diagnosis: "Mesin korosi, kemungkinan ganti mesin",
            status: "konfirmasi",
            technicianId: teknisiId,
            createdBy: adminId,
            costEstimate: 1500000,
            dateIn: twoDaysAgo
        },
        {
            no: serviceNos[3],
            customer: { name: "Gita Gutawa", phone: "087777777777" },
            device: { brand: "Oppo", model: "Reno 8", equipment: "Unit + Dus" },
            complaint: "Bootloop",
            status: "selesai",
            technicianId: teknisiId,
            createdBy: adminId,
            costEstimate: 500000,
            actualCost: 500000,
            dateIn: lastWeek,
            dateOut: yesterday
        },
        {
            no: serviceNos[4],
            customer: { name: "Heri Poter", phone: "088888888888" },
            device: { brand: "Realme", model: "GT Neo 3", equipment: "Unit" },
            complaint: "Ganti Baterai",
            status: "diambil",
            technicianId: teknisiId,
            createdBy: kasirId,
            costEstimate: 300000,
            actualCost: 300000,
            dateIn: lastWeek,
            dateOut: today
        }
    ]);

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
