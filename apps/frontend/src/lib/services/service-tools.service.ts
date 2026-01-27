import { api } from "$lib/api";

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
        const res = await api.get<ServiceTool[]>("/service-tools");
        return res.data;
    }
    static async create(data: Partial<ServiceTool>) {
        const res = await api.post("/service-tools", data);
        return res.data;
    }
    static async update(id: string, data: Partial<ServiceTool>) {
        const res = await api.put(`/service-tools/${id}`, data);
        return res.data;
    }
    static async delete(id: string) {
        const res = await api.delete(`/service-tools/${id}`);
        return res.data;
    }
}
