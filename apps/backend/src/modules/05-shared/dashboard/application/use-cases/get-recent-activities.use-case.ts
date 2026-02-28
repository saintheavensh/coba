import { IDashboardRepository } from "../../domain/repositories/dashboard.repository.port";
import { DBContext } from "../../../../../shared/types/db-context";

export class GetRecentActivitiesUseCase {
    constructor(private repository: IDashboardRepository) { }

    async execute(limit: number = 10, dbOrTx?: DBContext) {
        return await this.repository.getRecentActivities(limit, dbOrTx);
    }
}
