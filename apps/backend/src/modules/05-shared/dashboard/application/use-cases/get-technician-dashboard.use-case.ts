import { IDashboardRepository } from "../../domain/repositories/dashboard.repository.port";
import { DBContext } from "../../../../../shared/types/db-context";

export class GetTechnicianDashboardUseCase {
    constructor(private repository: IDashboardRepository) { }

    async execute(technicianId: string, dbOrTx?: DBContext) {
        const myJobs = await this.repository.getTechnicianJobs(technicianId, dbOrTx);
        const queue = await this.repository.getTechnicianQueue(10, dbOrTx);

        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const stats = await this.repository.getTechnicianStats(technicianId, startOfDay, dbOrTx);

        return {
            myJobs,
            queue,
            stats: {
                completedToday: stats.completedToday,
                inProgress: stats.inProgress,
                totalQueue: (queue || []).length
            }
        };
    }
}
