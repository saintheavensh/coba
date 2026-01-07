import { api } from "../api";

export const SalesService = {
    create: async (data: any) => {
        // data: { items: [{ productId, variant, qty }] }
        const res = await api.post("/sales", data);
        return res.data;
    },
    getAll: async (params?: Record<string, string>) => {
        const query = new URLSearchParams(params).toString();
        const res = await api.get(`/sales?${query}`);
        return res.data?.data || res.data;
    },
    getOne: async (id: string) => {
        const res = await api.get(`/sales/${id}`);
        return res.data?.data || res.data;
    }
};
