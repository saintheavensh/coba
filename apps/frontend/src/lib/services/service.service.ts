import { api } from "../api";

export const ServiceService = {
    getAll: async (params?: Record<string, string>) => {
        const query = new URLSearchParams(params).toString();
        const res = await api.get(`/service?${query}`);
        return res.data;
    },
    create: async (data: any) => {
        const res = await api.post("/service", data);
        return res.data;
    },
    getById: async (id: number | string) => {
        const res = await api.get(`/service/${id}`);
        return res.data;
    },
    updateStatus: async (id: number | string, data: any) => {
        const res = await api.put(`/service/${id}/status`, data);
        return res.data;
    }
};
