import { api } from "$lib/api";

export interface OperationalCost {
    id: number;
    category: string;
    amount: number;
    date: string | Date;
    description?: string;
    userId?: string;
    createdAt?: string;
}

export class OperationalCostsService {
    static async getAll() {
        const res = await api.get<OperationalCost[]>("/operational-costs");
        return res.data;
    }
    static async create(data: Partial<OperationalCost>) {
        const res = await api.post("/operational-costs", data);
        return res.data;
    }
    static async delete(id: number) {
        const res = await api.delete(`/operational-costs/${id}`);
        return res.data;
    }
}
