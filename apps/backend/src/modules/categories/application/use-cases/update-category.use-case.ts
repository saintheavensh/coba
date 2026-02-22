import { DBContext } from "../../../../shared/types/db-context";
import { ICategoryRepository } from "../../domain";
import { categories } from "../../../../db/schema";

export class UpdateCategoryUseCase {
    constructor(private repository: ICategoryRepository) { }

    async execute(id: string, data: Partial<typeof categories.$inferInsert>, dbOrTx?: DBContext) {
        return await this.repository.update(id, data, dbOrTx);
    }
}
