import { CategoriesRepository } from "./categories.repository";
import { generateId, ID_PREFIX } from "../../lib/utils";

export class CategoriesService {
    private repo: CategoriesRepository;

    constructor() {
        this.repo = new CategoriesRepository();
    }

    async getAll() {
        return await this.repo.findAll();
    }

    async create(data: { name: string; description?: string }) {
        const id = generateId(ID_PREFIX.CATEGORY);
        return await this.repo.create({
            id,
            name: data.name,
            description: data.description
        });
    }

    async update(id: string, data: { name: string; description?: string }) {
        return await this.repo.update(id, data);
    }

    async delete(id: string) {
        return await this.repo.delete(id);
    }
}
