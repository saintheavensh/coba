import { Context } from "hono";
import { serviceToolsApplicationService, ServiceToolsApplicationService } from "../service-tools-container";
import { apiSuccess, apiError } from "../../../lib/response";

export class ServiceToolsController {
    constructor(
        private readonly service: ServiceToolsApplicationService = serviceToolsApplicationService
    ) { }

    async getAll(c: Context) {
        try {
            const list = await this.service.getAll();
            return apiSuccess(c, list, "Service tools retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve service tools");
        }
    }

    async getMyTools(c: Context) {
        try {
            const user = c.get("user");
            const list = await this.service.getByUserId(user.id);
            return apiSuccess(c, list, "Your tools retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve your tools");
        }
    }

    async create(c: Context) {
        try {
            const data = await c.req.json();
            const result = await this.service.create(data);
            return apiSuccess(c, result, "Service tool created successfully", 201);
        } catch (e: any) {
            return apiError(c, e, "Failed to create service tool");
        }
    }

    async update(c: Context) {
        const id = c.req.param("id");
        try {
            const data = await c.req.json();
            await this.service.update(id, data);
            return apiSuccess(c, null, "Service tool updated successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to update service tool");
        }
    }

    async updateCondition(c: Context) {
        const id = c.req.param("id");
        try {
            const { condition } = await c.req.json();
            await this.service.updateCondition(id, condition);
            return apiSuccess(c, null, "Tool condition updated successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to update tool condition");
        }
    }

    async delete(c: Context) {
        const id = c.req.param("id");
        try {
            await this.service.delete(id);
            return apiSuccess(c, null, "Service tool deleted successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to delete service tool");
        }
    }

    // Requests
    async createRequest(c: Context) {
        try {
            const user = c.get("user");
            const data = await c.req.json();
            const result = await this.service.createRequest(user.id, user.name || "Technician", data);
            return apiSuccess(c, result, "Tool request submitted successfully", 201);
        } catch (e: any) {
            return apiError(c, e, "Failed to submit tool request");
        }
    }

    async getMyRequests(c: Context) {
        try {
            const user = c.get("user");
            const list = await this.service.getMyRequests(user.id);
            return apiSuccess(c, list, "Your requests retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve your requests");
        }
    }

    async getAllRequests(c: Context) {
        try {
            const list = await this.service.getAllRequests();
            return apiSuccess(c, list, "All tool requests retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve tool requests");
        }
    }

    async updateRequestStatus(c: Context) {
        const id = c.req.param("id");
        try {
            const { status } = await c.req.json();
            await this.service.updateRequestStatus(id, status);
            return apiSuccess(c, null, `Tool request ${status} successfully`);
        } catch (e: any) {
            return apiError(c, e, "Failed to update tool request status");
        }
    }
}
