import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { getCookie } from "hono/cookie";
import { apiError } from "../lib/response";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const authMiddleware = createMiddleware(async (c, next) => {
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
        return apiError(c, "No token provided", "Unauthorized", 401);
    }

    try {
        const payload = await verify(token, JWT_SECRET);
        c.set("jwtPayload", payload);
        await next();
    } catch (e) {
        return apiError(c, e, "Invalid Token", 401);
    }
});
