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
    defectiveItems,
    categoryVariants,
    productVariants
} from "./schema";
import { eq, sql } from "drizzle-orm";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

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
    await db.delete(productVariants);
    await db.delete(products);
    await db.delete(categoryVariants);
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
        { id: catSparepart, name: "Sparepart (Umum)", description: "Sparepart Umum" },
        { id: "CAT-LCD", name: "LCD", description: "Layar LCD/OLED", parentId: catSparepart },
        { id: "CAT-BAT", name: "Baterai", description: "Baterai HP", parentId: catSparepart },
        { id: catAcc, name: "Aksesoris", description: "Case, Charger, Kabel" },
        { id: catService, name: "Jasa Service", description: "Biaya Jasa" },
    ]);

    // Suppliers must come before categoryVariants due to FK constraint
    await db.insert(suppliers).values([
        { id: supGlobal, name: "Global Sparepart Jakarta", contact: "Pak Haji", phone: "08123456789", address: "ITC Roxy Mas" },
        { id: supLokal, name: "Lokal Distributor", contact: "Ko Ayung", phone: "08987654321", address: "Bandung Electronic Center" },
    ]);

    // Category Variants with Supplier
    await db.insert(categoryVariants).values([
        { categoryId: catHp, name: "Inter", supplierId: supGlobal },
        { categoryId: catHp, name: "iBox/Resmi", supplierId: supLokal },
        { categoryId: "CAT-LCD", name: "Original", supplierId: supGlobal },
        { categoryId: "CAT-LCD", name: "OLED", supplierId: supGlobal },
        { categoryId: "CAT-LCD", name: "Grade A", supplierId: supLokal },
        { categoryId: "CAT-BAT", name: "Original", supplierId: supGlobal },
        { categoryId: "CAT-BAT", name: "Double Power", supplierId: supLokal },
        { categoryId: catAcc, name: "Standard", supplierId: supLokal },
    ]);

    await db.insert(members).values([
        { id: "MBR-001", name: "Johan Pelanggan", phone: "081111111", discountPercent: 0, points: 50 },
        { id: "MBR-002", name: "Sarah Member", phone: "082222222", discountPercent: 5, points: 200 },
    ]);

    // ============================================
    // 3.5 DEVICES IMPORT (from Excel)
    // ============================================
    console.log("Importing devices from Excel...");
    const excelPath = path.resolve(process.cwd(), "../../devices_export.xlsx");

    let deviceIds: string[] = [];

    if (fs.existsSync(excelPath)) {
        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(`Found ${rows.length} devices in Excel.`);

        const brandSet = new Set<string>();
        const deviceDataForDb: any[] = [];
        const deviceIdMap = new Map<string, string>(); // name -> id

        for (const row of rows) {
            const brandName = (row.Brand || row.brand || "Unknown").trim();
            const modelName = (row.Model || row.model || "Unknown").trim();
            if (brandName === "Unknown" || modelName === "Unknown") continue;

            const normalizedBrand = brandName.charAt(0).toUpperCase() + brandName.slice(1).toLowerCase();
            brandSet.add(normalizedBrand);

            // Generate ID based on name to be deterministic if run multiple times? Or just random.
            // Let's use random but consistent for seed? 
            // Actually, uuid is fine.
            const devId = `DEV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            deviceDataForDb.push({
                id: devId,
                brand: normalizedBrand,
                model: modelName,
                series: row.Series || row.series,
                code: row.Code || row.code,
                image: row.Image || row.image,
                colors: (row.Colors || row.colors || "").split(",").map((c: string) => c.trim()).filter((c: any) => c),
                specs: row.Specs || row.specs,
                chipset: row.Chipset || row.chipset,
            });

            deviceIdMap.set(modelName, devId);
            deviceIds.push(devId);
        }

        // Insert Brands
        const brandValues = Array.from(brandSet).map(name => ({
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name: name
        }));

        // Upsert brands? Or just insert since we cleared.
        if (brandValues.length > 0) {
            await db.insert(brands).values(brandValues).onConflictDoNothing();
        }

        // Insert Devices (batching in chunks of 50 to be safe)
        const chunkSize = 50;
        for (let i = 0; i < deviceDataForDb.length; i += chunkSize) {
            const chunk = deviceDataForDb.slice(i, i + chunkSize);
            await db.insert(devices).values(chunk);
        }
        console.log(`✅ Imported ${deviceDataForDb.length} devices.`);

    } else {
        console.warn("⚠️ devices_export.xlsx not found at " + excelPath);
        // Fallback dummy devices
        await db.insert(brands).values([{ id: "samsung", name: "Samsung" }, { id: "apple", name: "Apple" }]);
        await db.insert(devices).values([
            { id: "DEV-DUMMY-1", brand: "Samsung", model: "Galaxy S24 Ultra" },
            { id: "DEV-DUMMY-2", brand: "Apple", model: "iPhone 15 Pro Max" }
        ]);
        deviceIds = ["DEV-DUMMY-1", "DEV-DUMMY-2"];
    }

    // ============================================
    // 4. INVENTORY (Products & Batches)
    // ============================================
    console.log("Creating inventory...");

    await db.insert(products).values([
        { id: prdIphone13, code: "8990001", name: "iPhone 13 128GB", categoryId: catHp, stock: 2, minStock: 1 },
        { id: prdLcdIpX, code: "SP-LCD-001", name: "iPhone X", categoryId: "CAT-LCD", stock: 5, minStock: 2 },
        { id: prdBatreIpX, code: "SP-BAT-001", name: "iPhone X", categoryId: "CAT-BAT", stock: 10, minStock: 3 },
        { id: prdCaseClear, code: "ACC-CASE-001", name: "iPhone 13", categoryId: catAcc, stock: 20, minStock: 5 },
        { id: prdTempered, code: "ACC-TG-001", name: "Universal", categoryId: catAcc, stock: 50, minStock: 10 },
    ]);

    // Product Variants - MUST match Category Variant template names exactly!
    // Category: Handphone -> Inter (Global), iBox/Resmi (Lokal)
    // Category: LCD -> Original (Global), OLED (Global), Grade A (Lokal)
    // Category: Baterai -> Original (Global), Double Power (Lokal)
    // Category: Aksesoris -> Standard (Lokal)

    const varIp13Inter = "VAR-IP13-INTER";
    const varIp13Ibox = "VAR-IP13-IBOX";
    const varLcdOriginal = "VAR-LCD-ORI";
    const varLcdOled = "VAR-LCD-OLED";
    const varBatreOriginal = "VAR-BAT-ORI";
    const varBatreDouble = "VAR-BAT-DBL";
    const varAccStandard = "VAR-ACC-STD";

    await db.insert(productVariants).values([
        // iPhone 13 variants
        { id: varIp13Inter, productId: prdIphone13, name: "Inter" },
        { id: varIp13Ibox, productId: prdIphone13, name: "iBox/Resmi" },
        // LCD iPhone X variants
        { id: varLcdOriginal, productId: prdLcdIpX, name: "Original" },
        { id: varLcdOled, productId: prdLcdIpX, name: "OLED" },
        // Baterai iPhone X variants
        { id: varBatreOriginal, productId: prdBatreIpX, name: "Original" },
        { id: varBatreDouble, productId: prdBatreIpX, name: "Double Power" },
        // Accessory variants
        { id: varAccStandard, productId: prdCaseClear, name: "Standard" },
    ]);

    // Batches linked to Suppliers AND Variants
    // Each batch is linked to the CORRECT supplier per category variant rules
    const batchData = [
        // iPhone 13 from Global (Inter variant)
        { id: bIphone13A, productId: prdIphone13, variantId: varIp13Inter, supplierId: supGlobal, variant: "Inter", buyPrice: 8000000, sellPrice: 9500000, initialStock: 2, currentStock: 2 },
        // LCD iPhone X OLED from Global
        { id: bLcdIpXA, productId: prdLcdIpX, variantId: varLcdOled, supplierId: supGlobal, variant: "OLED", buyPrice: 300000, sellPrice: 650000, initialStock: 5, currentStock: 5 },
        // Baterai iPhone X Double Power from Lokal
        { id: bBatreIpXA, productId: prdBatreIpX, variantId: varBatreDouble, supplierId: supLokal, variant: "Double Power", buyPrice: 150000, sellPrice: 350000, initialStock: 10, currentStock: 10 },
        // Clear Case from Lokal (Standard)
        { id: bCaseA, productId: prdCaseClear, variantId: varAccStandard, supplierId: supLokal, variant: "Standard", buyPrice: 10000, sellPrice: 50000, initialStock: 25, currentStock: 20 },
        // Tempered Glass (no variant in Standard for this one, but we link to Standard anyway)
        { id: bTgA, productId: prdTempered, variantId: null, supplierId: supLokal, variant: "Standard", buyPrice: 5000, sellPrice: 25000, initialStock: 100, currentStock: 50 },
    ];

    await db.insert(productBatches).values(batchData);

    // ============================================
    // Purchase Records (Stock In) - MUST match batches
    // ============================================
    console.log("Creating purchase records...");

    // Purchase 1: Global Sparepart Jakarta
    const po1 = "PO-2024-001";
    const po1Total = (8000000 * 2) + (300000 * 5); // iPhone + LCD
    await db.insert(purchases).values({
        id: po1,
        supplierId: supGlobal,
        userId: adminId,
        totalAmount: po1Total,
        notes: "Stok awal HP dan LCD dari Global"
    });

    // Purchase Items for PO1
    await db.insert(purchaseItems).values([
        { purchaseId: po1, productId: prdIphone13, variant: "Inter", batchId: bIphone13A, qtyOrdered: 2, qtyReceived: 2, buyPrice: 8000000, sellPrice: 9500000 },
        { purchaseId: po1, productId: prdLcdIpX, variant: "OLED", batchId: bLcdIpXA, qtyOrdered: 5, qtyReceived: 5, buyPrice: 300000, sellPrice: 650000 },
    ]);

    // Purchase 2: Lokal Distributor
    const po2 = "PO-2024-002";
    const po2Total = (150000 * 10) + (10000 * 25) + (5000 * 100); // Baterai + Case + TG
    await db.insert(purchases).values({
        id: po2,
        supplierId: supLokal,
        userId: adminId,
        totalAmount: po2Total,
        notes: "Stok awal Baterai dan Aksesoris dari Lokal"
    });

    // Purchase Items for PO2
    await db.insert(purchaseItems).values([
        { purchaseId: po2, productId: prdBatreIpX, variant: "Double Power", batchId: bBatreIpXA, qtyOrdered: 10, qtyReceived: 10, buyPrice: 150000, sellPrice: 350000 },
        { purchaseId: po2, productId: prdCaseClear, variant: "Standard", batchId: bCaseA, qtyOrdered: 25, qtyReceived: 25, buyPrice: 10000, sellPrice: 50000 },
        { purchaseId: po2, productId: prdTempered, variant: "Standard", batchId: bTgA, qtyOrdered: 100, qtyReceived: 100, buyPrice: 5000, sellPrice: 25000 },
    ]);

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


    console.log("\n✅ Database rebuild & seed complete with Devices!");
    // console.log("IMPORTANT: Devices table was purposefully NOT seeded."); // Removed warning
    console.log("Users: admin (123456), teknisi (123456), kasir (123456)");
}

main().catch((e) => {
    console.error("❌ Seeding failed:");
    console.error(e);
    process.exit(1);
});
