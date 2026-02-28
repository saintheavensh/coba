import { DBContext } from "../../../../../shared/types/db-context";
import { ISettingsRepository } from "../../domain";

export class FactoryResetUseCase {
    constructor(private readonly repository: ISettingsRepository) { }

    async execute(mode: "data" | "full", dbOrTx?: DBContext): Promise<void> {
        await this.repository.factoryReset(mode, dbOrTx);
    }
}
