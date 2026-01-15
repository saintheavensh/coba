import { db } from "../../db";
import { services, activityLogs, users } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { ServiceRepository } from "./service.repository";

export class ServiceService {
    private repo: ServiceRepository;

    constructor() {
        this.repo = new ServiceRepository();
    }

    async getAll(params?: { status?: string }) {
        return await this.repo.findAll(params);
    }

    async getCounts() {
        return await this.repo.getCountsByStatus();
    }

    async getById(id: number) {
        const srv = await this.repo.findById(id);
        if (!srv) return null;

        // Fetch Timeline from Activity Logs with user info
        const logs = await db.select({
            log: activityLogs,
            userName: users.name
        })
            .from(activityLogs)
            .leftJoin(users, eq(activityLogs.userId, users.id))
            .where(eq(activityLogs.entityId, srv.no))
            .orderBy(desc(activityLogs.createdAt));

        const timeline = logs.map(({ log, userName }) => {
            let event = log.description || log.action;
            let details: any = {};

            // Parse action-specific details
            if (log.action === 'CREATE') {
                event = 'Service Dibuat';
                try {
                    const data = JSON.parse(log.newValue as string || '{}');
                    details = {
                        customer: data.customer?.name,
                        phone: data.unit ? `${data.unit.brand} ${data.unit.model}` : null,
                        complaint: data.complaint,
                        technician: data.technicianId ? 'Assigned' : 'Belum ditugaskan',
                        isWalkin: data.isWalkin ? 'Walk-in' : 'Regular'
                    };
                } catch { }
            } else if (log.action === 'STATUS_CHANGE') {
                try {
                    const oldVal = JSON.parse(log.oldValue as string || '{}');
                    const newVal = JSON.parse(log.newValue as string || '{}');
                    event = `Status: ${oldVal.status || '-'} → ${newVal.status}`;
                    details = { from: oldVal.status, to: newVal.status };
                } catch {
                    event = log.description || 'Status changed';
                }
            } else if (log.action === 'ASSIGN') {
                event = 'Teknisi Ditugaskan';
            } else if (log.action === 'UPDATE') {
                event = 'Data Diperbarui';
            }

            return {
                event,
                by: userName || 'System',
                time: log.createdAt?.toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) || "-",
                action: log.action,
                details
            };
        });

        // Flatten device for frontend compatibility if needed, or valid mapping
        return {
            ...srv,
            timeline,
            // Ensure photos are accessible at top level for frontend convenience
            photos: (srv.device as any)?.photos || [],
            // Map backend cost fields to frontend expected fields
            serviceFee: srv.actualCost ?? srv.costEstimate ?? 0,
            parts: [] // TODO: Implement parts/items schema in future
        };
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
                // Save photos and initialQC inside device JSON to avoid schema migration
                device: { ...data.unit, photos: data.photos, initialQC: data.initialQC },
                complaint: data.complaint,
                diagnosis: JSON.stringify(data.diagnosis || {}),
                technicianId: data.technicianId || null,
                status: data.status || "antrian" as any,
                createdBy: userId || null,
                dateIn: new Date(),
                estimatedCompletionDate: data.estimatedCompletionDate
                    ? new Date(data.estimatedCompletionDate)
                    : null,
                actualCost: data.actualCost || null,
                qc: data.qc || null,
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

    async updateDetails(id: number, data: { diagnosis?: any; costEstimate?: number; complaint?: string }, userId?: string) {
        const srv = await this.repo.findById(id);
        if (!srv) throw new Error("Service not found");

        await db.transaction(async (tx) => {
            await tx.update(services).set({
                diagnosis: data.diagnosis ? JSON.stringify(data.diagnosis) : undefined,
                costEstimate: data.costEstimate,
                complaint: data.complaint
            }).where(eq(services.id, id));

            await tx.insert(activityLogs).values({
                userId: userId || "USR-000",
                action: "UPDATE",
                entityType: "service",
                entityId: srv.no,
                description: `Service details updated`,
                newValue: JSON.stringify(data),
                createdAt: new Date()
            });
        });

        return { message: "Details updated" };
    }

    async delete(id: number) {
        // Optional: Check if can delete (e.g. only if not finished?)
        // For now allow delete all, maybe restricted by role in controller
        const srv = await this.repo.findById(id);
        if (!srv) throw new Error("Service not found");

        await db.transaction(async (tx) => {
            // Delete logs first (foreign key?) - technically cascade might not be set in SQLite schema definition in strict way, 
            // but let's be safe or just delete service
            await tx.delete(activityLogs).where(eq(activityLogs.entityId, srv.no)); // simple cleanup
            await tx.delete(services).where(eq(services.id, id));
        });

        return { message: "Service deleted" };
    }

    /**
     * Reschedule a service by updating its estimated completion date
     */
    async reschedule(id: number, estimatedCompletionDate: string) {
        const srv = await this.repo.findById(id);
        if (!srv) throw new Error("Service not found");

        const newDate = estimatedCompletionDate ? new Date(estimatedCompletionDate) : null;

        await db.update(services).set({
            estimatedCompletionDate: newDate
        }).where(eq(services.id, id));

        return await this.repo.findById(id);
    }

    async assignTechnician(id: number, technicianId: string, userId?: string) {
        const srv = await this.repo.findById(id);
        if (!srv) throw new Error("Service not found");

        const technician = await db.query.users.findFirst({
            where: eq(users.id, technicianId)
        });
        if (!technician) throw new Error("Technician not found");

        await db.transaction(async (tx) => {
            await tx.update(services).set({
                technicianId: technicianId
            }).where(eq(services.id, id));

            await tx.insert(activityLogs).values({
                userId: userId || "USR-000",
                action: "ASSIGN",
                entityType: "service",
                entityId: srv.no,
                description: `Assigned to technician ${technician.name}`,
                newValue: JSON.stringify({ technicianId, technicianName: technician.name }),
                createdAt: new Date()
            });
        });

        return { message: "Technician assigned", technician };
    }
}
