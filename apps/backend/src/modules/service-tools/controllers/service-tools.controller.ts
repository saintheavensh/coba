import { Context } from "hono";
import { ServiceToolsService } from "../services/service-tools.service";
import { apiSuccess, apiError } from "../../../lib/response";

const service = new ServiceToolsService();

export class ServiceToolsController {
    static async getAll(c: Context) {
        try {
            const tools = await service.getAll();
            return apiSuccess(c, tools); // Using apiSuccess for consistency, though original used c.json
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch service tools");
        }
    }

    static async create(c: Context) {
        try {
            const body = await c.req.json();
            const result = await service.create(body);
            return apiSuccess(c, result, "Service tool created", 201);
        } catch (e: any) {
            return apiError(c, e, "Failed to create service tool");
        }
    }

    static async update(c: Context) {
        try {
            const id = c.req.param("id");
            const body = await c.req.json();
            const result = await service.update(id, body);
            return apiSuccess(c, result, "Service tool updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update service tool");
        }
    }

    static async delete(c: Context) {
        try {
            const id = c.req.param("id");
            const result = await service.delete(id);
            return apiSuccess(c, result, "Service tool deleted");
        } catch (e: any) {
            return apiError(c, e, "Failed to delete service tool");
        }
    }

    static async updateCondition(c: Context) {
        try {
            const id = c.req.param("id");
            const { condition } = await c.req.json();
            const result = await service.updateCondition(id, condition);
            return apiSuccess(c, result, "Tool condition updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update tool condition");
        }
    }

    static async getMyTools(c: Context) {
        try {
            const user = c.get("user");
            const tools = await service.getByUserId(user.id);
            return apiSuccess(c, tools);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch your tools");
        }
    }

    static async createRequest(c: Context) {
        try {
            const user = c.get("user");
            const body = await c.req.json();
            const result = await service.createRequest(user.id, body);
            return apiSuccess(c, result, "Tool request submitted", 201);
        } catch (e: any) {
            return apiError(c, e, "Failed to submit tool request");
        }
    }

    static async getMyRequests(c: Context) {
        try {
            const user = c.get("user");
            const requests = await service.getRequestsByUserId(user.id);
            return apiSuccess(c, requests);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch your requests");
        }
    }

    static async getAllRequests(c: Context) {
        try {
            const requests = await service.getAllRequests();
            return apiSuccess(c, requests);
        } catch (e: any) {
        }
    }

    static async updateRequestStatus(c: Context) {
        try {
            const id = c.req.param("id");
            const { status } = await c.req.json();
            const result = await service.updateRequestStatus(id, status);
            return apiSuccess(c, result, `Tool request ${status}`);
        } catch (e: any) {
            return apiError(c, e, "Failed to update tool request status");
        }
    }
}
