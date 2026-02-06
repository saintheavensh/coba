import { db } from "../../../db";
import { services, activityLogs, users, productBatches } from "../../../db/schema";
import { ActivityLogService } from "../../../lib/activity-log.service";
import { eq, desc } from "drizzle-orm";
import { ServiceModel } from "../models/service.model";
import { SettingsService } from "../../settings/services/settings.service";
import { Logger } from "../../../lib/logger";
import { JournalService } from "../../accounting/services/journal.service";
import { CashRegisterService } from "../../accounting/services/cash-register.service";
import { NotificationService } from "../../../lib/notification.service";

export class ServiceService {
    private model: ServiceModel;
    private settingsService: SettingsService;

    constructor(
        model?: ServiceModel,
        settingsService?: SettingsService
    ) {
        this.model = model || new ServiceModel();
        this.settingsService = settingsService || new SettingsService();
    }

    async getAll(params?: { status?: string; technicianId?: string }, dbOrTx?: any) {
        return await this.model.findAll(params, dbOrTx);
    }

    async getCounts(dbOrTx?: any) {
        return await this.model.getCountsByStatus(dbOrTx);
    }

    async getDashboardStats(role: string, userId: string, dbOrTx?: any) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        if (role === 'teknisi') {
            const servicesData = await this.model.getTechnicianStats(userId, startOfMonth, endOfMonth, dbOrTx);

            let profit = 0;
            let total = 0;
            total = servicesData.length;
            const success = servicesData.filter((s: any) => s.status === 'selesai' || s.status === 'diambil').length;
            const failed = servicesData.filter((s: any) => s.status === 'batal').length;

            profit = servicesData
                .filter((s: any) => s.status === 'selesai' || s.status === 'diambil')
                .reduce((sum: number, s: any) => sum + (Number(s.actualCost) || 0), 0);

            return {
                profit,
                total,
                success,
                failed,
                period: 'This Month'
            };
        } else {
            return {
                message: "Admin stats not fully implemented yet in this customized view"
            };
        }
    }

    async getById(id: string, dbOrTx?: any) {
        const effectiveDb = dbOrTx || db;
        const srv = await this.model.findById(id, dbOrTx);
        if (!srv) return null;

        const logs = await effectiveDb.select({
            log: activityLogs,
            userName: users.name
        })
            .from(activityLogs)
            .leftJoin(users, eq(activityLogs.userId, users.id))
            .where(eq(activityLogs.entityId, srv.no))
            .orderBy(desc(activityLogs.createdAt));

        const timeline = logs.map(({ log, userName }: any) => {
            let event = log.description || log.action;
            let details: any = {};

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

        return {
            ...srv,
            timeline,
            photos: (srv.device as any)?.photos || [],
            serviceFee: srv.actualCost ?? srv.costEstimate ?? 0
        };
    }

    async createService(data: any, userId?: string, dbOrTx?: any) {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const prefix = `SRV-${today}`;
        const lastService = await this.model.findLastServiceNo(prefix, dbOrTx);

        let counter = 1;
        if (lastService) {
            const parts = lastService.no.split("-");
            const lastCount = parseInt(parts[2]);
            if (!isNaN(lastCount)) counter = lastCount + 1;
        }
        const no = `${prefix}-${String(counter).padStart(3, "0")}`;

        const effectiveDb = dbOrTx || db;
        const transactionResult = await effectiveDb.transaction(async (tx: any) => {
            const result = await tx.insert(services).values({
                no,
                customer: data.customer,
                device: { ...data.unit, photos: data.photos, initialQC: data.initialQC },
                complaint: data.complaint,
                diagnosis: JSON.stringify(data.diagnosis || {}),
                technicianId: data.technicianId || null,
                status: (data.isDirectComplete ? "selesai" : (data.status || "antrian")) as any,
                createdBy: userId || null,
                dateIn: new Date(),
                dateOut: data.isDirectComplete ? new Date() : null,
                estimatedCompletionDate: data.estimatedCompletionDate
                    ? new Date(data.estimatedCompletionDate)
                    : null,
                actualCost: data.actualCost || null,
                qc: data.qc || null,
                priority: data.priority || "standard",
                isDirectComplete: data.isDirectComplete || false,
                warranty: data.warranty || null,
            }).returning({ id: services.id });

            await ActivityLogService.log({
                userId: userId || "USR-000",
                action: "CREATE",
                entityType: "service",
                entityId: no,
                description: `New Service ${no} created for ${data.customer.name}`,
                details: { newValue: data }
            });

            return { message: "Service created", no, id: result[0].id };
        });

        // Ping assigned technician
        if (data.technicianId) {
            try {
                await NotificationService.technicianAssigned(data.technicianId, no, String(transactionResult.id));
            } catch (e) {
                Logger.error("Failed to send technician assignment notification", e);
            }
        }

        try {
            this.sendWhatsAppNotification("new", {
                no,
                customer: data.customer,
                device: data.unit,
                status: data.status || "antrian"
            });
        } catch (e) {
            Logger.error("Failed to trigger WA notification", e);
        }

        return transactionResult;
    }

    async updateStatus(id: string, data: { status: string; notes?: string; actualCost?: number }, userId?: string, dbOrTx?: any) {
        const srv = await this.model.findById(id, dbOrTx);
        if (!srv) throw new Error("Service not found");

        const effectiveDb = dbOrTx || db;
        await effectiveDb.transaction(async (tx: any) => {
            const updateValues: any = {
                status: data.status,
                notes: data.notes,
                actualCost: data.actualCost,
                dateOut: (data.status === "selesai" || data.status === "diambil") ? new Date() : undefined
            };

            if (data.status === 're-konfirmasi') {
                updateValues.reconfirmationCount = (srv.reconfirmationCount || 0) + 1;
            }

            await tx.update(services).set(updateValues).where(eq(services.id, id));

            await ActivityLogService.log({
                userId: userId || "USR-000",
                action: "STATUS_CHANGE",
                entityType: "service",
                entityId: srv.no,
                description: `Service ${srv.no} status updated to ${data.status}`,
                details: {
                    oldValue: { status: srv.status },
                    newValue: { status: data.status }
                }
            });

            if (data.status === "selesai" && srv.status !== "selesai") {
                const parts = (srv.parts as any[]) || [];
                for (const part of parts) {
                    if (part.source === "inventory" && part.batchId) {
                        const batch = await tx.query.productBatches.findFirst({
                            where: eq(productBatches.id, part.batchId)
                        });

                        if (batch) {
                            await tx.update(productBatches).set({
                                currentStock: batch.currentStock - part.qty,
                                updatedAt: new Date()
                            }).where(eq(productBatches.id, part.batchId));
                        }
                    }
                }
            }

            if (data.status === "diambil" && srv.status !== "diambil") {
                const serviceNo = srv.no;
                const amount = data.actualCost || srv.actualCost || srv.costEstimate || 0;

                let partsCost = 0;
                const parts = (srv.parts as any[]) || [];
                for (const part of parts) {
                    if (part.source === "inventory" && part.buyPrice) {
                        partsCost += (part.buyPrice || 0) * (part.qty || 1);
                    }
                }

                if (amount > 0) {
                    const journalLines: Array<{ accountId: string; debit: number; credit: number; description: string }> = [
                        { accountId: "1-1000", debit: amount, credit: 0, description: `Pembayaran service ${serviceNo}` },
                        { accountId: "4-2000", debit: 0, credit: amount, description: `Pendapatan service ${serviceNo}` }
                    ];

                    if (partsCost > 0) {
                        journalLines.push({ accountId: "5-1002", debit: partsCost, credit: 0, description: `HPP sparepart ${serviceNo}` });
                        journalLines.push({ accountId: "1-3000", debit: 0, credit: partsCost, description: `Pengurangan persediaan ${serviceNo}` });
                    }

                    await JournalService.create({
                        description: `Service ${serviceNo} - Diambil`,
                        referenceType: "service",
                        referenceId: serviceNo,
                        lines: journalLines,
                    }, userId || "system", tx);

                    await CashRegisterService.recordTransaction({
                        transactionType: "service",
                        transactionId: serviceNo,
                        paymentMethod: "cash",
                        amount,
                        description: `Service ${serviceNo}`
                    }, tx);
                }
            }
        });

        // Notify the creator (Cashier) of the status update
        if (srv.createdBy) {
            try {
                await NotificationService.serviceStatusChanged(
                    srv.createdBy,
                    srv.no,
                    data.status,
                    String(srv.id)
                );
            } catch (e) {
                Logger.error("Failed to send cashier status update notification", e);
            }
        }

        try {
            const isComplete = data.status === "selesai";
            if (isComplete) {
                this.sendWhatsAppNotification("complete", { ...srv, status: data.status, actualCost: data.actualCost }, { total: data.actualCost });
            } else {
                this.sendWhatsAppNotification("status", { ...srv, status: data.status }, { status: data.status });
            }
        } catch (e) {
            Logger.error("Failed to trigger WA notification", e);
        }

        return { message: "Status updated" };
    }

    async updateDetails(id: string, data: { diagnosis?: any; costEstimate?: number; complaint?: string }, userId?: string, dbOrTx?: any) {
        const srv = await this.model.findById(id, dbOrTx);
        if (!srv) throw new Error("Service not found");

        const effectiveDb = dbOrTx || db;
        await effectiveDb.transaction(async (tx: any) => {
            await tx.update(services).set({
                diagnosis: data.diagnosis ? JSON.stringify(data.diagnosis) : undefined,
                costEstimate: data.costEstimate,
                complaint: data.complaint
            }).where(eq(services.id, id));

            await ActivityLogService.log({
                userId: userId || "USR-000",
                action: "UPDATE",
                entityType: "service",
                entityId: srv.no,
                description: `Service details updated`,
                details: { newValue: data }
            });
        });

        return { message: "Details updated" };
    }

    async delete(id: string, dbOrTx?: any) {
        const srv = await this.model.findById(id, dbOrTx);
        if (!srv) throw new Error("Service not found");

        const effectiveDb = dbOrTx || db;
        await effectiveDb.transaction(async (tx: any) => {
            await tx.delete(activityLogs).where(eq(activityLogs.entityId, srv.no));
            await tx.delete(services).where(eq(services.id, id));
        });

        return { message: "Service deleted" };
    }

    async patchService(id: string, data: any, dbOrTx?: any) {
        const srv = await this.model.findById(id, dbOrTx);
        if (!srv) throw new Error("Service not found");

        const updateData: any = {};
        if (data.estimatedCompletionDate) updateData.estimatedCompletionDate = new Date(data.estimatedCompletionDate);
        if (data.parts) updateData.parts = data.parts;
        if (data.qc) updateData.qc = data.qc;
        if (data.diagnosis) updateData.diagnosis = typeof data.diagnosis === 'string' ? data.diagnosis : JSON.stringify(data.diagnosis);
        if (data.costEstimate !== undefined) updateData.costEstimate = data.costEstimate;
        if (data.complaint) updateData.complaint = data.complaint;

        const getWarrantyDays = async (label: string): Promise<number> => {
            try {
                const settings = await this.settingsService.getServiceSettings(dbOrTx);
                const preset = settings.warrantyPresets.find((p: any) => p.label === label);
                if (preset) return preset.days;
            } catch (e) {
                Logger.error("Error fetching warranty settings", e);
            }
            return 0;
        };

        if (data.warranty) {
            updateData.warranty = data.warranty;
            const daysToAdd = await getWarrantyDays(updateData.warranty);

            if (daysToAdd > 0) {
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + daysToAdd);
                updateData.warrantyExpiryDate = expiry;
            }
        }

        if (Object.keys(updateData).length === 0) return srv;

        const effectiveDb = dbOrTx || db;
        await effectiveDb.update(services).set(updateData).where(eq(services.id, id));

        return await this.model.findById(id, dbOrTx);
    }

    async assignTechnician(id: string, technicianId: string, userId?: string, dbOrTx?: any) {
        const srv = await this.model.findById(id, dbOrTx);
        if (!srv) throw new Error("Service not found");

        const effectiveDb = dbOrTx || db;
        const technician = await effectiveDb.query.users.findFirst({
            where: eq(users.id, technicianId)
        });
        if (!technician) throw new Error("Technician not found");

        await effectiveDb.transaction(async (tx: any) => {
            await tx.update(services).set({
                technicianId: technicianId
            }).where(eq(services.id, id));

            await ActivityLogService.log({
                userId: userId || "USR-000",
                action: "ASSIGN",
                entityType: "service",
                entityId: srv.no,
                description: `Assigned to technician ${technician.name}`,
                details: { newValue: { technicianId, technicianName: technician.name } }
            });
        });


        // Notify the technician
        try {
            await NotificationService.technicianAssigned(technicianId, srv.no, String(srv.id));
        } catch (e) {
            Logger.error("Failed to send technician assignment notification", e);
        }

        return { message: "Technician assigned", technician };
    }

    private async sendWhatsAppNotification(
        type: "new" | "status" | "complete",
        serviceData: any,
        extra: { status?: string, total?: number } = {}
    ) {
        try {
            const settings = await this.settingsService.getWhatsAppSettings();
            if (!settings.enabled) return;

            let shouldSend = false;
            let template = "";

            if (type === "new") {
                shouldSend = settings.autoSendOnNewService;
                template = settings.newServiceTemplate;
            } else if (type === "status") {
                shouldSend = settings.autoSendOnStatusChange;
                template = settings.statusUpdateTemplate;
            } else if (type === "complete") {
                shouldSend = settings.autoSendOnComplete;
                template = settings.readyForPickupTemplate;
            }

            if (!shouldSend || !template) return;

            const customerName = serviceData.customer?.name || "Customer";
            const customerPhone = serviceData.customer?.phone;

            if (!customerPhone) {
                Logger.debug("[WHATSAPP] No customer phone number, skipping.");
                return;
            }

            const serviceNo = serviceData.no;
            const deviceName = serviceData.device ? `${serviceData.device.brand} ${serviceData.device.model}` : "Device";
            const status = extra.status || serviceData.status;

            const statusMap: Record<string, string> = {
                "antrian": "Dalam Antrian",
                "dicek": "Sedang Dicek",
                "menunggu_sparepart": "Menunggu Sparepart",
                "konfirmasi": "Butuh Konfirmasi",
                "dikerjakan": "Sedang Dikerjakan",
                "re-konfirmasi": "Konfirmasi Ulang",
                "selesai": "Selesai",
                "diambil": "Sudah Diambil",
                "batal": "Dibatalkan"
            };
            const readableStatus = statusMap[status] || status;

            const total = new Intl.NumberFormat("id-ID").format(extra.total || serviceData.actualCost || 0);

            let message = template
                .replace(/{customer}/g, customerName)
                .replace(/{serviceNo}/g, serviceNo)
                .replace(/{device}/g, deviceName)
                .replace(/{status}/g, readableStatus)
                .replace(/{total}/g, total)
                .replace(/{days}/g, "0");

            Logger.info(`[WHATSAPP] Sending to ${customerPhone}: ${message}`);

        } catch (e) {
            Logger.error("[WHATSAPP] Failed to send notification", e);
        }
    }
}
