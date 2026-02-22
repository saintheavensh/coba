import { DBContext } from "../../../shared/types/db-context";
import { BrandRepositoryAdapter } from "../infrastructure";
import {
    GetBrandsUseCase,
    CreateBrandUseCase,
    UpdateBrandUseCase,
    DeleteBrandUseCase
} from "../application";
import { IBrandRepository, CreateBrandData, UpdateBrandData } from "../domain";

export class BrandsService {
    private repository: IBrandRepository;
    private getBrandsUseCase: GetBrandsUseCase;
    private createBrandUseCase: CreateBrandUseCase;
    private updateBrandUseCase: UpdateBrandUseCase;
    private deleteBrandUseCase: DeleteBrandUseCase;

    constructor() {
        this.repository = new BrandRepositoryAdapter();
        this.getBrandsUseCase = new GetBrandsUseCase(this.repository);
        this.createBrandUseCase = new CreateBrandUseCase(this.repository);
        this.updateBrandUseCase = new UpdateBrandUseCase(this.repository);
        this.deleteBrandUseCase = new DeleteBrandUseCase(this.repository);
    }

    async getAll(dbOrTx?: DBContext) {
        return await this.getBrandsUseCase.execute(dbOrTx);
    }

    async create(data: CreateBrandData, dbOrTx?: DBContext) {
        return await this.createBrandUseCase.execute(data, dbOrTx);
    }

    async update(id: string, data: UpdateBrandData, dbOrTx?: DBContext) {
        return await this.updateBrandUseCase.execute(id, data, dbOrTx);
    }

    async delete(id: string, dbOrTx?: DBContext) {
        return await this.deleteBrandUseCase.execute(id, dbOrTx);
    }

    async findById(id: string, dbOrTx?: DBContext) {
        return await this.repository.findById(id, dbOrTx);
    }

    async findByName(name: string, dbOrTx?: DBContext) {
        return await this.repository.findByName(name, dbOrTx);
    }
}

// Export a singleton instance for backward compatibility with static-like usage if needed,
// though standard practice would be to instantiate where needed or use a container.
export const brandsService = new BrandsService();
