import { inject, injectable } from "inversify";
import { DBContext } from "../../../../shared/types/db-context";
import { ICategoryRepository } from "../../domain";
import { TYPES } from "../../types";

@injectable()
export class DeleteCategoryUseCase {
    constructor(
        @inject(TYPES.ICategoryRepository) private readonly repository: ICategoryRepository
    ) { }

    async execute(id: string, dbOrTx?: DBContext): Promise<void> {
        return await this.repository.delete(id, dbOrTx);
    }
}
