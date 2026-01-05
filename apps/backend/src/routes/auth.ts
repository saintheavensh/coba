import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { sign } from "hono/jwt";

const auth = new Hono();
const SECRET_KEY = "SUPER_SECRET_KEY"; // In production use Bun.env

// Login Schema
const loginSchema = z.object({
    username: z.string(),
    password: z.string()
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
    const { username, password } = c.req.valid("json");

    // Find user
    const user = await db.query.users.findFirst({
        where: eq(users.username, username)
    });

    // Check user & password (Simple comparison for now, assuming mock data or plain text for initial setup)
    // NOTE: In real prod, verify hash. For now, we'll implement simple hash check later or assume text.
    // Let's implement correct hashing if possible.
    // Since we don't have users yet, we need a register or seed.

    if (!user) {
        return c.json({ message: "Invalid credentials" }, 401);
    }

    // Verify password (using Bun.password)
    const valid = await Bun.password.verify(password, user.password);
    if (!valid) {
        return c.json({ message: "Invalid credentials" }, 401);
    }

    // Generate JWT
    const payload = {
        sub: user.id,
        role: user.role,
        name: user.name,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12, // 12 hours
    };

    const token = await sign(payload, SECRET_KEY);

    return c.json({
        token,
        user: {
            id: user.id,
            name: user.name,
            role: user.role
        }
    });
});

// Setup Initial Admin (Dev only helper)
auth.post("/seed", async (c) => {
    const existing = await db.query.users.findFirst({
        where: eq(users.username, "admin")
    });

    if (existing) return c.json({ message: "Admin already exists" });

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

    return c.json({ message: "Admin created (admin/admin)" });
});

export default auth;
