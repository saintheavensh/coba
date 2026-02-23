import { IDashboardRepository } from "../../domain/repositories/dashboard.repository.port";
import { DBContext } from "../../../../shared/types/db-context";

export class GetUrgentServicesUseCase {
    constructor(private repository: IDashboardRepository) { }

    async execute(limit: number = 5, dbOrTx?: DBContext) {
        return await this.repository.getUrgentServices(limit, dbOrTx);
    }
}
