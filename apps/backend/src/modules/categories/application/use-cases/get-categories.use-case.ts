import { DBContext } from "../../../../shared/types/db-context";
import { ICategoryRepository } from "../../domain";

export class GetCategoriesUseCase {
    constructor(private repository: ICategoryRepository) { }

    async execute(dbOrTx?: DBContext) {
        return await this.repository.findAll(dbOrTx);
    }
}
