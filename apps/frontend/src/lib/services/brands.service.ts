import { api } from "../api";

export interface Brand {
    id: string; // "samsung"
    name: string; // "Samsung Electronics"
    logo?: string;
    createdAt?: string;
}

export const BrandsService = {
    getAll: async () => {
        const res = await api.get<{ data: Brand[] }>("/brands");
        return res.data.data;
    },

    create: async (data: { id: string; name: string; logo?: string }) => {
        const res = await api.post<{ data: Brand }>("/brands", data);
        return res.data.data;
    },

    update: async (id: string, data: { name?: string; logo?: string }) => {
        const res = await api.patch<{ data: Brand }>(`/brands/${id}`, data);
        return res.data.data;
    },

    delete: async (id: string) => {
        const res = await api.delete<{ data: { deleted: boolean } }>(`/brands/${id}`);
        return res.data;
    }
};
