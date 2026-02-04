import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { CustomersController } from "../controllers/customers.controller";
import { CustomersService } from "../services/customers.service";
import { createMockContext } from "../../../../test/factories";

describe("CustomersController", () => {
    // Spies - CustomersService is instantiated at top level of controller file
    let getAllSpy: any;
    let getByIdSpy: any;
    let createSpy: any;
    let updateSpy: any;
    let deleteSpy: any;
    let getSalesSpy: any;
    let getUnpaidSalesSpy: any;
    let processPaymentSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();

        getAllSpy = vi.spyOn(CustomersService.prototype, "getAll").mockResolvedValue([]);
        getByIdSpy = vi.spyOn(CustomersService.prototype, "getById").mockResolvedValue(null);
        createSpy = vi.spyOn(CustomersService.prototype, "create").mockResolvedValue({} as any);
        updateSpy = vi.spyOn(CustomersService.prototype, "update").mockResolvedValue({} as any);
        deleteSpy = vi.spyOn(CustomersService.prototype, "delete").mockResolvedValue({} as any);
        getSalesSpy = vi.spyOn(CustomersService.prototype, "getSales").mockResolvedValue([]);
        getUnpaidSalesSpy = vi.spyOn(CustomersService.prototype, "getUnpaidSales").mockResolvedValue([]);
        processPaymentSpy = vi.spyOn(CustomersService.prototype, "processPayment").mockResolvedValue({} as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("getAll", () => {
        it("should return 200 and list", async () => {
            const ctx = createMockContext();
            const mockData = [{ id: "c-1" }];
            getAllSpy.mockResolvedValue(mockData);
            const res = await CustomersController.getAll(ctx);
            expect(res.status).toBe(200);
        });

        it("should return 500 on error", async () => {
            const ctx = createMockContext();
            getAllSpy.mockRejectedValue(new Error("Err"));
            const res = await CustomersController.getAll(ctx);
            expect(res.status).toBe(500);
        });
    });

    describe("getById", () => {
        it("should return 200 and data if found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("c-1");
            getByIdSpy.mockResolvedValue({ id: "c-1" });
            const res = await CustomersController.getById(ctx);
            expect(res.status).toBe(200);
        });

        it("should return 404 if not found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("c-1");
            getByIdSpy.mockResolvedValue(null);
            const res = await CustomersController.getById(ctx);
            expect(res.status).toBe(404);
        });
    });

    describe("create", () => {
        it("should return 201 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "json").mockResolvedValue({ name: "John" });
            (ctx.req as any).valid = vi.fn().mockReturnValue({ name: "John" });
            createSpy.mockResolvedValue({ id: "c-1" });
            const res = await CustomersController.create(ctx);
            expect(res.status).toBe(201);
        });
    });

    describe("update", () => {
        it("should return 200 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("c-1");
            vi.spyOn(ctx.req, "json").mockResolvedValue({ name: "Updated" });
            (ctx.req as any).valid = vi.fn().mockReturnValue({ name: "Updated" });
            const res = await CustomersController.update(ctx);
            expect(res.status).toBe(200);
        });
    });

    describe("delete", () => {
        it("should return 200 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("c-1");
            const res = await CustomersController.delete(ctx);
            expect(res.status).toBe(200);
        });
    });

    describe("getSales", () => {
        it("should return 200 and sales", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("c-1");
            const res = await CustomersController.getSales(ctx);
            expect(res.status).toBe(200);
        });
    });

    describe("getUnpaidSales", () => {
        it("should return 200 and unpaid sales", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("c-1");
            const res = await CustomersController.getUnpaidSales(ctx);
            expect(res.status).toBe(200);
        });
    });

    describe("processPayment", () => {
        it("should return 200 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("c-1");
            const input = { amount: 1000, method: "cash" };
            (ctx.req as any).valid = vi.fn().mockReturnValue(input);
            const res = await CustomersController.processPayment(ctx);
            expect(res.status).toBe(200);
        });
    });
});
