import { IServiceCategoryRepository } from "../../domain/repositories/service-category-repository.port";

export class CategoryManagementUseCase {
    constructor(private readonly repository: IServiceCategoryRepository) { }

    async getAll() {
        return await this.repository.findAll();
    }

    async getById(id: string) {
        return await this.repository.findById(id);
    }

    async create(data: { name: string; description?: string; minWeight?: number; maxWeight?: number }) {
        return await this.repository.create(data);
    }

    async update(id: string, data: Partial<{ name: string; description: string; minWeight: number; maxWeight: number }>) {
        await this.repository.update(id, data);
        return await this.repository.findById(id);
    }

    async delete(id: string) {
        await this.repository.delete(id);
    }
}
