import { api } from "../api";
import type { Product, Category, Supplier, ApiResponse, Device } from "@repo/shared";

/** Input type for creating a device */
export interface CreateDeviceInput {
    brand: string;
    model: string;
    code?: string;
    image?: string;
}

/** Input type for creating a product */
interface CreateProductInput {
    name: string;
    code?: string;
    categoryId?: string;
    image?: string;
    minStock?: number;
    compatibility?: string[];
}

/** Input type for creating a category */
interface CreateCategoryInput {
    name: string;
    description?: string;
}

/** Input type for creating a supplier */
interface CreateSupplierInput {
    name: string;
    contact?: string;
    phone?: string;
    address?: string;
    image?: string;
}

export const InventoryService = {
    // Products
    getProducts: async (deviceId?: string): Promise<Product[]> => {
        const res = await api.get<ApiResponse<Product[]>>("/inventory", { params: { deviceId } });
        return res.data?.data ?? [];
    },
    getProduct: async (id: string): Promise<Product> => {
        const res = await api.get<ApiResponse<Product>>(`/inventory/${id}`);
        return res.data?.data!;
    },
    createProduct: async (data: CreateProductInput): Promise<Product> => {
        const res = await api.post<ApiResponse<Product>>("/inventory", data);
        return res.data?.data!;
    },
    updateProduct: async (id: string, data: Partial<CreateProductInput>): Promise<Product> => {
        const res = await api.put<ApiResponse<Product>>(`/inventory/${id}`, data);
        return res.data?.data!;
    },
    deleteProduct: async (id: string): Promise<void> => {
        await api.delete(`/inventory/${id}`);
    },
    getSupplierVariants: async (supplierId: string): Promise<string[]> => {
        const res = await api.get<ApiResponse<string[]>>(`/inventory/suppliers/${supplierId}/variants`);
        return res.data?.data ?? [];
    },

    // Categories
    getCategories: async (): Promise<Category[]> => {
        const res = await api.get<ApiResponse<Category[]>>("/categories");
        return res.data?.data ?? [];
    },
    createCategory: async (data: CreateCategoryInput): Promise<Category> => {
        const res = await api.post<ApiResponse<Category>>("/categories", data);
        return res.data?.data!;
    },
    updateCategory: async (id: string, data: Partial<CreateCategoryInput>): Promise<Category> => {
        const res = await api.put<ApiResponse<Category>>(`/categories/${id}`, data);
        return res.data?.data!;
    },
    deleteCategory: async (id: string): Promise<void> => {
        await api.delete(`/categories/${id}`);
    },

    // Devices
    getDevices: async (search?: string): Promise<Device[]> => {
        const res = await api.get<ApiResponse<Device[]>>("/devices", { params: { search } });
        return res.data?.data ?? [];
    },
    createDevice: async (data: CreateDeviceInput): Promise<Device> => {
        const res = await api.post<ApiResponse<Device>>("/devices", data);
        return res.data?.data!;
    },
    updateDevice: async (id: string, data: Partial<CreateDeviceInput>): Promise<Device> => {
        const res = await api.patch<ApiResponse<Device>>(`/devices/${id}`, data);
        return res.data?.data!;
    },
    deleteDevice: async (id: string): Promise<void> => {
        await api.delete(`/devices/${id}`);
    },

    // Suppliers
    getSuppliers: async (): Promise<Supplier[]> => {
        const res = await api.get<ApiResponse<Supplier[]>>("/suppliers");
        return res.data?.data ?? [];
    },
    createSupplier: async (data: CreateSupplierInput): Promise<Supplier> => {
        const res = await api.post<ApiResponse<Supplier>>("/suppliers", data);
        return res.data?.data!;
    },
    updateSupplier: async (id: string, data: Partial<CreateSupplierInput>): Promise<Supplier> => {
        const res = await api.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data);
        return res.data?.data!;
    },
    deleteSupplier: async (id: string): Promise<void> => {
        await api.delete(`/suppliers/${id}`);
    }
};
