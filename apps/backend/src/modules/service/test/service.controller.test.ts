import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { ServiceController } from "../controllers/service.controller";
import { ServiceService } from "../services/service.service";
import { createMockContext, createMockUser } from "../../../../test/factories";

describe("ServiceController", () => {
    let controller: ServiceController;

    // Spies - ServiceService methods
    let getAllSpy: any;
    let getCountsSpy: any;
    let getStatsSpy: any;
    let getByIdSpy: any;
    let createServiceSpy: any;
    let updateStatusSpy: any;
    let updateDetailsSpy: any;
    let deleteSpy: any;
    let patchServiceSpy: any;
    let assignTechnicianSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();

        getAllSpy = vi.spyOn(ServiceService.prototype, "getAll").mockResolvedValue([]);
        getCountsSpy = vi.spyOn(ServiceService.prototype, "getCounts").mockResolvedValue({} as any);
        getStatsSpy = vi.spyOn(ServiceService.prototype, "getDashboardStats").mockResolvedValue({} as any);
        getByIdSpy = vi.spyOn(ServiceService.prototype, "getById").mockResolvedValue(null);
        createServiceSpy = vi.spyOn(ServiceService.prototype, "createService").mockResolvedValue({ id: 1 } as any);
        updateStatusSpy = vi.spyOn(ServiceService.prototype, "updateStatus").mockResolvedValue({} as any);
        updateDetailsSpy = vi.spyOn(ServiceService.prototype, "updateDetails").mockResolvedValue({} as any);
        deleteSpy = vi.spyOn(ServiceService.prototype, "delete").mockResolvedValue({} as any);
        patchServiceSpy = vi.spyOn(ServiceService.prototype, "patchService").mockResolvedValue({} as any);
        assignTechnicianSpy = vi.spyOn(ServiceService.prototype, "assignTechnician").mockResolvedValue({} as any);

        controller = new ServiceController();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const mockAuth = (ctx: any) => {
        vi.spyOn(ctx, "get").mockReturnValue(createMockUser({ id: "USR-1" }));
    };

    describe("General", () => {
        it("getAll should return 200", async () => {
            const ctx = createMockContext();
            expect((await controller.getAll(ctx)).status).toBe(200);
        });
        it("getCounts should return 200", async () => {
            const ctx = createMockContext();
            expect((await controller.getCounts(ctx)).status).toBe(200);
        });
        it("getStats should return 200", async () => {
            const ctx = createMockContext();
            expect((await controller.getStats(ctx)).status).toBe(200);
        });
    });

    describe("CRUD", () => {
        it("getById 200 if found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("1");
            getByIdSpy.mockResolvedValue({ id: 1 });
            expect((await controller.getById(ctx)).status).toBe(200);
        });
        it("getById 404 if not found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("1");
            expect((await controller.getById(ctx)).status).toBe(404);
        });
        it("createService 201 on success", async () => {
            const ctx = createMockContext();
            mockAuth(ctx);
            vi.spyOn(ctx.req, "json").mockResolvedValue({ type: "regular", unit: { brand: "B", model: "M", status: "ok" }, customer: { name: "N", phone: "P" }, complaint: "C" });
            expect((await controller.createService(ctx)).status).toBe(201);
        });
        it("deleteService 200 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("1");
            expect((await controller.deleteService(ctx)).status).toBe(200);
        });
    });

    describe("Operations", () => {
        it("updateStatus 200", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("1");
            vi.spyOn(ctx.req, "json").mockResolvedValue({ status: "ok" });
            expect((await controller.updateStatus(ctx)).status).toBe(200);
        });
        it("updateDetails 200", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("1");
            vi.spyOn(ctx.req, "json").mockResolvedValue({});
            expect((await controller.updateDetails(ctx)).status).toBe(200);
        });
        it("patchService 200", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("1");
            vi.spyOn(ctx.req, "json").mockResolvedValue({});
            expect((await controller.patchService(ctx)).status).toBe(200);
        });
        it("assignTechnician 200", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("1");
            vi.spyOn(ctx.req, "json").mockResolvedValue({ technicianId: "t1" });
            expect((await controller.assignTechnician(ctx)).status).toBe(200);
        });
    });

    describe("Errors", () => {
        it("getAll should return 500 on error", async () => {
            const ctx = createMockContext();
            getAllSpy.mockRejectedValue(new Error("Err"));
            expect((await controller.getAll(ctx)).status).toBe(500);
        });
    });
});
