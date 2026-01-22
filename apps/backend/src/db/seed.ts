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
    notifications,
    paymentMethods,
    paymentVariants,
    roles,
    devices,
    brands,
    productDeviceCompatibility,
    purchaseReturns,
    purchaseReturnItems,
    defectiveItems
} from "./schema";
import { eq, sql } from "drizzle-orm";

async function main() {
    console.log("🌱 Starting Database Rebuild & Seed...");

    // ============================================
    // 0. CLEANUP (Drop all data)
    // ============================================
    console.log("⚠️ Deleting existing data...");

    // Delete in reverse order of dependencies
    await db.delete(activityLogs);
    await db.delete(notifications);
    await db.delete(salePayments);
    await db.delete(saleItems);
    await db.delete(sales);
    await db.delete(purchaseItems);
    await db.delete(purchases);
    await db.delete(purchaseReturnItems);
    await db.delete(purchaseReturns);
    await db.delete(defectiveItems);
    await db.delete(services);
    await db.delete(productDeviceCompatibility);
    await db.delete(productBatches);
    await db.delete(products);
    await db.delete(categories);
    await db.delete(members);
    await db.delete(suppliers);
    await db.delete(paymentVariants);
    await db.delete(paymentMethods);
    await db.delete(devices);
    await db.delete(brands);
    await db.delete(users);
    await db.delete(roles);

    console.log("✅ Data cleared.");

    // ============================================
    // 1. CONSTANTS
    // ============================================
    const currentYear = new Date().getFullYear();
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);

    // USERS
    const adminId = "USR-ADMIN001";
    const teknisi1Id = "USR-TEKNIS01"; // Senior Tech
    const teknisi2Id = "USR-TEKNIS02"; // Junior Tech
    const kasirId = "USR-KASIR001";

    // CATEGORIES
    const catHp = "CAT-HP001";
    const catSparepart = "CAT-PART001";
    const catAcc = "CAT-ACC001";
    const catService = "CAT-SRV001";

    // SUPPLIERS
    const supGlobal = "SUP-GLOBAL01";
    const supLokal = "SUP-LOKAL01";

    // PRODUCTS
    const prdIphone13 = "PRD-IP13-001";
    const prdLcdIpX = "PRD-LCD-IPX";
    const prdBatreIpX = "PRD-BAT-IPX";
    const prdCaseClear = "PRD-CASE-001";
    const prdTempered = "PRD-TG-001";

    // BATCHES
    const bIphone13A = "B-IP13-A";
    const bLcdIpXA = "B-LCDX-A";
    const bBatreIpXA = "B-BATX-A";
    const bCaseA = "B-CASE-A";
    const bTgA = "B-TG-A";

    // ============================================
    // 2. ROLES & USERS
    // ============================================
    console.log("Creating roles and users...");

    await db.insert(roles).values([
        { id: "admin", name: "Administrator", permissions: ["*"] },
        { id: "teknisi", name: "Technician", permissions: ["service.view", "service.update", "service.create", "service.diagnose"] },
        { id: "kasir", name: "Cashier", permissions: ["pos.sales", "service.create", "service.payment"] }
    ]);

    const pw = await Bun.password.hash("123456"); // Default password

    await db.insert(users).values([
        { id: adminId, username: "admin", password: pw, name: "Super Admin", role: "admin", isActive: true },
        { id: teknisi1Id, username: "teknisi", password: pw, name: "Budi Teknisi", role: "teknisi", isActive: true },
        { id: teknisi2Id, username: "teknisi2", password: pw, name: "Adi Junior", role: "teknisi", isActive: true },
        { id: kasirId, username: "kasir", password: pw, name: "Siti Kasir", role: "kasir", isActive: true },
    ]);

    // ============================================
    // 3. MASTER DATA (Categories, Suppliers, Members)
    // ============================================
    console.log("Creating master data...");

    await db.insert(categories).values([
        { id: catHp, name: "Handphone", description: "Unit Handphone Baru/Second" },
        { id: catSparepart, name: "Sparepart", description: "LCD, Baterai, Flexibel" },
        { id: catAcc, name: "Aksesoris", description: "Case, Charger, Kabel" },
        { id: catService, name: "Jasa Service", description: "Biaya Jasa" },
    ]);

    await db.insert(suppliers).values([
        { id: supGlobal, name: "Global Sparepart Jakarta", contact: "Pak Haji", phone: "08123456789", address: "ITC Roxy Mas" },
        { id: supLokal, name: "Lokal Distributor", contact: "Ko Ayung", phone: "08987654321", address: "Bandung Electronic Center" },
    ]);

    await db.insert(members).values([
        { id: "MBR-001", name: "Johan Pelanggan", phone: "081111111", discountPercent: 0, points: 50 },
        { id: "MBR-002", name: "Sarah Member", phone: "082222222", discountPercent: 5, points: 200 },
    ]);

    // ============================================
    // 4. INVENTORY (Products & Batches)
    // ============================================
    console.log("Creating inventory...");

    await db.insert(products).values([
        { id: prdIphone13, code: "8990001", name: "iPhone 13 128GB Inter", categoryId: catHp, stock: 2, minStock: 1 },
        { id: prdLcdIpX, code: "SP-LCD-001", name: "LCD iPhone X OLED", categoryId: catSparepart, stock: 5, minStock: 2 },
        { id: prdBatreIpX, code: "SP-BAT-001", name: "Baterai iPhone X Vizz", categoryId: catSparepart, stock: 10, minStock: 3 },
        { id: prdCaseClear, code: "ACC-CASE-001", name: "Clear Case iPhone 13", categoryId: catAcc, stock: 20, minStock: 5 },
        { id: prdTempered, code: "ACC-TG-001", name: "Tempered Glass Universal", categoryId: catAcc, stock: 50, minStock: 10 },
    ]);

    // Batches linked to Suppliers
    const batchData = [
        { id: bIphone13A, productId: prdIphone13, supplierId: supGlobal, variant: "Inter Fullset", buyPrice: 8000000, sellPrice: 9500000, initialStock: 2, currentStock: 2 },
        { id: bLcdIpXA, productId: prdLcdIpX, supplierId: supGlobal, variant: "OLED Quality", buyPrice: 300000, sellPrice: 650000, initialStock: 5, currentStock: 5 },
        { id: bBatreIpXA, productId: prdBatreIpX, supplierId: supLokal, variant: "Vizz Double Power", buyPrice: 150000, sellPrice: 350000, initialStock: 10, currentStock: 10 },
        { id: bCaseA, productId: prdCaseClear, supplierId: supLokal, variant: "Clear", buyPrice: 10000, sellPrice: 50000, initialStock: 25, currentStock: 20 }, // 5 sold
        { id: bTgA, productId: prdTempered, supplierId: supLokal, variant: "Glass", buyPrice: 5000, sellPrice: 25000, initialStock: 100, currentStock: 50 }, // 50 sold
    ];

    await db.insert(productBatches).values(batchData);

    // Initial Purchase Entry (Stock In)
    const po1 = "PO-INIT-001";
    await db.insert(purchases).values({
        id: po1, supplierId: supGlobal, userId: adminId, totalAmount: 18000000, notes: "Initial stock import"
    });
    // Add items... (Skipping detailed purchase items for brevity, but batches reflect stock)

    // ============================================
    // 5. SERVICES (Detailed Scenarios)
    // ============================================
    console.log("Creating services...");

    const serviceData = [
        // 1. New Queue (Antrian)
        {
            no: `SRV-${currentYear}-001`,
            customer: { name: "Rudi H", phone: "08555123" },
            device: { brand: "Samsung", model: "Galaxy S21" },
            complaint: "Bootloop, stuck di logo",
            status: "antrian",
            createdBy: kasirId,
            dateIn: today,
        },
        // 2. Being Checked (Dicek) with Diagnosis
        {
            no: `SRV-${currentYear}-002`,
            customer: { name: "Siska P", phone: "08555456" },
            device: { brand: "Apple", model: "iPhone 11", equipment: "Unit only" },
            complaint: "Cepat panas dan boros baterai",
            diagnosis: "IC Charging bermasalah, perlu ganti IC",
            costEstimate: 450000,
            status: "konfirmasi",
            technicianId: teknisi1Id,
            createdBy: kasirId,
            dateIn: yesterday,
        },
        // 3. In Progress (Dikerjakan)
        {
            no: `SRV-${currentYear}-003`,
            customer: { name: "Doni", phone: "08555789" },
            device: { brand: "Xiaomi", model: "Redmi Note 10" },
            complaint: "LCD Retak",
            diagnosis: "Ganti LCD",
            costEstimate: 350000,
            status: "dikerjakan",
            technicianId: teknisi2Id,
            createdBy: kasirId,
            dateIn: lastWeek,
            parts: [{ name: "LCD Redmi Note 10", price: 200000, qty: 1 }],
        },
        // 4. Completed (Selesai) & Paid
        {
            no: `SRV-${currentYear}-004`,
            customer: { name: "Maria", phone: "08555999" },
            device: { brand: "Oppo", model: "Reno 4F" },
            complaint: "Ganti Baterai",
            diagnosis: "Baterai bocor",
            status: "selesai",
            technicianId: teknisi1Id,
            createdBy: kasirId,
            costEstimate: 200000,
            actualCost: 200000,
            dateIn: lastWeek,
            dateOut: yesterday,
            qc: { passed: true, notes: "Fungsi normal, pengisian daya oke" }
        },
        // 5. Cancelled (Batal)
        {
            no: `SRV-${currentYear}-005`,
            customer: { name: "Tono", phone: "08555000" },
            device: { brand: "Vivo", model: "Y12" },
            complaint: "Mati total kena air",
            diagnosis: "Mesin korosi parah",
            costEstimate: 800000, // Too expensive
            status: "batal",
            technicianId: teknisi1Id,
            createdBy: kasirId,
            dateIn: lastWeek,
            notes: "User menolak biaya perbaikan",
        }
    ];

    await db.insert(services).values(serviceData as any);

    // ============================================
    // 6. PAYMENT METHODS
    // ============================================
    console.log("Creating payment methods...");

    const pmCash = "PM-CASH";
    const pmTransfer = "PM-TRANSFER";
    const pmQris = "PM-QRIS";

    await db.insert(paymentMethods).values([
        { id: pmCash, name: "Tunai", type: "cash", icon: "💵" },
        { id: pmTransfer, name: "Transfer Bank", type: "transfer", icon: "🏦" },
        { id: pmQris, name: "QRIS", type: "qris", icon: "📱" },
    ]);

    await db.insert(paymentVariants).values([
        { id: "VAR-BCA", methodId: pmTransfer, name: "BCA", accountNumber: "1234567890", accountHolder: "Toko Service" },
        { id: "VAR-BRI", methodId: pmTransfer, name: "BRI", accountNumber: "0987654321", accountHolder: "Toko Service" },
    ]);

    // ============================================
    // 7. SALES (Transactions)
    // ============================================
    console.log("Creating sales records...");

    const sale1 = "SAL-001";
    await db.insert(sales).values({
        id: sale1, userId: kasirId, customerName: "Walk-in Guest", totalAmount: 50000, finalAmount: 50000, paymentMethod: "cash", paymentStatus: "paid"
    });

    await db.insert(saleItems).values([
        { saleId: sale1, productId: prdCaseClear, batchId: bCaseA, variant: "Clear", qty: 1, price: 50000, subtotal: 50000 }
    ]);

    // Add payment
    await db.insert(salePayments).values({
        saleId: sale1, amount: 50000, method: "Tunai", methodId: pmCash
    });


    console.log("\n✅ Database rebuild & seed complete!");
    console.log("IMPORTANT: Devices table was purposefully NOT seeded.");
    console.log("Users: admin (123456), teknisi (123456), kasir (123456)");
}

main().catch((e) => {
    console.error("❌ Seeding failed:");
    console.error(e);
    process.exit(1);
});
