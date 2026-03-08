import { DBContext } from "../../../../shared/types/db-context";
import {
    IServiceRepository,
    IUserGateway,
    INotificationGateway,
    ISettingsGateway
} from "../../domain";
import { HTTPException } from "hono/http-exception";

export class AssignTechnicianUseCase {
    constructor(
        private readonly repository: IServiceRepository,
        private readonly userGateway: IUserGateway,
        private readonly notificationGateway: INotificationGateway,
        private readonly db: { transaction: (fn: (tx: DBContext) => Promise<any>) => Promise<any> }
    ) { }

    async execute(id: string, technicianId: string, userId: string, dbOrTx?: DBContext): Promise<any> {
        const client = dbOrTx || this.db;
        const srv = await this.repository.findById(id, dbOrTx);
        if (!srv) throw new HTTPException(404, { message: "Service not found" });

        const technician = await this.userGateway.getTechnician(technicianId);
        if (!technician) throw new HTTPException(404, { message: "Technician not found" });

        await client.transaction(async (tx) => {
            await this.repository.update(id, { technicianId }, tx);
            await this.repository.logActivity({
                userId,
                action: "ASSIGN",
                entityType: "service",
                entityId: srv.no,
                description: `Assigned to technician ${technician.name}`,
                newValue: { technicianId, technicianName: technician.name }
            }, tx);
        });

        await this.notificationGateway.technicianAssigned(technicianId, srv.no, String(srv.id));
        return { message: "Technician assigned", technician };
    }
}

export class UpdateServiceDetailsUseCase {
    constructor(private readonly repository: IServiceRepository, private readonly db: { transaction: (fn: (tx: DBContext) => Promise<any>) => Promise<any> }) { }

    async execute(id: string, data: any, userId: string, dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || this.db;
        const srv = await this.repository.findById(id, dbOrTx);
        if (!srv) throw new HTTPException(404, { message: "Service not found" });

        await client.transaction(async (tx) => {
            await this.repository.update(id, {
                diagnosis: data.diagnosis ? JSON.stringify(data.diagnosis) : undefined,
                costEstimate: data.costEstimate,
                complaint: data.complaint
            }, tx);

            await this.repository.logActivity({
                userId,
                action: "UPDATE",
                entityType: "service",
                entityId: srv.no,
                description: `Service details updated`,
                newValue: data
            }, tx);
        });
    }
}

export class PatchServiceUseCase {
    constructor(private readonly repository: IServiceRepository, private readonly settingsGateway: ISettingsGateway) { }

    async execute(id: string, data: any): Promise<any> {
        const srv = await this.repository.findById(id);
        if (!srv) throw new HTTPException(404, { message: "Service not found" });

        const updateData: any = {};
        if (data.estimatedCompletionDate) updateData.estimatedCompletionDate = new Date(data.estimatedCompletionDate);
        if (data.parts) updateData.parts = data.parts;
        if (data.qc) updateData.qc = data.qc;
        if (data.diagnosis) updateData.diagnosis = typeof data.diagnosis === 'string' ? data.diagnosis : JSON.stringify(data.diagnosis);
        if (data.costEstimate !== undefined) updateData.costEstimate = data.costEstimate;
        if (data.complaint) updateData.complaint = data.complaint;

        if (data.warranty) {
            updateData.warranty = data.warranty;
            const daysToAdd = await this.settingsGateway.getWarrantyDays(data.warranty);
            if (daysToAdd > 0) {
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + daysToAdd);
                updateData.warrantyExpiryDate = expiry;
            }
        }

        if (Object.keys(updateData).length > 0) {
            await this.repository.update(id, updateData);
        }

        return await this.repository.findById(id);
    }
}

export class DeleteServiceUseCase {
    constructor(private readonly repository: IServiceRepository) { }

    async execute(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}
