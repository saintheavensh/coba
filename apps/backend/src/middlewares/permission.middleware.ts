import { createMiddleware } from "hono/factory";
import { Context, Next } from "hono";

export const permissionGuard = (requiredPermission: string) => {
    return createMiddleware(async (c: Context, next: Next) => {
        const user = c.get("user");

        if (!user) {
            return c.json({ message: "Unauthorized" }, 401);
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

        return c.json({ message: `Forbidden: Missing permission ${requiredPermission}` }, 403);
    });
};
