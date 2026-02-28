import { DBContext } from "../../../../../shared/types/db-context";
import { ISettingsRepository } from "../../domain";

export class GetSettingUseCase {
    constructor(private readonly repository: ISettingsRepository) { }

    async execute<T>(key: string, defaultValue: T, dbOrTx?: DBContext): Promise<T> {
        const result = await this.repository.findByKey(key, dbOrTx);
        if (!result) return defaultValue;
        return result.value as T;
    }
}
