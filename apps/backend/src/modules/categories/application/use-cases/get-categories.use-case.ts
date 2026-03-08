import { inject, injectable } from "inversify";
import { DBContext } from "../../../../shared/types/db-context";
import { ICategoryRepository } from "../../domain";
import { TYPES } from "../../types";

@injectable()
export class GetCategoriesUseCase {
    constructor(
        @inject(TYPES.ICategoryRepository) private readonly repository: ICategoryRepository
    ) { }

    async execute(dbOrTx?: DBContext) {
        return await this.repository.findAll(dbOrTx);
    }
}
