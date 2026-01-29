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
    productVariants,
    settings,
    operationalCosts,
    stockOpnameItems,
    stockOpnameSessions,
    serviceTools
} from "./schema";
import { eq, sql } from "drizzle-orm";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("🌱 Starting Comprehensive Database Seed...");

    // ============================================
    // 0. CLEANUP (Drop all data)
    // ============================================
    console.log("⚠️ Deleting existing data...");

    // Delete in reverse order of dependencies
    await db.delete(activityLogs);
    await db.delete(notifications);
    await db.delete(stockOpnameItems);
    await db.delete(stockOpnameSessions);
    await db.delete(serviceTools); // Assets
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
    await db.delete(operationalCosts);
    await db.delete(settings);
    await db.delete(users);
    await db.delete(roles);

    console.log("✅ Data cleared.");

    // ============================================
    // 1. HELPERS & CONSTANTS
    // ============================================
    const getPastDate = (daysAgo: number) => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        return d;
    };

    const currentYear = new Date().getFullYear();

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
    const prdLcd13Pro = "PRD-LCD-13PRO";
    const prdCaseClear = "PRD-CASE-001";
    const prdTempered = "PRD-TG-001";

    // BATCHES
    const bIphone13A = "B-IP13-A";
    const bLcdIpXA = "B-LCDX-A";
    const bBatreIpXA = "B-BATX-A";
    const bLcd13ProA = "B-LCD13PRO-A";
    const bCaseA = "B-CASE-A";
    const bTgA = "B-TG-A";

    // ============================================
    // 2. SETTINGS (New Feature Config)
    // ============================================
    console.log("Configuring application settings...");
    await db.insert(settings).values([
        {
            key: "store",
            value: {
                name: "iFix Store & Service",
                address: "Jl. Teknologi No. 88, Jakarta Digital Valley",
                phone: "0812-3456-7890",
                website: "www.ifixstore.com",
            }
        },
        {
            key: "service",
            value: {
                commissionModel: "completion", // Owner Risk Model
                enableVirtualArchive: true,
                autoCloseAfterDays: 30, // Shortened for demo (default 60)
                enableLiquidation: true,
                archiveExclusions: ["dikerjakan", "konfirmasi"],
                warrantyPresets: [
                    { label: "7 Hari", value: "7_days" },
                    { label: "14 Hari", value: "14_days" },
                    { label: "30 Hari", value: "30_days" },
                    { label: "90 Hari", value: "90_days" }
                ],
                defaultWarranty: "30_days"
            }
        }
    ]);

    // ============================================
    // 3. ROLES & USERS
    // ============================================
    console.log("Creating roles and users...");

    await db.insert(roles).values([
        { id: "admin", name: "Administrator", permissions: ["*"] },
        { id: "teknisi", name: "Technician", permissions: ["service.view", "service.update", "service.create", "service.diagnose"] },
        { id: "kasir", name: "Cashier", permissions: ["pos.sales", "service.create", "service.payment"] }
    ]);

    const pw = await Bun.password.hash("123456");

    await db.insert(users).values([
        { id: adminId, username: "admin", password: pw, name: "Super Admin", role: "admin", isActive: true },
        { id: teknisi1Id, username: "teknisi", password: pw, name: "Budi Teknisi", role: "teknisi", isActive: true },
        { id: teknisi2Id, username: "teknisi2", password: pw, name: "Adi Junior", role: "teknisi", isActive: true },
        { id: kasirId, username: "kasir", password: pw, name: "Siti Kasir", role: "kasir", isActive: true },
    ]);

    // ============================================
    // 4. MASTER DATA
    // ============================================
    console.log("Creating master data...");

    await db.insert(categories).values([
        { id: catHp, name: "Handphone", description: "Unit Handphone Baru/Second" },
        { id: catSparepart, name: "Sparepart", description: "Sparepart Umum" },
        { id: "CAT-LCD", name: "LCD", description: "Layar LCD/OLED", parentId: catSparepart },
        { id: "CAT-BAT", name: "Baterai", description: "Baterai HP", parentId: catSparepart },
        { id: catAcc, name: "Aksesoris", description: "Case, Charger, Kabel" },
        { id: catService, name: "Jasa Service", description: "Biaya Jasa" },
    ]);

    await db.insert(suppliers).values([
        { id: supGlobal, name: "Global Sparepart Jakarta", contact: "Pak Haji", phone: "08123456789", address: "ITC Roxy Mas" },
        { id: supLokal, name: "Lokal Distributor", contact: "Ko Ayung", phone: "08987654321", address: "Bandung Electronic Center" },
    ]);

    await db.insert(categoryVariants).values([
        { categoryId: "CAT-LCD", name: "Original", supplierId: supGlobal },
        { categoryId: "CAT-LCD", name: "OLED", supplierId: supGlobal },
        { categoryId: "CAT-BAT", name: "Original", supplierId: supGlobal },
        { categoryId: "CAT-BAT", name: "Double Power", supplierId: supLokal },
        { categoryId: catAcc, name: "Standard", supplierId: supLokal },
    ]);

    await db.insert(members).values([
        { id: "MBR-001", name: "Johan Pelanggan", phone: "081111111", discountPercent: 0, points: 50 },
        { id: "MBR-002", name: "Sarah Member", phone: "082222222", discountPercent: 5, points: 200 },
    ]);

    // ============================================
    // 5. DEVICES IMPORT (from Excel)
    // ============================================
    console.log("Importing devices from Excel...");
    const excelPath = path.resolve(process.cwd(), "../../devices_export.xlsx");
    let deviceIds: string[] = [];

    // Map to store device ID by model for compatibility linking later
    // Format: model.toLowerCase() -> deviceId
    const deviceModelMap = new Map<string, string>();

    // Fallback devices if Excel fails/missing
    const fallbackDevices = [
        { id: "DEV-IP13PROMAX", brand: "Apple", model: "iPhone 13 Pro Max" },
        { id: "DEV-IP11", brand: "Apple", model: "iPhone 11" },
        { id: "DEV-IPX", brand: "Apple", model: "iPhone X" },
        { id: "DEV-SAM-S21", brand: "Samsung", model: "Galaxy S21" },
        { id: "DEV-SAM-J5", brand: "Samsung", model: "Galaxy J5" },
        { id: "DEV-XIA-RED5A", brand: "Xiaomi", model: "Redmi 5A" }
    ];

    if (fs.existsSync(excelPath)) {
        try {
            const workbook = XLSX.readFile(excelPath);
            const sheetName = workbook.SheetNames[0];
            const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

            console.log(`Found ${rows.length} devices in Excel.`);

            const brandSet = new Set<string>();
            const deviceDataForDb: any[] = [];

            for (const row of rows) {
                const brandName = (row.Brand || row.brand || "Unknown").trim();
                const modelName = (row.Model || row.model || "Unknown").trim();
                if (brandName === "Unknown" || modelName === "Unknown") continue;

                const normalizedBrand = brandName.charAt(0).toUpperCase() + brandName.slice(1).toLowerCase();
                brandSet.add(normalizedBrand);

                const devId = `DEV-${normalizedBrand.substring(0, 3).toUpperCase()}-${modelName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

                deviceDataForDb.push({
                    id: devId,
                    brand: normalizedBrand,
                    model: modelName,
                    series: row.Series || row.series,
                    code: row.Code || row.code,
                    image: row.Image || row.image,
                    colors: (row.Colors || row.colors || "") ? (row.Colors || row.colors).split(",").map((c: string) => c.trim()).filter((c: any) => c) : [],
                    specs: row.Specs || row.specs,
                    chipset: row.Chipset || row.chipset,
                });

                deviceModelMap.set(modelName.toLowerCase(), devId);
            }

            // Upsert Brands
            const brandValues = Array.from(brandSet).map(name => ({
                id: name.toLowerCase().replace(/\s+/g, '-'),
                name: name
            }));
            if (brandValues.length > 0) {
                await db.insert(brands).values(brandValues).onConflictDoNothing();
            }

            // Insert Devices (Chunks)
            // Use fallback if none found
            if (deviceDataForDb.length === 0) {
                await db.insert(devices).values(fallbackDevices);
                fallbackDevices.forEach(d => deviceModelMap.set(d.model.toLowerCase(), d.id));
            } else {
                const chunkSize = 50;
                for (let i = 0; i < deviceDataForDb.length; i += chunkSize) {
                    const chunk = deviceDataForDb.slice(i, i + chunkSize);
                    await db.insert(devices).values(chunk);
                }
            }
            console.log(`✅ Processed devices.`);

        } catch (e) {
            console.error("Error parsing Excel:", e);
            await db.insert(devices).values(fallbackDevices);
            fallbackDevices.forEach(d => deviceModelMap.set(d.model.toLowerCase(), d.id));
        }
    } else {
        console.warn("⚠️ devices_export.xlsx not found, using fallback.");
        await db.insert(brands).values([
            { id: "samsung", name: "Samsung" }, { id: "apple", name: "Apple" },
            { id: "xiaomi", name: "Xiaomi" }, { id: "oppo", name: "Oppo" }, { id: "vivo", name: "Vivo" }
        ]).onConflictDoNothing();
        await db.insert(devices).values(fallbackDevices);
        fallbackDevices.forEach(d => deviceModelMap.set(d.model.toLowerCase(), d.id));
    }

    // ============================================
    // 6. INVENTORY
    // ============================================
    console.log("Creating inventory...");

    await db.insert(products).values([
        { id: prdIphone13, code: "8990001", name: "iPhone 13 128GB", categoryId: catHp, stock: 2 },
        { id: prdLcd13Pro, code: "SP-LCD-13PRO", name: "LCD iPhone 13 Pro Max", categoryId: "CAT-LCD", stock: 2 },
        { id: prdLcdIpX, code: "SP-LCD-IPX", name: "LCD iPhone X", categoryId: "CAT-LCD", stock: 5 },
        { id: prdBatreIpX, code: "SP-BAT-IPX", name: "Baterai iPhone X", categoryId: "CAT-BAT", stock: 20 },
        { id: prdCaseClear, code: "ACC-CASE-001", name: "Case Clear", categoryId: catAcc, stock: 20 },
        { id: prdTempered, code: "ACC-TG-001", name: "Tempered Glass", categoryId: catAcc, stock: 50 },
    ]);

    // Product Variants & Batches
    const varLcd13Oled = "VAR-LCD-13PRO-OLED";
    const varLcdXOled = "VAR-LCD-X-OLED";
    const varBatXOrg = "VAR-BAT-X-ORG";

    await db.insert(productVariants).values([
        { id: varLcd13Oled, productId: prdLcd13Pro, name: "OLED (Soft)" },
        { id: varLcdXOled, productId: prdLcdIpX, name: "OLED (Hard)" },
        { id: varBatXOrg, productId: prdBatreIpX, name: "Original 100%" },
    ]);

    // Batches
    await db.insert(productBatches).values([
        // High Value LCD (Cost 2.5jt, Sell 4.5jt)
        {
            id: bLcd13ProA, productId: prdLcd13Pro, variantId: varLcd13Oled, supplierId: supGlobal,
            variant: "OLED (Soft)", buyPrice: 2500000, sellPrice: 4500000,
            initialStock: 3, currentStock: 2
        },
        // iPhone X LCD
        {
            id: bLcdIpXA, productId: prdLcdIpX, variantId: varLcdXOled, supplierId: supGlobal,
            variant: "OLED", buyPrice: 300000, sellPrice: 650000,
            initialStock: 5, currentStock: 5
        },
        // iPhone X Battery
        {
            id: bBatreIpXA, productId: prdBatreIpX, variantId: varBatXOrg, supplierId: supLokal,
            variant: "Original", buyPrice: 150000, sellPrice: 350000,
            initialStock: 25, currentStock: 20
        },
        // Case Clear
        {
            id: bCaseA, productId: prdCaseClear, supplierId: supLokal,
            variant: "Standard", buyPrice: 15000, sellPrice: 50000,
            initialStock: 50, currentStock: 30
        },
        // Tempered Glass
        {
            id: bTgA, productId: prdTempered, supplierId: supLokal,
            variant: "Standard", buyPrice: 5000, sellPrice: 25000,
            initialStock: 100, currentStock: 50
        }
    ]);

    // Purchases (To justify stock)
    await db.insert(purchases).values({
        id: "PO-INIT-001", supplierId: supGlobal, userId: adminId, totalAmount: 10000000, date: getPastDate(90)
    });

    // ============================================
    // 6.5 PRODUCT COMPATIBILITY LINKING
    // ============================================
    console.log("Generating product-device compatibility...");

    // We can use the deviceModelMap populated during import
    // And loop through products
    const compatibilityPayload: { productId: string; deviceId: string }[] = [];

    // Manual mapping for seed products to ensure they have links
    const seedCompatibilities = [
        { prodId: prdIphone13, models: ["iPhone 13"] },
        { prodId: prdLcd13Pro, models: ["iPhone 13 Pro Max"] },
        { prodId: prdLcdIpX, models: ["iPhone X"] },
        { prodId: prdBatreIpX, models: ["iPhone X"] },
        { prodId: prdCaseClear, models: ["iPhone 13"] },
        { prodId: prdTempered, models: ["iPhone 13", "iPhone 13 Pro Max"] },
    ];

    // 1. Apply specific seed rules
    for (const rule of seedCompatibilities) {
        for (const model of rule.models) {
            // Find device ID for this model (fuzzy or exact)
            // Check exact first
            let devId = deviceModelMap.get(model.toLowerCase());

            // If not found, try to find in values (slow but fine for seed)
            if (!devId) {
                // This is just a fallback for the specific seed items
                // In a real scenario we'd do a proper search
                // For now, let's just rely on the fallback devices we inserted if excel failed,
                // OR if excel succeeded, hopefully "iPhone 13" is in there.
            }

            if (devId) {
                compatibilityPayload.push({ productId: rule.prodId, deviceId: devId });
            }
        }
    }

    // 2. Generic fuzzy matching for all products against all devices (for robust demo)
    // Fetch all devices again to be sure (as we might have many from Excel)
    const allDevices = await db.select({ id: devices.id, model: devices.model }).from(devices);
    const allProducts = await db.select({ id: products.id, name: products.name }).from(products);

    for (const prod of allProducts) {
        for (const dev of allDevices) {
            // Avoid duplicates if already added by seed rules
            const alreadyExists = compatibilityPayload.some(c => c.productId === prod.id && c.deviceId === dev.id);
            if (alreadyExists) continue;

            const pName = prod.name.toLowerCase();
            const dModel = dev.model.toLowerCase();

            // HEURISTIC: If product name contains the FULL model name
            // e.g. "LCD iPhone 13 Pro Max" contains "iPhone 13 Pro Max"
            if (pName.includes(dModel)) {
                compatibilityPayload.push({ productId: prod.id, deviceId: dev.id });
            }
        }
    }

    if (compatibilityPayload.length > 0) {
        // Chunk insert
        const compChunkSize = 100;
        for (let i = 0; i < compatibilityPayload.length; i += compChunkSize) {
            const chunk = compatibilityPayload.slice(i, i + compChunkSize);
            await db.insert(productDeviceCompatibility).values(chunk).onConflictDoNothing();
        }
        console.log(`✅ Linked ${compatibilityPayload.length} compatibilities.`);
    }



    // ============================================
    // 7. SERVICES (120 Total over 3 Months)
    // ============================================
    console.log("Creating 120 service records over 3 months...");

    // Distribution:
    // - 5 canceled (batal), not picked up
    // - 3 completed (selesai) with store parts, not picked up (abandoned style)
    // - 80 picked up (diambil):
    //   - 10 jasa only (no parts)
    //   - 5 with external parts
    //   - 65 with store parts
    // - 15 completed (selesai) with store parts, awaiting pickup
    // - 17 in queue/working (antrian/dikerjakan)
    // Total: 5 + 3 + 80 + 15 + 17 = 120

    const customerNames = [
        "Budi Santoso", "Ani Wijaya", "Rudi Hartono", "Siti Rahayu", "Eko Prasetyo",
        "Dewi Lestari", "Agus Setiawan", "Rina Susanti", "Hendra Wijaya", "Maya Sari",
        "Doni Firmansyah", "Lisa Permata", "Yanto Susilo", "Wati Mulyani", "Bambang Irawan",
        "Putri Handayani", "Joko Prasetyo", "Ratna Dewi", "Andi Saputra", "Novi Anggraini"
    ];

    const complaints = [
        "Layar pecah", "Baterai kembung", "Touchscreen tidak responsif", "Mati total",
        "Charging lambat", "Speaker tidak bunyi", "Kamera buram", "Wifi tidak konek",
        "Sinyal hilang", "Bootloop", "Restart sendiri", "Overheat", "Tombol rusak",
        "LCD bergaris", "IC Power rusak", "Mic tidak berfungsi", "Home button rusak"
    ];

    const deviceModels = [
        { brand: "Apple", model: "iPhone X" },
        { brand: "Apple", model: "iPhone 11" },
        { brand: "Apple", model: "iPhone 13 Pro Max" },
        { brand: "Samsung", model: "Galaxy S21" },
        { brand: "Samsung", model: "Galaxy A52" },
        { brand: "Xiaomi", model: "Redmi Note 10" },
        { brand: "Oppo", model: "Reno 5" },
        { brand: "Vivo", model: "V21" }
    ];

    const technicians = [teknisi1Id, teknisi2Id];
    let serviceCounter = 1;

    // Helper to generate service number
    const genSrvNo = () => `SRV-${currentYear}-${String(serviceCounter++).padStart(3, "0")}`;
    const randomPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const randomPhone = () => `08${Math.floor(100000000 + Math.random() * 900000000)}`;
    const randomCost = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min) * 10000;

    const servicesPayload: any[] = [];

    // Month breakdown: M1 (60-90 days ago), M2 (30-59 days), M3 (0-29 days)
    const getMonthDate = (month: 1 | 2 | 3, dayWithin: number) => {
        if (month === 1) return getPastDate(90 - dayWithin); // 60-90 days ago
        if (month === 2) return getPastDate(59 - dayWithin); // 30-59 days ago
        return getPastDate(29 - dayWithin); // 0-29 days ago
    };

    // GROUP A: 5 Canceled (batal)
    for (let i = 0; i < 5; i++) {
        const month = (i < 2 ? 1 : i < 4 ? 2 : 3) as 1 | 2 | 3;
        servicesPayload.push({
            no: genSrvNo(),
            customer: { name: randomPick(customerNames), phone: randomPhone() },
            device: randomPick(deviceModels),
            complaint: randomPick(complaints),
            diagnosis: "Biaya terlalu mahal / Pelanggan batal",
            status: "batal",
            technicianId: randomPick(technicians),
            createdBy: kasirId,
            costEstimate: randomCost(20, 100),
            dateIn: getMonthDate(month, Math.floor(Math.random() * 30)),
            notes: "Pelanggan membatalkan service."
        });
    }

    // GROUP B: 3 Selesai with store parts (abandoned, not picked up > 60 days)
    for (let i = 0; i < 3; i++) {
        const cost = randomCost(15, 50);
        servicesPayload.push({
            no: genSrvNo(),
            customer: { name: "Hantu Gudang " + (i + 1), phone: `0800066${i}` },
            device: randomPick(deviceModels),
            complaint: randomPick(complaints),
            diagnosis: "Sudah selesai dikerjakan",
            status: "selesai",
            technicianId: randomPick(technicians),
            createdBy: kasirId,
            actualCost: cost,
            dateIn: getPastDate(90 + i * 10), // Very old
            parts: [{ name: "Baterai Generic", price: cost, qty: 1, batchId: bBatreIpXA, buyPrice: Math.floor(cost * 0.6) }],
            notes: "Tidak bisa dihubungi. Kandidat likuidasi."
        });
    }

    // GROUP C: 80 Picked Up (diambil)
    // C1: 10 jasa only (no parts)
    for (let i = 0; i < 10; i++) {
        const month = (i < 4 ? 1 : i < 7 ? 2 : 3) as 1 | 2 | 3;
        const dateIn = getMonthDate(month, Math.floor(Math.random() * 25));
        const dateOut = new Date(dateIn);
        dateOut.setDate(dateOut.getDate() + Math.floor(Math.random() * 3) + 1);
        servicesPayload.push({
            no: genSrvNo(),
            customer: { name: randomPick(customerNames), phone: randomPhone() },
            device: randomPick(deviceModels),
            complaint: "Software / Flash ulang",
            status: "diambil",
            technicianId: randomPick(technicians),
            createdBy: kasirId,
            actualCost: randomCost(5, 15), // Jasa only, cheaper
            dateIn,
            dateOut,
            notes: "Jasa only, tanpa sparepart."
        });
    }

    // C2: 5 with external parts
    for (let i = 0; i < 5; i++) {
        const month = (i < 2 ? 1 : i < 4 ? 2 : 3) as 1 | 2 | 3;
        const dateIn = getMonthDate(month, Math.floor(Math.random() * 25));
        const dateOut = new Date(dateIn);
        dateOut.setDate(dateOut.getDate() + Math.floor(Math.random() * 5) + 2);
        servicesPayload.push({
            no: genSrvNo(),
            customer: { name: randomPick(customerNames), phone: randomPhone() },
            device: randomPick(deviceModels),
            complaint: randomPick(complaints),
            status: "diambil",
            technicianId: randomPick(technicians),
            createdBy: kasirId,
            actualCost: randomCost(30, 80),
            dateIn,
            dateOut,
            externalParts: true,
            notes: "Sparepart dari luar (pelanggan bawa sendiri)."
        });
    }

    // C3: 65 with store parts
    for (let i = 0; i < 65; i++) {
        const month = (i < 22 ? 1 : i < 44 ? 2 : 3) as 1 | 2 | 3;
        const dateIn = getMonthDate(month, Math.floor(Math.random() * 28));
        const dateOut = new Date(dateIn);
        dateOut.setDate(dateOut.getDate() + Math.floor(Math.random() * 4) + 1);
        const cost = randomCost(25, 120);
        const batchId = i % 3 === 0 ? bLcdIpXA : bBatreIpXA;
        const partName = i % 3 === 0 ? "LCD iPhone X" : "Baterai iPhone X";
        servicesPayload.push({
            no: genSrvNo(),
            customer: { name: randomPick(customerNames), phone: randomPhone() },
            device: randomPick(deviceModels),
            complaint: randomPick(complaints),
            status: "diambil",
            technicianId: randomPick(technicians),
            createdBy: kasirId,
            actualCost: cost,
            dateIn,
            dateOut,
            parts: [{ name: partName, price: cost, qty: 1, batchId, buyPrice: Math.floor(cost * 0.5) }],
        });
    }

    // GROUP D: 15 Completed (selesai) awaiting pickup with store parts
    for (let i = 0; i < 15; i++) {
        const month = (i < 5 ? 2 : 3) as 2 | 3; // More recent
        const dateIn = getMonthDate(month, Math.floor(Math.random() * 20));
        const cost = randomCost(30, 150);
        servicesPayload.push({
            no: genSrvNo(),
            customer: { name: randomPick(customerNames), phone: randomPhone() },
            device: randomPick(deviceModels),
            complaint: randomPick(complaints),
            diagnosis: "Selesai, menunggu diambil",
            status: "selesai",
            technicianId: randomPick(technicians),
            createdBy: kasirId,
            actualCost: cost,
            costEstimate: cost,
            dateIn,
            parts: [{ name: "LCD/Baterai", price: cost, qty: 1, batchId: bLcd13ProA, buyPrice: Math.floor(cost * 0.55) }],
            notes: "Sudah dikabari, belum diambil."
        });
    }

    // GROUP E: 17 In Queue/Working
    for (let i = 0; i < 17; i++) {
        const status = i < 8 ? "antrian" : "dikerjakan";
        const dateIn = getMonthDate(3, Math.floor(Math.random() * 10)); // Recent
        servicesPayload.push({
            no: genSrvNo(),
            customer: { name: randomPick(customerNames), phone: randomPhone() },
            device: randomPick(deviceModels),
            complaint: randomPick(complaints),
            status,
            technicianId: status === "dikerjakan" ? randomPick(technicians) : null,
            createdBy: kasirId,
            costEstimate: randomCost(20, 100),
            dateIn,
        });
    }

    // Insert all services in chunks
    const srvChunkSize = 30;
    for (let i = 0; i < servicesPayload.length; i += srvChunkSize) {
        const chunk = servicesPayload.slice(i, i + srvChunkSize);
        await db.insert(services).values(chunk);
    }
    console.log(`✅ Created ${servicesPayload.length} services.`);

    // ============================================
    // 8. PAYMENT METHODS & TRANSACTIONS
    // ============================================
    console.log("Creating payment methods and transactions...");

    const pmCash = "PM-CASH";
    const pmTransfer = "PM-TRANSFER";
    const pmQris = "PM-QRIS";

    await db.insert(paymentMethods).values([
        { id: pmCash, name: "Tunai", type: "cash", icon: "💵" },
        { id: pmTransfer, name: "Transfer Bank", type: "transfer", icon: "🏦" },
        { id: pmQris, name: "QRIS", type: "ewallet", icon: "📱" },
    ]);

    await db.insert(paymentVariants).values([
        { id: "VAR-BCA", methodId: pmTransfer, name: "BCA", accountNumber: "88889999", accountHolder: "Admin" },
        { id: "VAR-MANDIRI", methodId: pmTransfer, name: "Mandiri", accountNumber: "1234567890", accountHolder: "Admin" }
    ]);

    // ============================================
    // 8.1 PURCHASES (5 Transactions)
    // ============================================
    console.log("Creating 5 purchase transactions...");
    const purchasePayload: any[] = [];
    const purchaseItemPayload: any[] = [];

    // Purchase 1 & 2: From supGlobal (1 has outstanding debt)
    purchasePayload.push(
        { id: "PO-001", supplierId: supGlobal, userId: adminId, totalAmount: 5000000, status: "paid", date: getPastDate(85) },
        { id: "PO-002", supplierId: supGlobal, userId: adminId, totalAmount: 3500000, status: "unpaid", date: getPastDate(55) }, // DEBT
        { id: "PO-003", supplierId: supGlobal, userId: adminId, totalAmount: 2000000, status: "unpaid", date: getPastDate(40) }, // DEBT
        { id: "PO-004", supplierId: supLokal, userId: adminId, totalAmount: 1500000, status: "paid", date: getPastDate(25) },
        { id: "PO-005", supplierId: supLokal, userId: adminId, totalAmount: 800000, status: "paid", date: getPastDate(10) }
    );

    purchaseItemPayload.push(
        { purchaseId: "PO-001", batchId: bLcd13ProA, productId: prdLcd13Pro, qtyOrdered: 2, qtyReceived: 2, buyPrice: 2500000, sellPrice: 4500000 },
        { purchaseId: "PO-002", batchId: bLcdIpXA, productId: prdLcdIpX, qtyOrdered: 5, qtyReceived: 5, buyPrice: 700000, sellPrice: 1200000 },
        { purchaseId: "PO-003", batchId: bBatreIpXA, productId: prdBatreIpX, qtyOrdered: 20, qtyReceived: 20, buyPrice: 100000, sellPrice: 250000 },
        { purchaseId: "PO-004", batchId: bCaseA, productId: prdCaseClear, qtyOrdered: 30, qtyReceived: 30, buyPrice: 50000, sellPrice: 100000 },
        { purchaseId: "PO-005", batchId: bTgA, productId: prdTempered, qtyOrdered: 40, qtyReceived: 40, buyPrice: 20000, sellPrice: 50000 }
    );

    await db.insert(purchases).values(purchasePayload);
    await db.insert(purchaseItems).values(purchaseItemPayload);
    console.log("✅ Created 5 purchases (2 with outstanding debt from supGlobal).");

    // ============================================
    // 8.2 SALES (10 Transactions)
    // ============================================
    console.log("Creating 10 sales transactions...");
    const salesPayload: any[] = [];
    const saleItemsPayload: any[] = [];
    const salePaymentsPayload: any[] = [];

    for (let i = 1; i <= 10; i++) {
        const saleId = `SAL-${String(i).padStart(3, "0")}`;
        const month = (i <= 3 ? 1 : i <= 7 ? 2 : 3) as 1 | 2 | 3;
        const amount = randomCost(5, 50);
        const prodId = i % 2 === 0 ? prdCaseClear : prdTempered;
        const batchId = i % 2 === 0 ? bCaseA : bTgA;

        salesPayload.push({
            id: saleId,
            userId: kasirId,
            customerName: randomPick(customerNames),
            totalAmount: amount,
            finalAmount: amount,
            paymentMethod: i % 3 === 0 ? "transfer" : "cash",
            paymentStatus: "paid",
            createdAt: getMonthDate(month, Math.floor(Math.random() * 28))
        });

        saleItemsPayload.push({
            saleId,
            productId: prodId,
            batchId,
            qty: Math.floor(Math.random() * 3) + 1,
            price: amount,
            subtotal: amount
        });

        salePaymentsPayload.push({
            saleId,
            amount,
            method: i % 3 === 0 ? "Transfer Bank" : "Tunai",
            methodId: i % 3 === 0 ? pmTransfer : pmCash
        });
    }

    await db.insert(sales).values(salesPayload);
    await db.insert(saleItems).values(saleItemsPayload);
    await db.insert(salePayments).values(salePaymentsPayload);
    console.log("✅ Created 10 sales transactions.");

    // ============================================
    // 8.3 RETURNS (1 completed, 5 items pending)
    // ============================================
    console.log("Creating purchase returns...");

    // 1 Completed Return (5 items)
    const returnId1 = "RTN-001";
    await db.insert(purchaseReturns).values({
        id: returnId1,
        supplierId: supGlobal,
        userId: adminId,
        date: getPastDate(50),
        notes: "Retur 5 LCD cacat pabrik dari PO-002"
    });
    await db.insert(purchaseReturnItems).values([
        { returnId: returnId1, productId: prdLcdIpX, batchId: bLcdIpXA, qty: 5, reason: "Dead pixel / cacat" }
    ]);

    // Defective items (pending to be returned - 5 items)
    await db.insert(defectiveItems).values([
        { id: "DEF-001", productId: prdLcdIpX, batchId: bLcdIpXA, supplierId: supGlobal, qty: 2, source: "manual", reason: "Layar bergaris", status: "pending" },
        { id: "DEF-002", productId: prdBatreIpX, batchId: bBatreIpXA, supplierId: supLokal, qty: 3, source: "manual", reason: "Tidak mau charge", status: "pending" }
    ]);
    console.log("✅ Created 1 completed return (5 items) + 5 pending defective items.");

    // ============================================
    // 9. OPERATIONAL COSTS (3 Months)
    // ============================================
    console.log("Creating 3 months of operational costs...");

    const opCostsPayload: any[] = [];

    // Month 1 (60-90 days ago)
    opCostsPayload.push(
        { category: "Listrik", amount: 1500000, date: getPastDate(85), description: "Tagihan PLN Bulan 1", userId: adminId },
        { category: "Gaji", amount: 8000000, date: getPastDate(80), description: "Gaji Karyawan Bulan 1", userId: adminId },
        { category: "Internet", amount: 350000, date: getPastDate(82), description: "Indihome 50Mbps", userId: adminId }
    );

    // Month 2 (30-59 days ago) - includes external parts purchase
    opCostsPayload.push(
        { category: "Listrik", amount: 1600000, date: getPastDate(55), description: "Tagihan PLN Bulan 2", userId: adminId },
        { category: "Gaji", amount: 8000000, date: getPastDate(50), description: "Gaji Karyawan Bulan 2", userId: adminId },
        { category: "Internet", amount: 350000, date: getPastDate(52), description: "Indihome 50Mbps", userId: adminId },
        { category: "Sparepart Eksternal", amount: 2500000, date: getPastDate(45), description: "Beli IC Power & Flexibel di luar", userId: adminId }
    );

    // Month 3 (0-29 days ago)
    opCostsPayload.push(
        { category: "Listrik", amount: 1550000, date: getPastDate(20), description: "Tagihan PLN Bulan 3", userId: adminId },
        { category: "Gaji", amount: 8000000, date: getPastDate(15), description: "Gaji Karyawan Bulan 3", userId: adminId },
        { category: "Internet", amount: 350000, date: getPastDate(18), description: "Indihome 50Mbps", userId: adminId },
        { category: "Sewa", amount: 5000000, date: getPastDate(5), description: "Sewa Ruko Bulanan", userId: adminId }
    );

    await db.insert(operationalCosts).values(opCostsPayload);
    console.log("✅ Created operational costs for 3 months.");

    console.log("\n✅ COMPREHENSIVE DATABASE SEED COMPLETE!");
    console.log("=".repeat(50));
    console.log("Summary:");
    console.log(`- Services: ${servicesPayload.length} total`);
    console.log("  * 5 canceled");
    console.log("  * 80 picked up (10 jasa-only, 5 external, 65 store parts)");
    console.log("  * 15 completed awaiting pickup");
    console.log("  * 3 abandoned (liquidation candidates)");
    console.log("  * 17 in queue/working");
    console.log("- Purchases: 5 (2 with outstanding debt)");
    console.log("- Sales: 10 transactions");
    console.log("- Returns: 1 completed (5 items), 5 pending defective");
    console.log("- Operational Costs: 3 months (incl. external parts in Month 2)");
    console.log("=".repeat(50));
}

main().catch((e) => {
    console.error("❌ Seeding failed:");
    console.error(e);
    process.exit(1);
});
