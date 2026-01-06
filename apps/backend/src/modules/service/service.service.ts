import { db } from "../../db";
import { services, activityLogs } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { ServiceRepository } from "./service.repository";

export class ServiceService {
    private repo: ServiceRepository;

    constructor() {
        this.repo = new ServiceRepository();
    }

    async getAll() {
        return await this.repo.findAll();
    }

    async getById(id: number) {
        return await this.repo.findById(id);
    }

    async createService(data: any, userId?: string) {
        // Logic generate Service No
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const prefix = `SRV-${today}`;
        const lastService = await this.repo.findLastServiceNo(prefix);

        let counter = 1;
        if (lastService) {
            const parts = lastService.no.split("-");
            const lastCount = parseInt(parts[2]);
            if (!isNaN(lastCount)) counter = lastCount + 1;
        }
        const no = `${prefix}-${String(counter).padStart(3, "0")}`;

        await db.transaction(async (tx) => {
            await tx.insert(services).values({
                no,
                customer: data.customer,
                device: data.unit,
                complaint: data.complaint,
                diagnosis: JSON.stringify(data.diagnosis || {}),
                technicianId: data.technicianId || null,
                status: "antrian" as any,
                createdBy: userId || null
            });

            // Log
            await tx.insert(activityLogs).values({
                userId: userId || "USR-000",
                action: "CREATE",
                entityType: "service",
                entityId: no,
                description: `New Service ${no} created for ${data.customer.name}`,
                newValue: JSON.stringify(data),
                createdAt: new Date()
            });
        });

        return { message: "Service created", no };
    }

    async updateStatus(id: number, data: { status: string; notes?: string; actualCost?: number }, userId?: string) {
        const srv = await this.repo.findById(id);
        if (!srv) throw new Error("Service not found");

        await db.transaction(async (tx) => {
            await tx.update(services).set({
                status: data.status as any,
                notes: data.notes,
                actualCost: data.actualCost,
                dateOut: (data.status === "selesai" || data.status === "diambil") ? new Date() : undefined
            }).where(eq(services.id, id));

            await tx.insert(activityLogs).values({
                userId: userId || "USR-000",
                action: "STATUS_CHANGE",
                entityType: "service",
                entityId: srv.no,
                description: `Service ${srv.no} status updated to ${data.status}`,
                oldValue: JSON.stringify({ status: srv.status }),
                newValue: JSON.stringify({ status: data.status }),
                createdAt: new Date()
            });
        });

        return { message: "Status updated" };
    }
}
