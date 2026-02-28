import { BrandRepositoryAdapter } from "./infrastructure";
import {
    GetBrandsUseCase,
    CreateBrandUseCase,
    UpdateBrandUseCase,
    DeleteBrandUseCase
} from "./application";

// Adapters
const brandRepository = new BrandRepositoryAdapter();

// Use Cases
const getBrandsUseCase = new GetBrandsUseCase(brandRepository);
const createBrandUseCase = new CreateBrandUseCase(brandRepository);
const updateBrandUseCase = new UpdateBrandUseCase(brandRepository);
const deleteBrandUseCase = new DeleteBrandUseCase(brandRepository);

/**
 * BrandsFacade — Single entry point for the Brands module.
 * Wires internal use cases and provides a clean interface for external layers.
 */
export class BrandsFacade {
    async getAll() {
        return await getBrandsUseCase.execute();
    }

    async create(data: any) {
        return await createBrandUseCase.execute(data);
    }

    async update(id: string, data: any) {
        return await updateBrandUseCase.execute(id, data);
    }

    async delete(id: string) {
        return await deleteBrandUseCase.execute(id);
    }

    // Direct repository access if needed for read operations without complex logic
    async findById(id: string) {
        return await brandRepository.findById(id);
    }

    async findByName(name: string) {
        return await brandRepository.findByName(name);
    }
}

/** Singleton instance */
export const brandsFacade = new BrandsFacade();
