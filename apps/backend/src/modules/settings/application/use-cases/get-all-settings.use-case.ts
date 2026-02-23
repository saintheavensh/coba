import { DBContext } from "../../../../shared/types/db-context";
import { AllSettings } from "../../domain";
import { GetSettingUseCase } from "./get-setting.use-case";
import {
    DEFAULT_STORE_INFO,
    DEFAULT_RECEIPT_SETTINGS,
    DEFAULT_SERVICE_SETTINGS,
    DEFAULT_WHATSAPP_SETTINGS,
    DEFAULT_COMMISSION_SETTINGS,
    DEFAULT_ACCOUNT_MAPPINGS,
    DEFAULT_GENERAL_SETTINGS
} from "../constants";

export class GetAllSettingsUseCase {
    constructor(private readonly getSettingUC: GetSettingUseCase) { }

    async execute(dbOrTx?: DBContext): Promise<AllSettings> {
        const [
            storeInfo,
            receiptSettings,
            serviceSettings,
            whatsappSettings,
            commissionSettings,
            accountMappings,
            generalSettings
        ] = await Promise.all([
            this.getSettingUC.execute("store_info", DEFAULT_STORE_INFO, dbOrTx),
            this.getSettingUC.execute("receipt_settings", DEFAULT_RECEIPT_SETTINGS, dbOrTx),
            this.getSettingUC.execute("service_settings", DEFAULT_SERVICE_SETTINGS, dbOrTx),
            this.getSettingUC.execute("whatsapp_settings", DEFAULT_WHATSAPP_SETTINGS, dbOrTx),
            this.getSettingUC.execute("commission_settings", DEFAULT_COMMISSION_SETTINGS, dbOrTx),
            this.getSettingUC.execute("account_mappings", DEFAULT_ACCOUNT_MAPPINGS, dbOrTx),
            this.getSettingUC.execute("general_settings", DEFAULT_GENERAL_SETTINGS, dbOrTx),
        ]);

        return {
            storeInfo,
            receiptSettings,
            serviceSettings,
            whatsappSettings,
            commissionSettings,
            accountMappings,
            generalSettings
        };
    }
}
