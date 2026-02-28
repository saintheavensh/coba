import { DBContext } from "../../../../../shared/types/db-context";
import { IServiceRepository, ServiceTicket } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class GetServicesUseCase {
    constructor(private readonly repository: IServiceRepository) { }

    async execute(params: { status?: string; technicianId?: string }, dbOrTx?: DBContext): Promise<ServiceTicket[]> {
        return await this.repository.findAll(params, dbOrTx);
    }
}

export class GetServiceCountsUseCase {
    constructor(private readonly repository: IServiceRepository) { }

    async execute(dbOrTx?: DBContext) {
        return await this.repository.getCountsByStatus(dbOrTx);
    }
}

export class GetServiceByIdUseCase {
    constructor(private readonly repository: IServiceRepository) { }

    async execute(id: string, dbOrTx?: DBContext): Promise<ServiceTicket> {
        const srv = await this.repository.findById(id, dbOrTx);
        if (!srv) {
            throw new HTTPException(404, { message: "Service not found" });
        }

        const timeline = await this.repository.getTimeline(srv.no, dbOrTx);

        return {
            ...srv,
            timeline,
            photos: (srv.device as any)?.photos || [],
            serviceFee: srv.actualCost ?? srv.costEstimate ?? 0
        };
    }
}

export class GetTechnicianDashboardStatsUseCase {
    constructor(private readonly repository: IServiceRepository) { }

    async execute(userId: string, dbOrTx?: DBContext) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const servicesData = await this.repository.getTechnicianStats(userId, startOfMonth, endOfMonth, dbOrTx);

        const total = servicesData.length;
        const success = servicesData.filter((s: any) => s.status === 'selesai' || s.status === 'diambil').length;
        const failed = servicesData.filter((s: any) => s.status === 'batal').length;
        const profit = servicesData
            .filter((s: any) => s.status === 'selesai' || s.status === 'diambil')
            .reduce((sum: number, s: any) => sum + (Number(s.actualCost) || 0), 0);

        return {
            profit,
            total,
            success,
            failed,
            period: 'This Month'
        };
    }
}
