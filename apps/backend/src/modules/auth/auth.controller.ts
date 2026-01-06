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

export default app;
