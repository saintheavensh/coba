import { DBContext } from "../../../../../shared/types/db-context";
import { DEFAULT_SERVICE_SETTINGS } from "../../../settings/application";

interface ISettingsFacade {
    get<T>(key: string, defaultValue: T): Promise<T>;
}

interface IReportsFacade {
    getProfitAndLoss(filters: any, dbOrTx?: any): Promise<any>;
}

export class GetProfitLossUseCase {
    constructor(
        private settingsFacade: ISettingsFacade,
        private reportsFacade: IReportsFacade
    ) { }

    async execute(startDate?: string, endDate?: string, dbOrTx?: DBContext) {
        const settings = await this.settingsFacade.get("service_settings", DEFAULT_SERVICE_SETTINGS);
        const commissionModel = settings?.commissionModel || 'completion';
        return await this.reportsFacade.getProfitAndLoss({ startDate, endDate, commissionModel }, dbOrTx);
    }
}
