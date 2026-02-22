import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { InventoryController } from "../controllers/inventory.controller";
import { createMockContext } from "../../../../test/factories";

const mockService = {
    getSupplierVariants: vi.fn(),
    getStats: vi.fn(),
    getAllProducts: vi.fn(),
    getProductVariants: vi.fn(),
    getProductById: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    createVariant: vi.fn(),
    updateVariant: vi.fn(),
    deleteVariant: vi.fn(),
    getProductCountByCategory: vi.fn(),
    bulkUpdateMinStock: vi.fn()
};
vi.mock("../inventory-container", () => ({
    inventoryApplicationService: mockService
}));

describe("InventoryController", () => {
    let controller: InventoryController;

    beforeEach(() => {
        vi.clearAllMocks();
        mockService.getSupplierVariants.mockResolvedValue([]);
        mockService.getStats.mockResolvedValue({});
        mockService.getAllProducts.mockResolvedValue([]);
        mockService.getProductVariants.mockResolvedValue([]);
        mockService.getProductById.mockResolvedValue(null);
        mockService.createProduct.mockResolvedValue({});
        mockService.updateProduct.mockResolvedValue({});
        mockService.deleteProduct.mockResolvedValue(undefined);
        mockService.createVariant.mockResolvedValue({});
        mockService.updateVariant.mockResolvedValue({});
        mockService.deleteVariant.mockResolvedValue(undefined);
        mockService.getProductCountByCategory.mockResolvedValue(0);
        mockService.bulkUpdateMinStock.mockResolvedValue(0);

        controller = new InventoryController();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("General", () => {
        it("getSupplierVariants should return 200", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("s-1");
            expect((await controller.getSupplierVariants(ctx)).status).toBe(200);
        });
        it("getStats should return 200", async () => {
            expect((await controller.getStats(createMockContext())).status).toBe(200);
        });
        it("getAllProducts should return 200", async () => {
            expect((await controller.getAllProducts(createMockContext())).status).toBe(200);
        });
    });

    describe("Products", () => {
        it("getProductById 200 if found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("p-1");
            mockService.getProductById.mockResolvedValue({ id: "p-1" });
            expect((await controller.getProductById(ctx)).status).toBe(200);
        });
        it("getProductById 404 if not found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("p-1");
            expect((await controller.getProductById(ctx)).status).toBe(404);
        });
        it("createProduct 201 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req as any, "valid").mockReturnValue({ name: "P" });
            expect((await controller.createProduct(ctx)).status).toBe(201);
        });
        it("updateProduct 200 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("p-1");
            vi.spyOn(ctx.req as any, "valid").mockReturnValue({ name: "P" });
            expect((await controller.updateProduct(ctx)).status).toBe(200);
        });
        it("deleteProduct 200 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("p-1");
            expect((await controller.deleteProduct(ctx)).status).toBe(200);
        });
    });

    describe("Variants", () => {
        it("getProductVariants 200", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("p-1");
            expect((await controller.getProductVariants(ctx)).status).toBe(200);
        });
        it("createVariant 201", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req as any, "valid").mockReturnValue({ name: "V" });
            expect((await controller.createVariant(ctx)).status).toBe(201);
        });
        it("updateVariant 200", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("v-1");
            vi.spyOn(ctx.req as any, "valid").mockReturnValue({ name: "V" });
            expect((await controller.updateVariant(ctx)).status).toBe(200);
        });
        it("deleteVariant 200", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("v-1");
            expect((await controller.deleteVariant(ctx)).status).toBe(200);
        });
    });

    describe("Batch/Bulk", () => {
        it("bulkUpdateMinStock 200", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req as any, "valid").mockReturnValue({ categoryId: "c1", minStock: 5 });
            expect((await controller.bulkUpdateMinStock(ctx)).status).toBe(200);
        });
    });

    describe("Error Cases", () => {
        it("getStats 500 on error", async () => {
            const ctx = createMockContext();
            mockService.getStats.mockRejectedValue(new Error("Err"));
            expect((await controller.getStats(ctx)).status).toBe(500);
        });
        it("getAllProducts 500 on error", async () => {
            const ctx = createMockContext();
            mockService.getAllProducts.mockRejectedValue(new Error("Err"));
            expect((await controller.getAllProducts(ctx)).status).toBe(500);
        });
        it("createProduct 500 on error", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req as any, "valid").mockReturnValue({ name: "P" });
            mockService.createProduct.mockRejectedValue(new Error("Err"));
            expect((await controller.createProduct(ctx)).status).toBe(500);
        });
        it("any service error should return 500 or 400", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("p-1");
            mockService.deleteProduct.mockRejectedValue(new Error("Err"));
            expect((await controller.deleteProduct(ctx)).status).toBe(400);
        });
    });
});
