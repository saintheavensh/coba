import { inject, injectable } from "inversify";
import { DBContext } from "../../../../shared/types/db-context";
import { ICategoryRepository } from "../../domain";
import { generateId, ID_PREFIX } from "../../../../shared/utils/validation/IdGenerator";
import { TYPES } from "../../types";

export interface CreateCategoryInput {
    name: string;
    description?: string;
    parentId?: string | null;
    variants?: string[];
}

@injectable()
export class CreateCategoryUseCase {
    constructor(
        @inject(TYPES.ICategoryRepository) private readonly repository: ICategoryRepository
    ) { }

    async execute(data: CreateCategoryInput, dbOrTx?: DBContext) {
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
