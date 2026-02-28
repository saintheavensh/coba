import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProductsFacade } from "../facades/ProductsFacade";
import { Result } from "../../../../../shared/core/Result";

describe("ProductsFacade", () => {
    let facade: ProductsFacade;
    let mockCreateUC: any;
    let mockGetUC: any;
    let mockUpdateUC: any;
    let mockDeleteUC: any;
    let mockGetProductsUC: any;
    let mockGetVariantsUC: any;
    let mockGetBatchesUC: any;

    beforeEach(() => {
        mockCreateUC = { execute: vi.fn() };
        mockGetProductsUC = { execute: vi.fn() };
        mockGetUC = { execute: vi.fn() };
        mockGetVariantsUC = { execute: vi.fn() };
        mockGetBatchesUC = { execute: vi.fn() };
        mockUpdateUC = { execute: vi.fn() };
        mockDeleteUC = { execute: vi.fn() };

        facade = new ProductsFacade(
            mockCreateUC,
            mockGetProductsUC,
            mockGetUC,
            mockGetVariantsUC,
            mockGetBatchesUC,
            mockUpdateUC,
            mockDeleteUC
        );
    });

    it("should delegate createProduct to use case", async () => {
        const data = { sku: "S1", name: "N1", price: 1, categoryId: "C1" };
        mockCreateUC.execute.mockResolvedValue(Result.ok({ id: "1", ...data }));

        const result = await facade.createProduct(data);
        expect(result.isSuccess).toBe(true);
        expect(mockCreateUC.execute).toHaveBeenCalledWith(data);
    });

    it("should delegate getProduct to use case", async () => {
        mockGetUC.execute.mockResolvedValue(Result.ok({ id: "1", name: "P1" }));
        const result = await facade.getProduct("1");
        expect(result.isSuccess).toBe(true);
        expect(mockGetUC.execute).toHaveBeenCalledWith({ id: "1" });
    });

    it("should delegate updateProduct to use case", async () => {
        const updateData = { name: "New" };
        mockUpdateUC.execute.mockResolvedValue(Result.ok({ id: "1", name: "New" }));
        const result = await facade.updateProduct("1", updateData);
        expect(result.isSuccess).toBe(true);
        expect(mockUpdateUC.execute).toHaveBeenCalledWith({ id: "1", data: updateData });
    });
});
