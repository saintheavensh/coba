import { DBContext } from "../../../../shared/types/db-context";
import { ICategoryRepository } from "../../domain";

export class RemoveVariantTemplateUseCase {
    constructor(private repository: ICategoryRepository) { }

    async execute(id: string, dbOrTx?: DBContext) {
        return await this.repository.removeVariantTemplate(id, dbOrTx);
    }
}
