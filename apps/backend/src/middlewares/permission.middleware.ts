import { createMiddleware } from "hono/factory";
import { Context, Next } from "hono";
import { apiError } from "../lib/response";

export const permissionGuard = (requiredPermission: string) => {
    return createMiddleware(async (c: Context, next: Next) => {
        const user = c.get("jwtPayload");

        if (!user) {
            return apiError(c, "No user user found in context", "Unauthorized", 401);
        }

        // Admin has all permissions (convention) or if specifically granted
        // Our seed gave admin ["*"]
        const permissions = (user.permissions as string[]) || [];

        if (permissions.includes("*")) {
            await next();
            return;
        }

        if (permissions.includes(requiredPermission)) {
            await next();
            return;
        }

        return apiError(c, `Missing permission: ${requiredPermission}`, "Forbidden", 403);
    });
};
