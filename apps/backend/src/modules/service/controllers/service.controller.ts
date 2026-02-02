import { Context } from "hono";
import { ServiceService } from "../services/service.service";
import { PrintService } from "../../../services/print.service"; // Ensure print service is available or moved
import { apiSuccess, apiError } from "../../../lib/response";
import { Logger } from "../../../lib/logger";
import { createServiceSchema } from "@repo/shared";

export class ServiceController {
    private service: ServiceService;
    private printer: PrintService;

    constructor() {
        this.service = new ServiceService();
        this.printer = new PrintService();
    }

    async getAll(c: Context) {
        try {
            const status = c.req.query("status");
            const technicianId = c.req.query("technicianId");
            const list = await this.service.getAll({ status, technicianId });
            return apiSuccess(c, list, "Services retrieved successfully");
        } catch (e) {
            return apiError(c, e, "Failed to retrieve services");
        }
    }

    async getCounts(c: Context) {
        try {
            const counts = await this.service.getCounts();
            return apiSuccess(c, counts, "Service counts retrieved");
        } catch (e) {
            return apiError(c, e);
        }
    }

    async getStats(c: Context) {
        try {
            const user = (c as any).get("user");
            const stats = await this.service.getDashboardStats(user?.role || 'guest', user?.id);
            return apiSuccess(c, stats, "Dashboard stats retrieved");
        } catch (e) {
            return apiError(c, e);
        }
    }

    async getById(c: Context) {
        const id = parseInt(c.req.param("id"));
        if (isNaN(id)) return apiError(c, "Invalid ID", "Validation error", 400);

        try {
            const item = await this.service.getById(id);
            if (!item) return apiError(c, "Service not found", "Not found", 404);
            return apiSuccess(c, item, "Service retrieved successfully");
        } catch (e) {
            return apiError(c, e);
        }
    }

    async createService(c: Context) {
        try {
            const body = await c.req.json();
            const parseResult = createServiceSchema.safeParse(body);

            if (!parseResult.success) {
                Logger.warn("Validation Failed:", { errors: parseResult.error });
                return apiError(c, parseResult.error, "Validation Error Details", 400);
            }

            const data = parseResult.data;
            const user = (c as any).get("user");

            const result = await this.service.createService(data, user?.id || "USR-000");
            return apiSuccess(c, result, "Service created successfully", 201);
        } catch (e) {
            return apiError(c, e, "Failed to create service", 400);
        }
    }

    async updateStatus(c: Context) {
        const id = parseInt(c.req.param("id"));
        const data = await c.req.json(); // Assuming validation handled by route validator if passed
        // Or if handling simple logic:
        // const data = c.req.valid("json"); 

        try {
            await this.service.updateStatus(id, data, data.userId);
            return apiSuccess(c, null, "Status updated successfully");
        } catch (e) {
            return apiError(c, e, "Failed to update status", 400);
        }
    }

    async updateDetails(c: Context) {
        const id = parseInt(c.req.param("id"));
        try {
            const body = await c.req.json();
            const user = (c as any).get("user");
            await this.service.updateDetails(id, body, user?.id);
            return apiSuccess(c, null, "Details updated successfully");
        } catch (e) {
            return apiError(c, e, "Failed to update details", 400);
        }
    }

    async deleteService(c: Context) {
        const id = parseInt(c.req.param("id"));
        try {
            await this.service.delete(id);
            return apiSuccess(c, null, "Service deleted successfully");
        } catch (e) {
            return apiError(c, e, "Failed to delete service", 500);
        }
    }

    async printService(c: Context) {
        const id = parseInt(c.req.param("id"));
        if (isNaN(id)) return apiError(c, "Invalid ID", "Validation error", 400);

        try {
            const item = await this.service.getById(id);
            if (!item) return apiError(c, "Service not found", "Not found", 404);

            const result = await this.printer.printServiceNote(item);
            if (!result.success) {
                return apiError(c, result.error, "Print failed", 500);
            }

            return apiSuccess(c, null, "Print command sent to server printer");
        } catch (e) {
            return apiError(c, String(e), "Print failed", 500);
        }
    }

    async patchService(c: Context) {
        const id = parseInt(c.req.param("id"));
        if (isNaN(id)) return apiError(c, "Invalid ID", "Validation error", 400);

        try {
            const body = await c.req.json();
            const result = await this.service.patchService(id, body);
            return apiSuccess(c, result, "Service updated successfully");
        } catch (e) {
            return apiError(c, e, "Failed to reschedule service", 400);
        }
    }

    async assignTechnician(c: Context) {
        const id = parseInt(c.req.param("id"));
        try {
            const body = await c.req.json();
            const user = (c as any).get("user");

            if (!body.technicianId) return apiError(c, "Technician ID required", "Validation Error", 400);

            const result = await this.service.assignTechnician(id, body.technicianId, user?.id);
            return apiSuccess(c, result, "Technician assigned successfully");
        } catch (e) {
            return apiError(c, e, "Failed to assign technician", 400);
        }
    }
}
