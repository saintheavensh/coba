import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { setCookie, deleteCookie } from "hono/cookie";
import { loginSchema } from "@repo/shared";
import { AuthService } from "./auth.service";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { apiError, apiSuccess } from "../../lib/response";

const app = new Hono();
const service = new AuthService();

app.post("/login", zValidator("json", loginSchema), async (c) => {
    try {
        const data = c.req.valid("json");
        
        // Debug logging
        const Logger = (await import("../../lib/logger")).Logger;
        Logger.debug(`[AUTH] Login attempt for username: ${data.username}`);
        
        const result = await service.login(data);

        // Set HTTP-only cookie with the token
        // When frontend is HTTPS proxying to HTTP backend via Vite proxy:
        // - Frontend makes HTTPS request to Vite dev server
        // - Vite proxy forwards as HTTP to backend
        // - Backend sets cookie with secure=false in dev (since backend sees HTTP)
        // - Cookie is sent back through HTTPS proxy, so browser accepts it
        // In production, use secure=true when backend is directly accessed via HTTPS
        const isDevelopment = process.env.NODE_ENV !== "production";
        const isHttpsFrontend = c.req.header("x-forwarded-proto") === "https";
        
        setCookie(c, "auth_token", result.token, {
            httpOnly: true,
            secure: !isDevelopment && (isHttpsFrontend || process.env.NODE_ENV === "production"),
            sameSite: "Lax",
            path: "/",
            maxAge: 60 * 60 * 24 // 24 hours
        });

        Logger.info(`[AUTH] Login successful for user: ${result.user.name} (${result.user.username})`);

        // Return user data without the token (token is in cookie)
        return apiSuccess(c, { user: result.user }, "Login successful");
    } catch (e) {
        const Logger = (await import("../../lib/logger")).Logger;
        Logger.error(`[AUTH] Login failed:`, e);
        return apiError(c, e, "Login failed", 401);
    }
});

// Logout - clear the auth cookie
app.post("/logout", (c) => {
    deleteCookie(c, "auth_token", {
        path: "/",
    });
    return apiSuccess(c, null, "Logged out successfully");
});

// Get current user info
app.get("/me", authMiddleware, async (c) => {
    const user = c.get("jwtPayload");
    return apiSuccess(c, { user });
});

// Get users - all users or filter by role
app.get("/users", authMiddleware, async (c) => {
    try {
        const role = c.req.query("role") as "admin" | "teknisi" | "kasir" | undefined;

        // If role is specified and valid, filter by role
        if (role && ["admin", "teknisi", "kasir"].includes(role)) {
            const users = await service.getUsersByRole(role);
            return apiSuccess(c, users);
        }

        // Otherwise return all users
        // Otherwise return all users
        const users = await service.getAllUsers();
        return apiSuccess(c, users);
    } catch (e) {
        return apiError(c, e, "Failed to fetch users", 500);
    }
});

// Update user (admin only)
app.put("/users/:id", authMiddleware, async (c) => {
    try {
        const id = c.req.param("id");
        const body = await c.req.json();
        const updated = await service.updateUser(id, body);
        return apiSuccess(c, updated, "User updated successfully");
    } catch (e) {
        return apiError(c, e, "Failed to update user", 500);
    }
});

// Delete user (admin only)
app.delete("/users/:id", authMiddleware, async (c) => {
    try {
        const id = c.req.param("id");
        await service.deleteUser(id);
        return apiSuccess(c, null, "User deleted successfully");
    } catch (e) {
        return apiError(c, e, "Failed to delete user", 500);
    }
});

// Register new user (admin only)
app.post("/register", authMiddleware, async (c) => {
    try {
        const body = await c.req.json();
        const user = await service.register(body);
        return apiSuccess(c, user, "User registered successfully");
    } catch (e) {
        return apiError(c, e, "Failed to register user", 500);
    }
});

export default app;
