import { DBContext } from "../../../../../shared/types/db-context";
import { ICategoryRepository } from "../../domain";
import { generateId, ID_PREFIX } from "../../../../../shared/utils/validation/IdGenerator";

export interface CreateCategoryInput {
    name: string;
    description?: string;
    parentId?: string | null;
    variants?: string[];
}

export class CreateCategoryUseCase {
    constructor(private repository: ICategoryRepository) { }

    async execute(data: CreateCategoryInput, dbOrTx?: DBContext) {
        if (data.parentId) {
            const parent = await this.repository.findById(data.parentId, dbOrTx);
            if (!parent) {
                throw new Error("Parent category not found");
            }
        }
        const id = generateId(ID_PREFIX.CATEGORY);
        const category = await this.repository.create({
            id,
            name: data.name,
            description: data.description,
            parentId: data.parentId
        }, dbOrTx);

        if (data.variants && data.variants.length > 0) {
            for (const vName of data.variants) {
                await this.repository.addVariantTemplate(id, vName, undefined, dbOrTx);
            }
        }

        return category;
    }
}
