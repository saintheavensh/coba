import { db } from "./index";
import { users, suppliers, categories, products, productBatches } from "./schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function main() {
    console.log("Seeding database...");

    // 1. Users
    const hashedPassword = await Bun.password.hash("admin");
    await db.insert(users).values({
        id: "USR-ADMIN",
        username: "admin",
        password: hashedPassword,
        name: "Administrator",
        role: "admin",
        createdAt: new Date()
    }).onConflictDoNothing();

    // 2. Categories
    const catId = "CAT-HP";
    await db.insert(categories).values({
        id: catId,
        name: "Handphone",
        description: "Smartphone dan Tablet"
    }).onConflictDoNothing();

    // 3. Suppliers
    const supId = "SUP-001";
    await db.insert(suppliers).values({
        id: supId,
        name: "CV. Makmur Jaya",
        contact: "Budi",
        phone: "08123456789",
        address: "Jakarta Pusat"
    }).onConflictDoNothing();

    // 4. Products
    const prodId = "PRD-001";
    await db.insert(products).values({
        id: prodId,
        code: "IP13PRO",
        name: "iPhone 13 Pro",
        categoryId: catId,
        stock: 10,
        minStock: 2
    }).onConflictDoNothing();

    // 5. Batches (Initial Stock)
    await db.insert(productBatches).values({
        id: "BATCH-001",
        productId: prodId,
        supplierId: supId,
        variant: "Inter 128GB",
        supplierName: "CV. Makmur Jaya",
        buyPrice: 10000000,
        sellPrice: 12000000,
        initialStock: 10,
        currentStock: 10,
        createdAt: new Date()
    }).onConflictDoNothing();

    // 6. Defective Items (Sample)
    // Optional: Leave empty for testing Manual Add

    console.log("✅ Database seeded successfully!");
}

main().catch(console.error);
