import { DBContext } from "../../../../shared/types/db-context";
import { SettingsService } from "../../../settings/services/settings.service";
import { ISettingsGateway } from "../../domain";

export class SettingsGatewayAdapter implements ISettingsGateway {
    async getPaymentMethods(dbOrTx?: DBContext): Promise<any> {
        const service = new SettingsService();
        return await service.getPaymentMethods(dbOrTx as any);
    }
}
