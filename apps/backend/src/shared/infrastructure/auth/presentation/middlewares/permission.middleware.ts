import { createMiddleware } from "hono/factory";
import { db } from "../../../../infrastructure/database/client";
import { roles } from "../../../../infrastructure/database/schema";
import { eq } from "drizzle-orm";

/**
 * In-memory cache of role -> permissions[] to avoid DB hits on every request.
 * Cache is populated on first use and refreshed every 5 minutes.
 */
let permissionCache: Map<string, string[]> = new Map();
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getRolePermissions(roleId: string): Promise<string[]> {
    // Check cache freshness
    if (Date.now() - cacheTimestamp > CACHE_TTL) {
        permissionCache.clear();
        cacheTimestamp = Date.now();
    }

    // Return from cache if available
    if (permissionCache.has(roleId)) {
        return permissionCache.get(roleId)!;
    }

    // Query DB and cache the result
    const role = await db.select({ permissions: roles.permissions }).from(roles).where(eq(roles.id, roleId)).limit(1);
    const perms = (role[0]?.permissions as string[]) || [];
    permissionCache.set(roleId, perms);
    return perms;
}

/**
 * Permission-based middleware.
 * Checks if the authenticated user's role has ANY of the required permissions.
 * The "all" permission (super_admin/owner) bypasses all checks.
 *
 * Usage: requirePermission("sale.create", "sale.manage")
 * → User passes if their role has "sale.create" OR "sale.manage" OR "all"
 */
export function requirePermission(...requiredPermissions: string[]) {
    return createMiddleware(async (c, next) => {
        const user = c.get("user") as any;
        if (!user?.role) {
            return c.json({
                success: false,
                message: "Forbidden",
                errors: ["Authentication required"],
                error_code: "FORBIDDEN"
            }, 403);
        }

        const userRole = typeof user.role === "object" ? user.role.id : user.role;
        const rolePerms = await getRolePermissions(userRole);

        // "all" permission bypasses every check (super_admin, owner)
        if (rolePerms.includes("all")) {
            await next();
            return;
        }

        // Check if user has any of the required permissions
        const hasPermission = requiredPermissions.some(p => rolePerms.includes(p));
        if (!hasPermission) {
            return c.json({
                success: false,
                message: "Forbidden",
                errors: [`Insufficient permissions. Required: ${requiredPermissions.join(" or ")}`],
                error_code: "FORBIDDEN"
            }, 403);
        }

        await next();
    });
}

/**
 * Role-based middleware (simpler alternative).
 * Checks if the user's role is in the allowed list.
 * super_admin always passes.
 *
 * Usage: requireRole("kasir", "manager")
 */
export function requireRole(...allowedRoles: string[]) {
    return createMiddleware(async (c, next) => {
        const user = c.get("user") as any;
        if (!user?.role) {
            return c.json({
                success: false,
                message: "Forbidden",
                errors: ["Authentication required"],
                error_code: "FORBIDDEN"
            }, 403);
        }

        const userRole = typeof user.role === "object" ? user.role.id : user.role;

        // super_admin always bypasses
        if (userRole === "super_admin") {
            await next();
            return;
        }

        if (!allowedRoles.includes(userRole)) {
            return c.json({
                success: false,
                message: "Forbidden",
                errors: [`Role '${userRole}' is not authorized for this action`],
                error_code: "FORBIDDEN"
            }, 403);
        }

        await next();
    });
}

/** Utility to clear the permission cache (useful for tests or after role updates) */
export function clearPermissionCache() {
    permissionCache.clear();
    cacheTimestamp = 0;
}

/** @deprecated Use requirePermission() instead. Kept for backward compatibility. */
export const permissionGuard = requirePermission;
