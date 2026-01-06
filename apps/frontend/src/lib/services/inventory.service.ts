import { api } from "../api";

export const InventoryService = {
    // Products
    getProducts: async () => {
        const res = await api.get("/inventory");
        return res.data?.data || res.data;
    },
    getProduct: async (id: string) => {
        const res = await api.get(`/inventory/${id}`);
        return res.data?.data || res.data;
    },
    createProduct: async (data: any) => {
        const res = await api.post("/inventory", data);
        return res.data?.data || res.data;
    },
    updateProduct: async (id: string, data: any) => {
        const res = await api.put(`/inventory/${id}`, data);
        return res.data?.data || res.data;
    },
    deleteProduct: async (id: string) => {
        const res = await api.delete(`/inventory/${id}`);
        return res.data?.data || res.data;
    },
    getSupplierVariants: async (supplierId: string) => {
        const res = await api.get(`/inventory/suppliers/${supplierId}/variants`);
        return res.data?.data || res.data;
    },

    // Categories
    getCategories: async () => {
        const res = await api.get("/categories");
        return res.data?.data || res.data;
    },
    createCategory: async (data: any) => {
        const res = await api.post("/categories", data);
        return res.data?.data || res.data;
    },
    updateCategory: async (id: string, data: any) => {
        const res = await api.put(`/categories/${id}`, data);
        return res.data?.data || res.data;
    },
    deleteCategory: async (id: string) => {
        const res = await api.delete(`/categories/${id}`);
        return res.data?.data || res.data;
    },

    // Suppliers
    getSuppliers: async () => {
        const res = await api.get("/suppliers");
        return res.data?.data || res.data;
    },
    createSupplier: async (data: any) => {
        const res = await api.post("/suppliers", data);
        return res.data?.data || res.data;
    },
    updateSupplier: async (id: string, data: any) => {
        const res = await api.put(`/suppliers/${id}`, data);
        return res.data?.data || res.data;
    },
    deleteSupplier: async (id: string) => {
        const res = await api.delete(`/suppliers/${id}`);
        return res.data?.data || res.data;
    }
};
