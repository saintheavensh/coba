import { ICommissionSettingsRepository, ICommissionRepository } from "../../domain/repositories/commission-repository.port";

export class ManageCommissionUseCase {
    constructor(
        private readonly settingsRepo: ICommissionSettingsRepository,
        private readonly commissionRepo: ICommissionRepository
    ) { }

    async getSettings(technicianId: string) {
        return await this.settingsRepo.findByTechnicianId(technicianId);
    }

    async upsertSettings(technicianId: string, data: any) {
        await this.settingsRepo.upsert({ ...data, technicianId });
        return await this.getSettings(technicianId);
    }

    async getSummary(technicianId: string, startDate?: Date, endDate?: Date) {
        const commissions = await this.commissionRepo.findByTechnicianId(technicianId, startDate, endDate);

        const totalAmount = commissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
        const paidAmount = commissions.filter(c => c.paid).reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
        const unpaidAmount = totalAmount - paidAmount;

        return {
            technicianId,
            totalCommissions: commissions.length,
            totalAmount,
            paidAmount,
            unpaidAmount,
            commissions
        };
    }

    async markAsPaid(ids: string[]) {
        await this.commissionRepo.markAsPaid(ids);
        return { message: "Commissions marked as paid", count: ids.length };
    }
}
