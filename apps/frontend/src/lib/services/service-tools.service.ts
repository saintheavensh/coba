import { api } from "$lib/api";
import type { ApiResponse } from "@repo/shared";

export interface ServiceTool {
    id: string;
    name: string;
    brand?: string;
    qty: number;
    condition: "good" | "damaged" | "lost";
    purchaseDate?: string;
    price?: number;
    notes?: string;
    createdAt?: string;
}

export class ServiceToolsService {
    static async getAll() {
        const res = await api.get<ApiResponse<ServiceTool[]>>("/service-tools");
        return res.data.data || [];
    }
    static async create(data: Partial<ServiceTool>) {
        const res = await api.post<ApiResponse<ServiceTool>>("/service-tools", data);
        return res.data.data;
    }
    static async update(id: string, data: Partial<ServiceTool>) {
        const res = await api.put<ApiResponse<ServiceTool>>(`/service-tools/${id}`, data);
        return res.data.data;
    }
    static async delete(id: string) {
        const res = await api.delete<ApiResponse<any>>(`/service-tools/${id}`);
        return res.data.data;
    }
}
