import { db } from "./index";
import { users, categories, products, suppliers, services, settings } from "./schema";
import { sql } from "drizzle-orm";

async function seed() {
    console.log("🌱 Starting database seeding...");

    try {
        // 1. Clean up existing data (optional, be careful in prod)
        // await db.delete(services);
        // await db.delete(products);
        // await db.delete(suppliers);
        // await db.delete(categories);
        // await db.delete(users);
        // await db.delete(settings);

        // 2. Seed Users
        console.log("Creating users...");
        const passwordHash = await Bun.password.hash("123456", {
            algorithm: "bcrypt",
            cost: 10,
        });

        await db.insert(users).values([
            {
                id: "USR-001",
                username: "admin",
                password: passwordHash,
                role: "admin",
                name: "Administrator",
            },
            {
                id: "USR-002",
                username: "teknisi",
                password: passwordHash,
                role: "teknisi",
                name: "Budi Teknisi",
            },
            {
                id: "USR-003",
                username: "kasir",
                password: passwordHash,
                role: "kasir",
                name: "Siti Kasir",
            },
        ]).onConflictDoNothing();

        // 3. Seed Categories
        console.log("Creating categories...");
        await db.insert(categories).values([
            { id: "CAT-001", name: "Handphone", description: "Smartphone Android & iOS" },
            { id: "CAT-002", name: "Laptop", description: "Notebook, Macbook, Charger" },
            { id: "CAT-003", name: "Aksesoris", description: "Casing, Tempered Glass, Kabel" },
            { id: "CAT-004", name: "Sparepart", description: "LCD, Baterai, Flexible, IC" },
            { id: "CAT-005", name: "Jasa Service", description: "Biaya jasa perbaikan" },
        ]).onConflictDoNothing();

        // 4. Seed Suppliers
        console.log("Creating suppliers...");
        await db.insert(suppliers).values([
            {
                id: "SUP-001",
                name: "PT. Global Teknologi",
                contact: "Andi Sales",
                phone: "08123456789",
                address: "Jakarta Pusat",
                image: "https://api.dicebear.com/7.x/initials/svg?seed=GT",
                brands: [
                    { name: "Samsung", category: "Handphone" },
                    { name: "Xiaomi", category: "Handphone" },
                    { name: "Oppo", category: "Handphone" }
                ]
            },
            {
                id: "SUP-002",
                name: "CV. Sparepart Jaya",
                contact: "Budi",
                phone: "08198765432",
                address: "Roxy Mas, Jakarta",
                image: "https://api.dicebear.com/7.x/initials/svg?seed=SJ",
                brands: [
                    { name: "LCD Original", category: "Sparepart" },
                    { name: "Baterai Double Power", category: "Sparepart" }
                ]
            },
            {
                id: "SUP-003",
                name: "iStore Distributor",
                contact: "Cindy",
                phone: "08567890123",
                address: "Mangga Dua Mall",
                image: "https://api.dicebear.com/7.x/initials/svg?seed=ID",
                brands: [
                    { name: "Apple", category: "Handphone" },
                    { name: "Macbook", category: "Laptop" },
                    { name: "Anker", category: "Aksesoris" }
                ]
            }
        ]).onConflictDoNothing();

        // 5. Seed Products (Inventory)
        console.log("Creating products...");
        await db.insert(products).values([
            {
                id: "PRD-001",
                code: "899001",
                name: "Samsung Galaxy A54 5G 8/256GB",
                categoryId: "CAT-001",
                stock: 5,
                minStock: 2,
            },
            {
                id: "PRD-002",
                code: "899002",
                name: "Iphone 11 128GB Ex-Inter",
                categoryId: "CAT-001",
                stock: 3,
                minStock: 1,
            },
            {
                id: "PRD-003",
                code: "ACC-001",
                name: "Kabel Data Type-C Fast Charging",
                categoryId: "CAT-003",
                stock: 50,
                minStock: 10,
            },
            {
                id: "PRD-004",
                code: "PART-001",
                name: "LCD Samsung A51 OLED",
                categoryId: "CAT-004",
                stock: 2,
                minStock: 1,
            }
        ]).onConflictDoNothing();

        // 6. Seed Settings
        console.log("Creating settings...");
        await db.insert(settings).values([
            {
                key: "store_info",
                value: {
                    name: "Saint Heavens Cell",
                    address: "Jl. Contoh No. 123, Jakarta",
                    phone: "0812-3333-4444",
                    email: "info@saintheavens.com"
                }
            },
            {
                key: "printer_config",
                value: {
                    type: "thermal_58mm",
                    autoPrint: true
                }
            }
        ]).onConflictDoNothing();

        console.log("✅ Database seeded successfully!");
    } catch (error) {
        console.error("❌ Error seeding database:", error);
    }
}

seed();
