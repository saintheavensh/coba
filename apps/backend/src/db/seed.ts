
import { db } from "./index";
import { roles, users, userRoles } from "./schema";
import { eq } from "drizzle-orm";

async function seed() {
    console.log("🌱 Seeding database...");

    try {
        // 1. Create Roles
        console.log("Creating roles...");
        const rolesToSeed = [
            {
                id: "super_admin",
                name: "Super Admin",
                permissions: ["all"],
            },
            {
                id: "owner",
                name: "Owner",
                permissions: ["analytics.view", "report.read", "all"], // Strategic oversight
            },
            {
                id: "manager",
                name: "Manager",
                permissions: ["service.read", "service.update", "report.read", "employee.manage", "sale.confirm"],
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
            },
            {
                id: "warehouse",
                name: "Warehouse",
                permissions: ["inventory.manage", "purchase.create"],
            }
        ];

        for (const role of rolesToSeed) {
            await db.insert(roles).values(role).onConflictDoUpdate({
                target: roles.id,
                set: { name: role.name, permissions: role.permissions }
            });
        }

        // Optional: Clean up old 'admin' role if it exists to avoid confusion with 'manager'
        await db.delete(roles).where(eq(roles.id, "admin"));

        // 2. Create Users
        console.log("Creating test users...");
        const hashedPassword = await Bun.password.hash("password123");

        const usersToSeed = [
            {
                id: "user-super-001",
                username: "superadmin",
                password: hashedPassword,
                name: "Master Architect",
                role: "super_admin",
                isActive: true,
            },
            {
                id: "user-owner-001",
                username: "owner",
                password: hashedPassword,
                name: "Business Owner",
                role: "owner",
                isActive: true,
            },
            {
                id: "user-manager-001",
                username: "manager",
                password: hashedPassword,
                name: "Test Manager",
                role: "manager",
                isActive: true,
            },
            {
                id: "user-teknisi-001",
                username: "teknisi",
                password: hashedPassword,
                name: "Test Technician",
                role: "teknisi",
                isActive: true,
            },
            {
                id: "user-kasir-001",
                username: "kasir",
                password: hashedPassword,
                name: "Test Cashier",
                role: "kasir",
                isActive: true,
            },
            {
                id: "user-warehouse-001",
                username: "warehouse",
                password: hashedPassword,
                name: "Test Warehouse",
                role: "warehouse",
                isActive: true,
            }
        ];

        // Clear existing user roles to avoid conflicts during manual re-seed
        await db.delete(userRoles);

        for (const user of usersToSeed) {
            await db.insert(users).values(user).onConflictDoUpdate({
                target: users.id,
                set: {
                    username: user.username,
                    password: user.password,
                    role: user.role,
                    name: user.name,
                    isActive: user.isActive
                }
            });

            // Assign initial role to user_roles table
            await db.insert(userRoles).values({
                userId: user.id,
                role: user.role
            }).onConflictDoNothing();
        }

        // All accounts are primary assigned in the loop above.

        console.log("✅ Seeding complete!");
        console.log("--------------------------------");
        console.log("All accounts use password: password123");
        console.log("- superadmin");
        console.log("- owner");
        console.log("- manager");
        console.log("- teknisi");
        console.log("- kasir");
        console.log("- warehouse");
        console.log("--------------------------------");
        process.exit(0);

    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seed();
