import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { getCookie } from "hono/cookie";
import { apiError } from "../shared/application/middlewares/ResponseHelpers";
import { appConfig } from "../shared/infrastructure/config/AppConfig";

export const authMiddleware = createMiddleware(async (c, next) => {
    const JWT_SECRET = appConfig.jwtSecret;
    // Try to get token from cookie first (preferred), then fallback to Authorization header
    let token = getCookie(c, "auth_token");

    // Fallback to Authorization header for API clients
    if (!token) {
        const authHeader = c.req.header("Authorization");
        if (authHeader) {
            token = authHeader.split(" ")[1];
        }
    }

    if (!token) {
        console.log("[AuthMiddleware] No token found in cookies or headers");
        return apiError(c, "No token provided", "Unauthorized", 401);
    }

    try {
        const payload = await verify(token, JWT_SECRET, "HS256");
        c.set("jwtPayload", payload);
        c.set("user", payload); // Also set as "user" for controllers
        await next();
    } catch (e: any) {
        console.error("[AuthMiddleware] Token verification failed:", e.message);
        console.log("[AuthMiddleware] Token used:", token.substring(0, 10) + "...");
        console.log("[AuthMiddleware] Secret exists:", !!JWT_SECRET);
        return apiError(c, e, "Invalid Token", 401);
    }
});

