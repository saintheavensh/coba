import { vi, describe, it, expect, beforeEach } from "vitest";
import { AuthController } from "../presentation/auth.controller";
import {
    createMockContext,
    createMockUser
} from "../../../../test/factories";

// Mock "hono/cookie"
vi.mock("hono/cookie", () => ({
    setCookie: vi.fn(),
    deleteCookie: vi.fn(),
    getCookie: vi.fn(),
}));
import { setCookie } from "hono/cookie";

const mockLoginExecute = vi.fn();
const mockGetCurrentUserExecute = vi.fn();
vi.mock("../auth-container", () => ({
    loginUseCase: { execute: (...args: unknown[]) => mockLoginExecute(...args) },
    getCurrentUserUseCase: { execute: (...args: unknown[]) => mockGetCurrentUserExecute(...args) },
}));

describe("AuthController", () => {
    let controller: AuthController;

    beforeEach(() => {
        vi.clearAllMocks();
        controller = new AuthController();
    });

    describe("login", () => {
        it("should return 400 if username or password missing", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "json").mockResolvedValue({});

            const res = await controller.login(ctx);

            expect(res.status).toBe(400);
            const json = await res.json() as any;
            expect(json.success).toBe(false);
            expect(json.message).toBe("Validation Error");
            expect(json.errors).toContain("Username and password are required");
        });

        it("should return 401 if login fails (invalid credentials)", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "json").mockResolvedValue({ username: "test", password: "wrong" });

            mockLoginExecute.mockRejectedValue(new Error("Invalid username or password"));

            const res = await controller.login(ctx);

            expect(res.status).toBe(401);
            const json = await res.json() as any;
            expect(json.success).toBe(false);
            expect(json.message).toBe("Unauthorized");
            expect(json.errors).toContain("Invalid username or password");
        });

        it("should return 200, token, and set cookie on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "json").mockResolvedValue({ username: "admin", password: "password" });

            const mockUser = createMockUser({ username: "admin" });
            const mockResult = {
                user: mockUser,
                token: "mock-jwt-token"
            };

            mockLoginExecute.mockResolvedValue(mockResult);

            const res = await controller.login(ctx);

            expect(res.status).toBe(200);
            const json = await res.json() as any;
            expect(json.success).toBe(true);
            expect(json.data.token).toBe("mock-jwt-token");

            expect(setCookie).toHaveBeenCalledWith(
                ctx,
                "auth_token",
                "mock-jwt-token",
                expect.objectContaining({
                    httpOnly: true,
                    path: "/"
                })
            );
        });

        it("should return 500 on unexpected error", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "json").mockResolvedValue({ username: "admin", password: "password" });

            mockLoginExecute.mockRejectedValue(new Error("DB Connection Failed"));

            const res = await controller.login(ctx);

            expect(res.status).toBe(500);
        });
    });

    describe("logout", () => {
        it("should clear cookie and return 200", async () => {
            const ctx = createMockContext();

            const res = await controller.logout(ctx);

            expect(res.status).toBe(200);

            expect(setCookie).toHaveBeenCalledWith(
                ctx,
                "auth_token",
                "",
                expect.objectContaining({
                    maxAge: 0
                })
            );
        });
    });

    describe("me", () => {
        it("should return 401 if not authenticated", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx, "get").mockReturnValue(undefined);

            const res = await controller.me(ctx);

            expect(res.status).toBe(401);
        });

        it("should return 200 and user data if authenticated", async () => {
            const ctx = createMockContext();
            const mockPayload = { id: "user-1" };
            const mockUser = createMockUser();
            vi.spyOn(ctx, "get").mockReturnValue(mockPayload);
            mockGetCurrentUserExecute.mockResolvedValue({ user: mockUser });

            const res = await controller.me(ctx);

            expect(res.status).toBe(200);
            const json = await res.json() as any;
            expect(json.success).toBe(true);
            expect(json.data).toEqual(mockUser);
        });
    });
});
