import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const authMiddleware = createMiddleware(async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
        return c.json({ message: "Unauthorized" }, 401);
    }

    const token = authHeader.split(" ")[1];
    try {
        const payload = await verify(token, JWT_SECRET);
        c.set("user", payload);
        await next();
    } catch (e) {
        return c.json({ message: "Invalid Token" }, 401);
    }
});
