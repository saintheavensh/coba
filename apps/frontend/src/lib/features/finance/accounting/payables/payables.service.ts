import { api } from "$lib/shared/core/api";

export class PayablesService {
    static async getAll() {
        const response = await api.get("/accounting/payables");
        return response.data;
    }

    static async getById(id: string) {
        const response = await api.get(`/accounting/payables/${id}`);
        return response.data;
    }

    static async recordPayment(id: string, data: any) {
        const response = await api.post(`/accounting/payables/${id}/payments`, data);
        return response.data;
    }
}
