import { inject, injectable } from "inversify";
import { DBContext } from "../../../../shared/types/db-context";
import { ICategoryRepository } from "../../domain";
import { categories } from "../../../../db/schema";
import { TYPES } from "../../types";

@injectable()
export class UpdateCategoryUseCase {
    constructor(
        @inject(TYPES.ICategoryRepository) private readonly repository: ICategoryRepository
    ) { }

    async execute(id: string, data: Partial<typeof categories.$inferInsert>, dbOrTx?: DBContext) {
        return await this.repository.update(id, data, dbOrTx);
    }
}
