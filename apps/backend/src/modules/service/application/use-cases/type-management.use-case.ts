import { IServiceTypeRepository } from "../../domain/repositories/service-type-repository.port";

export class TypeManagementUseCase {
    constructor(private readonly repository: IServiceTypeRepository) { }

    async getAll(categoryId?: string) {
        return await this.repository.findAll(categoryId);
    }

    async getById(id: string) {
        return await this.repository.findById(id);
    }

    async create(data: { categoryId: string; name: string; weight: number; defaultPrice?: number; commissionPercent?: number; warrantyDays?: number; isActive?: boolean }) {
        return await this.repository.create(data);
    }

    async update(id: string, data: Partial<{ name: string; weight: number; defaultPrice: number; commissionPercent: number; warrantyDays: number; isActive: boolean }>) {
        await this.repository.update(id, data);
        return await this.repository.findById(id);
    }

    async delete(id: string) {
        await this.repository.delete(id);
    }
}
