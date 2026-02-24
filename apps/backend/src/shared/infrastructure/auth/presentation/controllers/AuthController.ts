import { Context } from "hono";
import { apiSuccess, apiError } from "../../../../application/middlewares/ResponseHelpers";
import { setCookie } from "hono/cookie";
import { loginUseCase, getCurrentUserUseCase } from "../../AuthContainer";
import { appConfig } from "../../../../infrastructure/config/AppConfig";

export class AuthController {
    async login(c: Context) {
        try {
            const { username, password } = await c.req.json();

            if (!username || !password) {
                return apiError(c, "Username and password are required", "Validation Error", 400);
            }

            const result = await loginUseCase.execute({ username, password });

            setCookie(c, "auth_token", result.token, {
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
}
