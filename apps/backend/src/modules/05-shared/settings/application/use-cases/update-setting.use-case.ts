import { DBContext } from "../../../../../shared/types/db-context";
import { ISettingsRepository } from "../../domain";

export class UpdateSettingUseCase {
    constructor(private readonly repository: ISettingsRepository) { }

    async execute<T>(key: string, value: T, dbOrTx?: DBContext): Promise<void> {
        await this.repository.upsert(key, value, dbOrTx);
    }
}
