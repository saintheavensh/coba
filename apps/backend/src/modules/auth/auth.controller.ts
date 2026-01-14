import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { loginSchema } from "@repo/shared";
import { AuthService } from "./auth.service";
import { authMiddleware } from "../../middlewares/auth.middleware";

const app = new Hono();
const service = new AuthService();

app.post("/login", zValidator("json", loginSchema), async (c) => {
    try {
        const data = c.req.valid("json");
        const result = await service.login(data);
        return c.json(result);
    } catch (e) {
        return c.json({ message: String(e) }, 401);
    }
});

// Register endpoint (Optional, usually admin only)
// app.post("/register", ...);

// Get users - all users or filter by role
app.get("/users", authMiddleware, async (c) => {
    try {
        const role = c.req.query("role") as "admin" | "teknisi" | "kasir" | undefined;

        // If role is specified and valid, filter by role
        if (role && ["admin", "teknisi", "kasir"].includes(role)) {
            const users = await service.getUsersByRole(role);
            return c.json({ success: true, data: users });
        }

        // Otherwise return all users
        const users = await service.getAllUsers();
        return c.json({ success: true, data: users });
    } catch (e) {
        return c.json({ success: false, message: String(e) }, 500);
    }
});

// Update user (admin only)
app.put("/users/:id", authMiddleware, async (c) => {
    try {
        const id = c.req.param("id");
        const body = await c.req.json();
        const updated = await service.updateUser(id, body);
        return c.json({ success: true, data: updated });
    } catch (e) {
        return c.json({ success: false, message: String(e) }, 500);
    }
});

// Delete user (admin only)
app.delete("/users/:id", authMiddleware, async (c) => {
    try {
        const id = c.req.param("id");
        await service.deleteUser(id);
        return c.json({ success: true });
    } catch (e) {
        return c.json({ success: false, message: String(e) }, 500);
    }
});

// Register new user (admin only)
app.post("/register", authMiddleware, async (c) => {
    try {
        const body = await c.req.json();
        const user = await service.register(body);
        return c.json({ success: true, data: user });
    } catch (e) {
        return c.json({ success: false, message: String(e) }, 500);
    }
});

export default app;
