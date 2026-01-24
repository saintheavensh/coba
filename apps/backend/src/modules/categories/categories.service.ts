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

    async create(data: { name: string; description?: string; parentId?: string | null; variants?: string[] }) {
        const id = generateId(ID_PREFIX.CATEGORY);
        const category = await this.repo.create({
            id,
            name: data.name,
            description: data.description,
            parentId: data.parentId
        });

        if (data.variants && data.variants.length > 0) {
            for (const vName of data.variants) {
                await this.repo.addVariantTemplate(id, vName);
            }
        }

        return category;
    }

    async update(id: string, data: { name: string; description?: string; parentId?: string | null }) {
        return await this.repo.update(id, data);
    }

    async delete(id: string) {
        return await this.repo.delete(id);
    }

    async addVariantTemplate(categoryId: string, name: string, supplierId?: string) {
        // 1. Add to Category with supplier
        const template = await this.repo.addVariantTemplate(categoryId, name, supplierId);

        // 2. Propagate to ALL existing products in this category
        await this.repo.propagateVariantToProducts(categoryId, name, supplierId);

        return template;
    }

    async removeVariantTemplate(id: number) {
        return await this.repo.removeVariantTemplate(id);
    }
}
