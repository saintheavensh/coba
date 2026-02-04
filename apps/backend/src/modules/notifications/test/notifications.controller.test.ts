import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { NotificationsController } from "../controllers/notifications.controller";
import { NotificationsService } from "../services/notifications.service";
import { createMockContext } from "../../../../test/factories";

describe("NotificationsController", () => {
    // Spies - NotificationsService used via an instance at the top level of the controller file
    let getUserNotificationsSpy: any;
    let markAsReadSpy: any;
    let createNotificationSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();

        getUserNotificationsSpy = vi.spyOn(NotificationsService.prototype, "getUserNotifications").mockResolvedValue([]);
        markAsReadSpy = vi.spyOn(NotificationsService.prototype, "markAsRead").mockResolvedValue({} as any);
        createNotificationSpy = vi.spyOn(NotificationsService.prototype, "createNotification").mockResolvedValue({} as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("getUserNotifications", () => {
        it("should return 200 and list", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "query").mockReturnValue("user-1");
            const res = await NotificationsController.getUserNotifications(ctx);
            expect(res.status).toBe(200);
        });

        it("should return 400 if userId missing", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "query").mockReturnValue(undefined);
            const res = await NotificationsController.getUserNotifications(ctx);
            expect(res.status).toBe(400);
            const json = await res.json() as any;
            expect(json.errors[0]).toBe("userId required");
        });

        it("should return 500 on error", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "query").mockReturnValue("u-1");
            getUserNotificationsSpy.mockRejectedValue(new Error("Err"));
            const res = await NotificationsController.getUserNotifications(ctx);
            expect(res.status).toBe(500);
        });
    });

    describe("markAsRead", () => {
        it("should return 200 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("1");
            const res = await NotificationsController.markAsRead(ctx);
            expect(res.status).toBe(200);
        });

        it("should return 400 on invalid ID", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("abc");
            const res = await NotificationsController.markAsRead(ctx);
            expect(res.status).toBe(400);
        });
    });

    describe("createNotification", () => {
        it("should return 200 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "json").mockResolvedValue({ userId: "u1", type: "t", title: "T", message: "M" });
            const res = await NotificationsController.createNotification(ctx);
            expect(res.status).toBe(200);
        });
    });
});
