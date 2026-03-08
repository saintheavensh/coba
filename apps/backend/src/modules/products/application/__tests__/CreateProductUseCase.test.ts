import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateProductUseCase } from "../use-cases/CreateProductUseCase";
import type { IProductRepository } from "../../domain/ports/IProductRepository";
import { Result } from "../../../../shared/core/Result";

describe("CreateProductUseCase", () => {
    let useCase: CreateProductUseCase;
    let mockRepo: IProductRepository;



    beforeEach(() => {

        mockRepo = {
            save: vi.fn(),
            findById: vi.fn(),
            findBySku: vi.fn(),
            delete: vi.fn(),
            findActive: vi.fn(),
        } as any;
        useCase = new CreateProductUseCase(mockRepo);
    });

    it("should create a product successfully", async () => {
        const input = {
            sku: "SKU-123",
            name: "Test Product",
            price: 1000,
            categoryId: "CAT-1"
        };

        (mockRepo.save as any).mockResolvedValue(Result.ok());

        const result = await useCase.execute(input);

        expect(result.isSuccess).toBe(true);
        expect(result.getValue().name).toBe("Test Product");
        expect(result.getValue().sku).toBe("SKU-123");
        expect(mockRepo.save).toHaveBeenCalled();
    });

    it("should fail if SKU format is invalid", async () => {
        const input = {
            sku: "", // Invalid SKU
            name: "Test",
            price: 100,
            categoryId: "1"
        };

        const result = await useCase.execute(input);
        expect(result.isFailure).toBe(true);
        expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it("should fail if price is negative", async () => {
        const input = {
            sku: "SKU-1",
            name: "Test",
            price: -100,
            categoryId: "1"
        };

        const result = await useCase.execute(input);
        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("Price amount cannot be negative");
    });
});
