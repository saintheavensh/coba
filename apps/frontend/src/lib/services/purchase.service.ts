import { api } from "../api";

export const PurchaseService = {
    getAll: async () => {
        const res = await api.get("/purchases");
        // Handle new generic response format { success, data, ... }
        return res.data.data || res.data;
    },
    create: async (data: any) => {
        const res = await api.post("/purchases", data);
        return res.data;
    }
};
