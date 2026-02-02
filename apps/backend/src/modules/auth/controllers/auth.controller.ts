import { Context } from "hono";
import { AuthService } from "../services/auth.service";
import { apiSuccess, apiError } from "../../../lib/response";
import { setCookie } from "hono/cookie";

export class AuthController {
    private service: AuthService;

    constructor() {
        this.service = new AuthService();
    }

    async login(c: Context) {
        try {
            const { username, password } = await c.req.json();

            if (!username || !password) {
                return apiError(c, "Username and password are required", "Validation Error", 400);
            }

            const result = await this.service.login(username, password);

            // Set cookie
            setCookie(c, "auth_token", result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "Lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });

            return apiSuccess(c, result, "Login successful");
        } catch (e: any) {
            // Check specific error messages if needed
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
        const user = c.get("user");
        if (!user) return apiError(c, null, "Not authenticated", 401);
        return apiSuccess(c, user);
    }
}
