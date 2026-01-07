import { api } from "$lib/api"; // Assuming axios instance or fetch wrapper

export const CustomersService = {
    async getAll(query?: string) {
        const response = await api.get("/customers", {
            params: { q: query }
        });
        return response.data.data;
    },

    async getById(id: string) {
        const response = await api.get(`/customers/${id}`);
        return response.data.data;
    },

    async create(data: any) {
        const response = await api.post("/customers", data);
        return response.data.data;
    },

    async update(id: string, data: any) {
        const response = await api.put(`/customers/${id}`, data);
        return response.data.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/customers/${id}`);
        return response.data;
    },

    async payDebt(id: string, amount: number, notes?: string, saleId?: string, proofImage?: string) {
        const response = await api.post(`/customers/${id}/payment`, { amount, notes, saleId, proofImage });
        return response.data.data;
    },

    async getSales(id: string) {
        const response = await api.get(`/customers/${id}/sales`);
        return response.data.data;
    },

    async getUnpaidSales(id: string) {
        const response = await api.get(`/customers/${id}/unpaid-sales`);
        return response.data.data;
    },

    // Helper for uploading file
    async uploadProof(file: File) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.post("/uploads", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data.data.url;
    }
};
