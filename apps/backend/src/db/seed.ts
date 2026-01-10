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
    services
} from "./schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("🌱 Seeding database...\n");

    // ============================================
    // 1. USERS
    // ============================================
    console.log("Creating users...");
    const hashedAdminPassword = await Bun.password.hash("admin");
    const hashedTeknisiPassword = await Bun.password.hash("teknisi");
    const hashedKasirPassword = await Bun.password.hash("kasir");

    const adminId = "USR-ADMIN001";
    const teknisiId = "USR-TEKNIS01";
    const kasirId = "USR-KASIR001";

    await db.insert(users).values([
        { id: adminId, username: "admin", password: hashedAdminPassword, name: "Administrator", role: "admin" },
        { id: teknisiId, username: "teknisi", password: hashedTeknisiPassword, name: "Ahmad Teknisi", role: "teknisi" },
        { id: kasirId, username: "kasir", password: hashedKasirPassword, name: "Siti Kasir", role: "kasir" }
    ]).onConflictDoNothing();

    // ============================================
    // 2. CATEGORIES
    // ============================================
    console.log("Creating categories...");
    const catHandphone = "CAT-HP000001";
    const catSparepart = "CAT-SPARE001";
    const catAccessory = "CAT-ACCES001";

    await db.insert(categories).values([
        { id: catHandphone, name: "Handphone", description: "Smartphone dan Tablet" },
        { id: catSparepart, name: "Sparepart", description: "LCD, Baterai, Fleksibel, dll" },
        { id: catAccessory, name: "Aksesoris", description: "Case, Tempered Glass, Charger" }
    ]).onConflictDoNothing();

    // ============================================
    // 3. SUPPLIERS
    // ============================================
    console.log("Creating suppliers...");
    const sup1 = "SUP-MAKMUR01";
    const sup2 = "SUP-JAYA0001";
    const sup3 = "SUP-BERKAH01";

    await db.insert(suppliers).values([
        { id: sup1, name: "CV. Makmur Jaya", contact: "Budi", phone: "08123456789", address: "Jakarta Pusat" },
        { id: sup2, name: "PT. Jaya Elektronik", contact: "Dewi", phone: "08234567890", address: "Bandung" },
        { id: sup3, name: "UD. Berkah Selalu", contact: "Rudi", phone: "08345678901", address: "Surabaya" }
    ]).onConflictDoNothing();

    // ============================================
    // 4. CUSTOMERS (MEMBERS)
    // ============================================
    console.log("Creating customers...");
    const cust1 = "CUST-ANDI0001";
    const cust2 = "CUST-BUDI0001";
    const cust3 = "CUST-CITRA001";

    await db.insert(members).values([
        { id: cust1, name: "Andi Wijaya", phone: "081111111111", email: "andi@email.com", creditLimit: 5000000, debt: 0, points: 100, discountPercent: 5 },
        { id: cust2, name: "Budi Santoso", phone: "082222222222", email: "budi@email.com", creditLimit: 3000000, debt: 500000, points: 50, discountPercent: 0 },
        { id: cust3, name: "Citra Dewi", phone: "083333333333", email: "citra@email.com", creditLimit: 10000000, debt: 0, points: 200, discountPercent: 10 }
    ]).onConflictDoNothing();

    // ============================================
    // 5. PRODUCTS
    // ============================================
    console.log("Creating products...");
    const prod1 = "PRD-IPHONE01";
    const prod2 = "PRD-SAMSUNG1";
    const prod3 = "PRD-LCDIP001";
    const prod4 = "PRD-BATTRE01";
    const prod5 = "PRD-CASE0001";

    await db.insert(products).values([
        { id: prod1, code: "IP13PRO", name: "iPhone 13 Pro", categoryId: catHandphone, stock: 0, minStock: 2 },
        { id: prod2, code: "SAMS23U", name: "Samsung Galaxy S23 Ultra", categoryId: catHandphone, stock: 0, minStock: 2 },
        { id: prod3, code: "LCDIP13", name: "LCD iPhone 13 Pro", categoryId: catSparepart, stock: 0, minStock: 5 },
        { id: prod4, code: "BATIP13", name: "Baterai iPhone 13 Pro", categoryId: catSparepart, stock: 0, minStock: 10 },
        { id: prod5, code: "CASEIP13", name: "Case iPhone 13 Pro", categoryId: catAccessory, stock: 0, minStock: 20 }
    ]).onConflictDoNothing();

    // ============================================
    // 6. PRODUCT BATCHES (Initial Stock via Purchases)
    // ============================================
    console.log("Creating product batches...");
    const batch1 = "B-IP13ORI01";
    const batch2 = "B-IP13OEM01";
    const batch3 = "B-SAMS23O1";
    const batch4 = "B-LCDIP001";
    const batch5 = "B-BATIP001";
    const batch6 = "B-CASE0001";

    await db.insert(productBatches).values([
        { id: batch1, productId: prod1, supplierId: sup1, variant: "Original 128GB", supplierName: "CV. Makmur Jaya", buyPrice: 15000000, sellPrice: 17000000, initialStock: 5, currentStock: 3 },
        { id: batch2, productId: prod1, supplierId: sup2, variant: "Inter 256GB", supplierName: "PT. Jaya Elektronik", buyPrice: 16000000, sellPrice: 18000000, initialStock: 3, currentStock: 3 },
        { id: batch3, productId: prod2, supplierId: sup1, variant: "SEIN 256GB", supplierName: "CV. Makmur Jaya", buyPrice: 12000000, sellPrice: 14000000, initialStock: 4, currentStock: 4 },
        { id: batch4, productId: prod3, supplierId: sup3, variant: "Original", supplierName: "UD. Berkah Selalu", buyPrice: 1500000, sellPrice: 2000000, initialStock: 10, currentStock: 8 },
        { id: batch5, productId: prod4, supplierId: sup3, variant: "OEM", supplierName: "UD. Berkah Selalu", buyPrice: 150000, sellPrice: 250000, initialStock: 20, currentStock: 15 },
        { id: batch6, productId: prod5, supplierId: sup2, variant: "Soft Case Black", supplierName: "PT. Jaya Elektronik", buyPrice: 25000, sellPrice: 50000, initialStock: 50, currentStock: 45 }
    ]).onConflictDoNothing();

    // Update product stock totals
    await db.update(products).set({ stock: 6 }).where(eq(products.id, prod1));
    await db.update(products).set({ stock: 4 }).where(eq(products.id, prod2));
    await db.update(products).set({ stock: 8 }).where(eq(products.id, prod3));
    await db.update(products).set({ stock: 15 }).where(eq(products.id, prod4));
    await db.update(products).set({ stock: 45 }).where(eq(products.id, prod5));

    // ============================================
    // 7. PURCHASES
    // ============================================
    console.log("Creating purchases...");
    const po1 = "PO-00000001";
    const po2 = "PO-00000002";

    await db.insert(purchases).values([
        { id: po1, supplierId: sup1, userId: adminId, totalAmount: 123000000, notes: "Pembelian awal iPhone & Samsung" },
        { id: po2, supplierId: sup3, userId: adminId, totalAmount: 18000000, notes: "Restok sparepart LCD & Baterai" }
    ]).onConflictDoNothing();

    await db.insert(purchaseItems).values([
        { purchaseId: po1, productId: prod1, variant: "Original 128GB", qtyOrdered: 5, qtyReceived: 5, buyPrice: 15000000, sellPrice: 17000000, batchId: batch1 },
        { purchaseId: po1, productId: prod2, variant: "SEIN 256GB", qtyOrdered: 4, qtyReceived: 4, buyPrice: 12000000, sellPrice: 14000000, batchId: batch3 },
        { purchaseId: po2, productId: prod3, variant: "Original", qtyOrdered: 10, qtyReceived: 10, buyPrice: 1500000, sellPrice: 2000000, batchId: batch4 },
        { purchaseId: po2, productId: prod4, variant: "OEM", qtyOrdered: 20, qtyReceived: 20, buyPrice: 150000, sellPrice: 250000, batchId: batch5 }
    ]).onConflictDoNothing();

    // ============================================
    // 8. SALES
    // ============================================
    console.log("Creating sales...");
    const sale1 = "SAL-0000001";
    const sale2 = "SAL-0000002";

    await db.insert(sales).values([
        { id: sale1, memberId: cust1, customerName: "Andi Wijaya", totalAmount: 17000000, discountAmount: 850000, finalAmount: 16150000, paymentMethod: "cash" as const, paymentStatus: "paid" as const, userId: kasirId, notes: "Pembelian iPhone" },
        { id: sale2, memberId: cust2, customerName: "Budi Santoso", totalAmount: 250000, discountAmount: 0, finalAmount: 250000, paymentMethod: "mixed" as const, paymentStatus: "unpaid" as const, userId: kasirId, notes: "Beli baterai - tempo" }
    ]).onConflictDoNothing();

    await db.insert(salePayments).values([
        { saleId: sale1, method: "cash", amount: 16150000 },
        { saleId: sale2, method: "tempo", amount: 250000 }
    ]).onConflictDoNothing();

    await db.insert(saleItems).values([
        { saleId: sale1, productId: prod1, batchId: batch1, variant: "Original 128GB", qty: 1, price: 17000000, subtotal: 17000000 },
        { saleId: sale2, productId: prod4, batchId: batch5, variant: "OEM", qty: 1, price: 250000, subtotal: 250000 }
    ]).onConflictDoNothing();

    // ============================================
    // 9. SERVICES
    // ============================================
    console.log("Creating services...");
    const currentYear = new Date().getFullYear();

    await db.insert(services).values([
        {
            no: `SRV-${currentYear}-001`,
            customer: { name: "Doni Prasetyo", phone: "084444444444", address: "Jl. Merdeka No. 10" },
            device: { brand: "iPhone", model: "iPhone 12 Pro Max", imei: "123456789012345", equipment: "Unit + Charger" },
            complaint: "Layar retak dan baterai boros",
            diagnosis: "LCD pecah, baterai 70%",
            status: "dikerjakan",
            technicianId: teknisiId,
            createdBy: adminId,
            costEstimate: 2500000
        },
        {
            no: `SRV-${currentYear}-002`,
            customer: { name: "Eka Putri", phone: "085555555555" },
            device: { brand: "Samsung", model: "Galaxy A54", equipment: "Unit saja" },
            complaint: "Tidak bisa charge",
            status: "antrian",
            createdBy: kasirId,
            costEstimate: 350000
        },
        {
            no: `SRV-${currentYear}-003`,
            customer: { name: "Fajar Rahman", phone: "086666666666", address: "Jl. Asia Afrika No. 20" },
            device: { brand: "Xiaomi", model: "Redmi Note 12", imei: "987654321098765" },
            complaint: "Mati total setelah jatuh ke air",
            diagnosis: "Mesin korosi, kemungkinan ganti mesin",
            status: "konfirmasi",
            technicianId: teknisiId,
            createdBy: adminId,
            costEstimate: 1500000
        }
    ]).onConflictDoNothing();

    console.log("\n✅ Database seeded successfully!");
    console.log("=".repeat(50));
    console.log("Users: admin/admin, teknisi/teknisi, kasir/kasir");
    console.log("=".repeat(50));
}

main().catch(console.error);
