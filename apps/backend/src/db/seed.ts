import { db } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("🌱 Seeding database...");

    // Check if admin exists
    const existingAdmin = await db.query.users.findFirst({
        where: eq(users.username, "admin")
    });

    if (existingAdmin) {
        console.log("⚠️  Admin user already exists. Skipping.");
        return;
    }

    // Create admin
    const passwordHash = await Bun.password.hash("admin", {
        algorithm: "bcrypt",
        cost: 10,
    });

    await db.insert(users).values({
        id: crypto.randomUUID(),
        username: "admin",
        password: passwordHash,
        name: "Admin Store",
        role: "admin"
    });

    console.log("✅ Admin user created (username: admin, password: admin)");
}

main().catch((e) => {
    console.error("❌ Seeding failed");
    console.error(e);
    process.exit(1);
});
