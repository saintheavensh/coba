import { DBContext } from "../../../../../shared/types/db-context";
import { IOperationalCostRepository } from "../../domain";

export class DeleteOperationalCostUseCase {
    constructor(private readonly repository: IOperationalCostRepository) { }

    async execute(id: string, dbOrTx?: DBContext): Promise<void> {
        await this.repository.delete(id, dbOrTx);
    }
}
