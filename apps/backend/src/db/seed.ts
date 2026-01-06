import { db } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Seeding database...");

    // Create or Update Admin User
    const hashedPassword = await Bun.password.hash("admin");

    const existingAdmin = await db.query.users.findFirst({
        where: eq(users.username, "admin")
    });

    if (!existingAdmin) {
        await db.insert(users).values({
            id: "USR-ADMIN",
            username: "admin",
            password: hashedPassword,
            name: "Administrator",
            role: "admin",
            createdAt: new Date()
        });
        console.log("✅ Admin user created.");
    } else {
        // Force update password
        await db.update(users)
            .set({ password: hashedPassword })
            .where(eq(users.username, "admin"));
        console.log("🔄 Admin password reset to 'admin'.");
    }

    // Create Teknisi User (for filtering test)
    const existingTeknisi = await db.query.users.findFirst({
        where: eq(users.username, "teknisi")
    });

    if (!existingTeknisi) {
        const hashedPassword = await Bun.password.hash("teknisi");
        await db.insert(users).values({
            id: "USR-TEKNISI",
            username: "teknisi",
            password: hashedPassword,
            name: "Budi Teknisi",
            role: "teknisi",
            createdAt: new Date()
        });
        console.log("✅ Teknisi user created: teknisi / teknisi");
    } else {
        console.log("ℹ️ Teknisi user already exists.");
    }
}

main().catch(console.error);
