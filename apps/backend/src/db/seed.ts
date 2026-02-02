
import { db } from "./index";
import { roles, users } from "./schema";
import { v4 as uuidv4 } from "uuid";
// NOTE: In a real app, you should hash passwords. 
// For this seeder, we assume the backend handles hashing or we store plain text for dev (NOT RECOMMENDED for production).
// Since the schema says 'password' is text, we will just insert a string.
// Ideally, import your hashing utility here.

async function seed() {
    console.log("🌱 Seeding database...");

    try {
        // 1. Create Roles
        console.log("Creating roles...");
        await db.insert(roles).values([
            {
                id: "admin",
                name: "Administrator",
                permissions: ["all"],
            },
            {
                id: "teknisi",
                name: "Teknisi",
                permissions: ["service.read", "service.update"],
            },
            {
                id: "kasir",
                name: "Kasir",
                permissions: ["sale.create", "sale.read"],
            }
        ]).onConflictDoNothing();

        // 2. Create Admin User
        console.log("Creating admin user...");
        // Generate a stable UUID for admin or use a random one
        const adminId = "user-admin-001";

        const hashedPassword = await Bun.password.hash("password123");

        await db.insert(users).values({
            id: adminId,
            username: "admin",
            password: hashedPassword,
            name: "Super Admin",
            role: "admin",
            isActive: true,
        }).onConflictDoUpdate({
            target: users.id,
            set: {
                password: hashedPassword,
                role: "admin",
                isActive: true
            }
        });

        console.log("✅ Seeding complete!");
        console.log("--------------------------------");
        console.log("User: admin");
        console.log("Pass: password123");
        console.log("--------------------------------");
        process.exit(0);

    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seed();
