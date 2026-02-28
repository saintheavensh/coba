import { Context } from "hono";
import { apiSuccess, apiError } from "../../../../application/middlewares/ResponseHelpers";
import { setCookie } from "hono/cookie";
import { loginUseCase, getCurrentUserUseCase, switchRoleUseCase } from "../../AuthContainer";
import { appConfig } from "../../../../infrastructure/config/AppConfig";
import { settingsService } from "../../../../../modules/05-shared/settings/settings-container";
import { DEFAULT_ROLE_BEHAVIOR } from "../../../../../modules/05-shared/settings/application/constants";

export class AuthController {
    async login(c: Context) {
        try {
            const { username, password, roleId } = await c.req.json();

            if (!username || !password) {
                return apiError(c, "Username and password are required", "Validation Error", 400);
            }

            const roleBehavior = await settingsService.get("role_behavior", DEFAULT_ROLE_BEHAVIOR);

            const result = await loginUseCase.execute({
                username,
                password,
                roleId,
                roleBehaviorMode: roleBehavior.mode
            });

            if (result.requiresRoleSelection) {
                return apiSuccess(c, {
                    requiresRoleSelection: true,
                    availableRoles: result.availableRoles
                }, "Role selection required");
            }

            setCookie(c, "auth_token", result.token!, {
                httpOnly: true,
                secure: appConfig.isProduction,
                sameSite: "Lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });

            return apiSuccess(c, result, "Login successful");
        } catch (e: any) {
            if (e.message === "Invalid username or password") {
                return apiError(c, e.message, "Unauthorized", 401);
            }
            return apiError(c, e, "Login failed", 500);
        }
    }

    async logout(c: Context) {
        setCookie(c, "auth_token", "", {
            httpOnly: true,
            path: "/",
            maxAge: 0
        });
        return apiSuccess(c, null, "Logged out successfully");
    }

    async me(c: Context) {
        const payload = c.get("user");
        if (!payload) return apiError(c, null, "Not authenticated", 401);

        try {
            const result = await getCurrentUserUseCase.execute({ userId: payload.id });
            if (!result) return apiError(c, null, "User not found", 404);

            return apiSuccess(c, result.user, "OK");
        } catch (e) {
            return apiError(c, e, "Failed to fetch user data", 500);
        }
    }

    async switchRole(c: Context) {
        const payload = c.get("user");
        if (!payload) return apiError(c, null, "Not authenticated", 401);

        try {
            const { roleId } = await c.req.json();
            if (!roleId) return apiError(c, "roleId is required", "Validation Error", 400);

            const result = await switchRoleUseCase.execute({
                userPayload: payload,
                targetRoleId: roleId
            });

            setCookie(c, "auth_token", result.token, {
                httpOnly: true,
                secure: appConfig.isProduction,
                sameSite: "Lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });

            return apiSuccess(c, { role: result.role, token: result.token }, "Role switched successfully");
        } catch (e: any) {
            if (e.message === "Invalid target role") {
                return apiError(c, e.message, "Forbidden", 403);
            }
            return apiError(c, e, "Failed to switch role", 500);
        }
    }
}
