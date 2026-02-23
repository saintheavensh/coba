import { DBContext } from "../../../../shared/types/db-context";
import { Setting } from "../entities/settings.entity";

export interface ISettingsRepository {
    findByKey(key: string, dbOrTx?: DBContext): Promise<Setting | null>;
    upsert(key: string, value: any, dbOrTx?: DBContext): Promise<void>;
    factoryReset(mode: "data" | "full", dbOrTx?: DBContext): Promise<void>;
}
