/**
 * Products, Categories, Brands, and Devices Seed
 */
import { db } from "../index";
import { categories, brands, devices, products, productBatches, productDeviceCompatibility, productVariants } from "../schema";
import { CATEGORY_IDS, PRODUCT_IDS, BATCH_IDS, SUPPLIER_IDS, USER_IDS } from "./helpers";
import { eq } from "drizzle-orm";

export async function seedProducts() {
    console.log("Creating categories...");

    await db.insert(categories).values([
        { id: CATEGORY_IDS.hp, name: "Handphone", description: "Unit HP Second/Baru" },
        { id: CATEGORY_IDS.sparepart, name: "Sparepart", description: "LCD, Batre, IC, dll" },
        { id: CATEGORY_IDS.accessory, name: "Aksesoris", description: "Case, TG, Charger" },
        { id: CATEGORY_IDS.service, name: "Jasa Service", description: "Jasa perbaikan" },
    ]);

    console.log("Creating brands and devices...");

    const brandAppleId = "BRAND-APPLE";
    const brandSamsungId = "BRAND-SAMSUNG";

    await db.insert(brands).values([
        { id: brandAppleId, name: "Apple", logo: "" },
        { id: brandSamsungId, name: "Samsung", logo: "" },
    ]);

    // Devices
    // Devices
    console.log("Importing devices...");
    const devicesList = [
        { id: "DEV-IPX", brand: "Apple", model: "iPhone X", series: "iPhone", code: "A1865" },
        { id: "DEV-IP11", brand: "Apple", model: "iPhone 11", series: "iPhone", code: "A2111" },
        { id: "DEV-IP12", brand: "Apple", model: "iPhone 12", series: "iPhone", code: "A2172" },
        { id: "DEV-IP12P", brand: "Apple", model: "iPhone 12 Pro", series: "iPhone", code: "A2341" },
        { id: "DEV-IP13", brand: "Apple", model: "iPhone 13", series: "iPhone", code: "A2482" },
        { id: "DEV-IP13PRO", brand: "Apple", model: "iPhone 13 Pro", series: "iPhone Pro", code: "A2483" },
        { id: "DEV-IP14", brand: "Apple", model: "iPhone 14", series: "iPhone", code: "A2649" },
        { id: "DEV-IP15", brand: "Apple", model: "iPhone 15", series: "iPhone", code: "A3090" },
        { id: "DEV-S21", brand: "Samsung", model: "Galaxy S21", series: "S Series", code: "SM-G991" },
        { id: "DEV-S22", brand: "Samsung", model: "Galaxy S22", series: "S Series", code: "SM-S901" },
        { id: "DEV-S23", brand: "Samsung", model: "Galaxy S23", series: "S Series", code: "SM-S911" },
        { id: "DEV-S24", brand: "Samsung", model: "Galaxy S24", series: "S Series", code: "SM-S921" },
    ];

    const totalDevices = devicesList.length;

    // Simple progress bar implementation
    for (let i = 0; i < totalDevices; i++) {
        await db.insert(devices).values(devicesList[i]);

        // Calculate progress
        const percent = Math.round(((i + 1) / totalDevices) * 100);
        const barLength = 30;
        const filledLength = Math.round((barLength * percent) / 100);
        const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);

        // Write progress to stdout
        process.stdout.write(`\rImporting Devices: [${bar}] ${percent}% (${i + 1}/${totalDevices})`);

        // Simulate small delay to make progress visible (optional, but good for UX as requested)
        await new Promise(r => setTimeout(r, 100));
    }
    process.stdout.write("\n");

    // Assign IDs for later use in products (need to ensure these match what we inserted if we changed the logic)
    // We are hardcoding the IDs we need for compatibility later
    const devIpXId = "DEV-IPX";
    const devIp11Id = "DEV-IP11";
    const devIp13Id = "DEV-IP13";
    const devIp13ProId = "DEV-IP13PRO";
    const devS21Id = "DEV-S21";

    console.log("Creating products...");

    await db.insert(products).values([
        {
            id: PRODUCT_IDS.iphone13,
            categoryId: CATEGORY_IDS.hp,
            stock: 1,
            minStock: 1,
            name: "iPhone 13 128GB Midnight (Second)",
            code: "HP-IP13-128-MID",
        },
        {
            id: PRODUCT_IDS.lcdIpX,
            categoryId: CATEGORY_IDS.sparepart,
            stock: 4,
            minStock: 2,
            name: "LCD iPhone X OLED GX",
            code: "SP-LCD-IPX-GX",
        },
        {
            id: PRODUCT_IDS.batreIpX,
            categoryId: CATEGORY_IDS.sparepart,
            stock: 4,
            minStock: 2,
            name: "Baterai iPhone X Vizz",
            code: "SP-BAT-IPX-VZ",
        },
        {
            id: PRODUCT_IDS.lcd13Pro,
            categoryId: CATEGORY_IDS.sparepart,
            stock: 1,
            minStock: 1,
            name: "LCD iPhone 13 Pro Original Copotan",
            code: "SP-LCD-IP13PRO-ORI",
        },
        {
            id: PRODUCT_IDS.caseClear,
            categoryId: CATEGORY_IDS.accessory,
            stock: 11,
            minStock: 5,
            name: "Case Clear iPhone X/XS",
            code: "ACC-CASE-IPX-CLR",
        },
        {
            id: PRODUCT_IDS.tempered,
            categoryId: CATEGORY_IDS.accessory,
            stock: 17,
            minStock: 10,
            name: "Tempered Glass iPhone X/11 Pro",
            code: "ACC-TG-IPX",
        }
    ]);

    console.log("Creating product batches (initial stock)...");

    await db.insert(productBatches).values([
        {
            id: BATCH_IDS.iphone13A,
            productId: PRODUCT_IDS.iphone13,
            supplierId: SUPPLIER_IDS.lokal,
            buyPrice: 9000000,
            sellPrice: 10500000,
            initialStock: 1,
            currentStock: 1,
        },
        {
            id: BATCH_IDS.lcdIpXA,
            productId: PRODUCT_IDS.lcdIpX,
            supplierId: SUPPLIER_IDS.global,
            buyPrice: 250000,
            sellPrice: 450000,
            initialStock: 5,
            currentStock: 4, // 1 used/sold
        },
        {
            id: BATCH_IDS.batreIpXA,
            productId: PRODUCT_IDS.batreIpX,
            supplierId: SUPPLIER_IDS.global,
            buyPrice: 100000,
            sellPrice: 200000,
            initialStock: 5,
            currentStock: 4, // 1 used/sold
        },
        {
            id: BATCH_IDS.lcd13ProA,
            productId: PRODUCT_IDS.lcd13Pro,
            supplierId: SUPPLIER_IDS.lokal,
            buyPrice: 2800000,
            sellPrice: 3500000,
            initialStock: 1,
            currentStock: 1,
        },
        {
            id: BATCH_IDS.caseA,
            productId: PRODUCT_IDS.caseClear,
            supplierId: SUPPLIER_IDS.global,
            buyPrice: 10000,
            sellPrice: 35000,
            initialStock: 20,
            currentStock: 11, // 9 sold (bulk)
        },
        {
            id: BATCH_IDS.tgA,
            productId: PRODUCT_IDS.tempered,
            supplierId: SUPPLIER_IDS.global,
            buyPrice: 5000,
            sellPrice: 25000,
            initialStock: 40,
            currentStock: 17, // 23 sold
        },
    ]);

    console.log("Generating product-device compatibility...");

    // Compatible arrays
    const compat = [
        { product: PRODUCT_IDS.lcdIpX, devices: [devIpXId] },
        { product: PRODUCT_IDS.batreIpX, devices: [devIpXId] },
        { product: PRODUCT_IDS.lcd13Pro, devices: [devIp13ProId] },
        // Add more complex compatibilities
        { product: PRODUCT_IDS.caseClear, devices: [devIpXId] }, // X fits X roughly
        { product: PRODUCT_IDS.tempered, devices: [devIpXId, devIp11Id] }, // Simplified sharing
    ];

    let compatCount = 0;
    for (const c of compat) {
        for (const dId of c.devices) {
            await db.insert(productDeviceCompatibility).values({
                productId: c.product,
                deviceId: dId,
            });
            compatCount++;
        }
    }
    console.log(`✅ Linked ${compatCount} compatibilities.`);
    console.log("✅ Created products, categories, devices, and stock.");
}
