import { ServiceToolsModel } from "../models/service-tools.model";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { UsersModel } from "../../users/models/users.model";

export class ServiceToolsService {
    async getAll() {
        return await ServiceToolsModel.findAll();
    }

    async create(data: any) {
        // Generate ID
        const last = await ServiceToolsModel.findLast();
        let nextId = "TOOL-001";
        if (last.length > 0) {
            const parts = last[0].id.split("-");
            if (parts.length > 1) {
                const num = parseInt(parts[1]);
                if (!isNaN(num)) {
                    nextId = `TOOL-${String(num + 1).padStart(3, "0")}`;
                }
            }
        }

        const newData = {
            id: nextId,
            name: data.name,
            brand: data.brand,
            qty: Number(data.qty) || 1,
            condition: data.condition || "good",
            purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
            price: Number(data.price) || 0,
            notes: data.notes
        };

        await ServiceToolsModel.create(newData as any);
        return newData;
    }

    async getByUserId(userId: string) {
        return await ServiceToolsModel.findByUserId(userId);
    }

    async update(id: string, data: any) {
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.brand) updateData.brand = data.brand;
        if (data.qty !== undefined) updateData.qty = Number(data.qty);
        if (data.condition) updateData.condition = data.condition;
        if (data.purchaseDate) updateData.purchaseDate = new Date(data.purchaseDate);
        if (data.price !== undefined) updateData.price = Number(data.price);
        if (data.notes) updateData.notes = data.notes;
        if (data.userId !== undefined) updateData.userId = data.userId; // Support updating assigned user

        return await ServiceToolsModel.update(id, updateData);
    }

    async updateCondition(id: string, condition: "good" | "damaged" | "lost") {
        return await ServiceToolsModel.update(id, { condition });
    }

    async delete(id: string) {
        return await ServiceToolsModel.delete(id);
    }

    // Tool Requests
    async createRequest(userId: string, data: any) {
        const newData = {
            userId,
            toolName: data.toolName,
            justification: data.justification,
        };
        const request = await ServiceToolsModel.createRequest(newData as any);

        // Notify all owners
        try {
            const usersModel = new UsersModel();
            const notificationsService = new NotificationsService();
            const owners = await usersModel.findAll("owner");

            for (const owner of owners) {
                await notificationsService.createNotification({
                    userId: owner.id,
                    title: "Permintaan Alat Baru",
                    message: `Teknisi meminta alat baru: ${data.toolName}`,
                    type: "service_tool_request",
                });
            }
        } catch (error) {
            console.error("Failed to send tool request notifications", error);
        }

        return request;
    }

    async getRequestsByUserId(userId: string) {
        return await ServiceToolsModel.findRequestByUserId(userId);
    }

    async getAllRequests() {
        return await ServiceToolsModel.findAllRequests();
    }

    async updateRequestStatus(id: string, status: "approved" | "rejected") {
        return await ServiceToolsModel.updateRequestStatus(id, status);
    }
}
