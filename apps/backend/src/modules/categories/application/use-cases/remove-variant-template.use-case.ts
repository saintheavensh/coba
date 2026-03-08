import { inject, injectable } from "inversify";
import { DBContext } from "../../../../shared/types/db-context";
import { ICategoryRepository } from "../../domain";
import { TYPES } from "../../types";

@injectable()
export class RemoveVariantTemplateUseCase {
    constructor(
        @inject(TYPES.ICategoryRepository) private readonly repository: ICategoryRepository
    ) { }

    async execute(id: string, dbOrTx?: DBContext) {
        return await this.repository.removeVariantTemplate(id, dbOrTx);
    }
}
