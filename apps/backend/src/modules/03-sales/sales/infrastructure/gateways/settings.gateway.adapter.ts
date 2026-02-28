import { DBContext } from "../../../../../shared/types/db-context";
import { settingsService } from "../../../../05-shared/settings/settings-container";
import { ISettingsGateway } from "../../domain";

export class SettingsGatewayAdapter implements ISettingsGateway {
    async getPaymentMethods(dbOrTx?: DBContext): Promise<any> {
        return await settingsService.getPaymentMethods(dbOrTx as any);
    }
}
