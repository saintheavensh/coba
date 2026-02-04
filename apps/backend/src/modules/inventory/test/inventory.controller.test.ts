import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { InventoryController } from "../controllers/inventory.controller";
import { InventoryService } from "../services/inventory.service";
import { createMockContext } from "../../../../test/factories";

describe("InventoryController", () => {
    let controller: InventoryController;

    // Spies
    let getSupplierVariantsSpy: any;
    let getStatsSpy: any;
    let getAllProductsSpy: any;
    let getProductVariantsSpy: any;
    let getProductByIdSpy: any;
    let createProductSpy: any;
    let updateProductSpy: any;
    let deleteProductSpy: any;
    let createVariantSpy: any;
    let updateVariantSpy: any;
    let deleteVariantSpy: any;
    let getProductCountByCategorySpy: any;
    let bulkUpdateMinStockSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();

        getSupplierVariantsSpy = vi.spyOn(InventoryService.prototype, "getSupplierVariants").mockResolvedValue([]);
        getStatsSpy = vi.spyOn(InventoryService.prototype, "getStats").mockResolvedValue({} as any);
        getAllProductsSpy = vi.spyOn(InventoryService.prototype, "getAllProducts").mockResolvedValue([]);
        getProductVariantsSpy = vi.spyOn(InventoryService.prototype, "getProductVariants").mockResolvedValue([]);
        getProductByIdSpy = vi.spyOn(InventoryService.prototype, "getProductById").mockResolvedValue(null);
        createProductSpy = vi.spyOn(InventoryService.prototype, "createProduct").mockResolvedValue({} as any);
        updateProductSpy = vi.spyOn(InventoryService.prototype, "updateProduct").mockResolvedValue({} as any);
        deleteProductSpy = vi.spyOn(InventoryService.prototype, "deleteProduct").mockResolvedValue({} as any);
        createVariantSpy = vi.spyOn(InventoryService.prototype, "createVariant").mockResolvedValue({} as any);
        updateVariantSpy = vi.spyOn(InventoryService.prototype, "updateVariant").mockResolvedValue({} as any);
        deleteVariantSpy = vi.spyOn(InventoryService.prototype, "deleteVariant").mockResolvedValue({} as any);
        getProductCountByCategorySpy = vi.spyOn(InventoryService.prototype, "getProductCountByCategory").mockResolvedValue(0);
        bulkUpdateMinStockSpy = vi.spyOn(InventoryService.prototype, "bulkUpdateMinStock").mockResolvedValue(0);

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
            getProductByIdSpy.mockResolvedValue({ id: "p-1" });
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
            getStatsSpy.mockRejectedValue(new Error("Err"));
            expect((await controller.getStats(ctx)).status).toBe(500);
        });
        it("getAllProducts 500 on error", async () => {
            const ctx = createMockContext();
            getAllProductsSpy.mockRejectedValue(new Error("Err"));
            expect((await controller.getAllProducts(ctx)).status).toBe(500);
        });
        it("createProduct 500 on error", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req as any, "valid").mockReturnValue({ name: "P" });
            createProductSpy.mockRejectedValue(new Error("Err"));
            expect((await controller.createProduct(ctx)).status).toBe(500);
        });
        it("any service error should return 500 or 400", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("p-1");
            deleteProductSpy.mockRejectedValue(new Error("Err"));
            expect((await controller.deleteProduct(ctx)).status).toBe(400);
        });
    });
});
