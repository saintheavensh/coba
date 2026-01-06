import { api } from "../api";

export const SalesService = {
    create: async (data: any) => {
        // data: { items: [{ productId, variant, qty }] }
        const res = await api.post("/sales", data);
        return res.data;
    }
};
