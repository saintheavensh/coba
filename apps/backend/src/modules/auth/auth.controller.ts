import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { loginSchema } from "@repo/shared";
import { AuthService } from "./auth.service";

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
// app.post("/register", ...)

// Get users by role (for technician selection, etc.)
app.get("/users", async (c) => {
    try {
        const role = c.req.query("role") as "admin" | "teknisi" | "kasir" | undefined;
        if (!role || !["admin", "teknisi", "kasir"].includes(role)) {
            return c.json({ success: false, message: "Invalid or missing role parameter" }, 400);
        }
        const users = await service.getUsersByRole(role);
        return c.json({ success: true, data: users });
    } catch (e) {
        return c.json({ success: false, message: String(e) }, 500);
    }
});

export default app;
