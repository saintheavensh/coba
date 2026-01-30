import { api } from "../api";
import type { Product, Category, Supplier, ApiResponse, Device } from "@repo/shared";
import * as XLSX from "xlsx";
import { BrandsService } from "./brands.service";

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
    parentId?: string | null;
    variants?: string[];
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
    getProducts: async (deviceId?: string, search?: string, categoryId?: string): Promise<Product[]> => {
        const res = await api.get<ApiResponse<Product[]>>("/inventory", {
            params: { deviceId, search, categoryId }
        });
        return res.data?.data ?? [];
    },
    getStats: async (): Promise<{ totalProducts: number; lowStock: number; totalValue: number; totalCategories: number }> => {
        const res = await api.get<ApiResponse<{ totalProducts: number; lowStock: number; totalValue: number; totalCategories: number }>>("/inventory/stats");
        return res.data?.data!;
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
    getProductVariants: async (productId: string): Promise<any[]> => {
        const res = await api.get<ApiResponse<any[]>>(`/inventory/${productId}/variants`);
        return res.data?.data ?? [];
    },

    // Variants
    createVariant: async (data: { productId: string; name: string; image?: string; sku?: string; defaultPrice?: number; }): Promise<any> => {
        const res = await api.post<ApiResponse<any>>("/inventory/variants", data);
        return res.data?.data;
    },
    updateVariant: async (id: string, data: { name?: string; image?: string; sku?: string; defaultPrice?: number; }): Promise<any> => {
        const res = await api.put<ApiResponse<any>>(`/inventory/variants/${id}`, data);
        return res.data?.data;
    },
    deleteVariant: async (id: string): Promise<void> => {
        await api.delete(`/inventory/variants/${id}`);
    },

    // Bulk Min Stock
    getProductCountByCategory: async (categoryId: string): Promise<number> => {
        const res = await api.get<ApiResponse<{ count: number }>>(`/inventory/categories/${categoryId}/product-count`);
        return res.data?.data?.count ?? 0;
    },
    bulkUpdateMinStock: async (categoryId: string, minStock: number): Promise<number> => {
        const res = await api.patch<ApiResponse<{ updatedCount: number }>>("/inventory/bulk-min-stock", { categoryId, minStock });
        return res.data?.data?.updatedCount ?? 0;
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

    // Category Variants
    addVariantTemplate: async (categoryId: string, name: string, supplierId?: string): Promise<any> => {
        const res = await api.post<ApiResponse<any>>(`/categories/${categoryId}/variants`, { name, supplierId });
        return res.data?.data;
    },
    removeVariantTemplate: async (variantId: number): Promise<void> => {
        await api.delete(`/categories/variants/${variantId}`);
    },

    // Devices
    getDevices: async (search?: string, limit: number = 20, offset: number = 0, brand?: string): Promise<Device[]> => {
        const res = await api.get<ApiResponse<Device[]>>("/devices", {
            params: { search, limit, offset, brand }
        });
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
    bulkDeleteDevices: async (ids: string[]): Promise<void> => {
        await api.post("/devices/bulk-delete", { ids });
    },
    scrapeDevice: async (url: string): Promise<any> => {
        const res = await api.post<ApiResponse<any>>("/devices/scrape", { url });
        return res.data?.data;
    },
    getDeviceList: async (url: string): Promise<{ name: string; url: string; }[]> => {
        const res = await api.post<ApiResponse<{ name: string; url: string; }[]>>("/devices/scrape-list", { url });
        return res.data?.data ?? [];
    },
    importDeviceFromUrl: async (url: string): Promise<any> => {
        const res = await api.post<ApiResponse<any>>("/devices/import-url", { url });
        return res.data?.data;
    },
    exportDevices: async (format: "csv" | "excel") => {
        try {
            // 1. Fetch all devices
            const devices = await InventoryService.getDevices();

            // 2. Format data
            const rows = devices.map(d => ({
                Brand: d.brand,
                Model: d.model,
                Series: d.series || "",
                Code: d.code || "",
                Image: d.image || "",
                Colors: Array.isArray(d.colors) ? d.colors.join(", ") : "",
                Specs: d.specs || "",
                Chipset: d.chipset || "",
                Specifications: d.specifications ? JSON.stringify(d.specifications) : ""
            }));

            // 3. Create Workbook
            const ws = XLSX.utils.json_to_sheet(rows);
            // Auto width
            const cols = Object.keys(rows[0] || {}).map(k => ({ wch: 20 }));
            ws['!cols'] = cols;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Devices");

            // 4. Download
            if (format === "csv") {
                XLSX.writeFile(wb, "devices_export.csv");
            } else {
                XLSX.writeFile(wb, "devices_export.xlsx");
            }
        } catch (e) {
            console.error("Export failed", e);
            throw e;
        }
    },
    parseImportFile: async (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const rows = XLSX.utils.sheet_to_json<any>(worksheet);

                    // Normalize keys immediately
                    const normalizedRows = rows.map(row => {
                        const normalized: any = {};
                        Object.keys(row).forEach(key => {
                            normalized[key.toLowerCase()] = row[key];
                        });
                        return normalized;
                    });

                    resolve(normalizedRows);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = (err) => reject(err);
            reader.readAsArrayBuffer(file);
        });
    },

    importDeviceRow: async (normalizedRow: any): Promise<void> => {
        const brandName = normalizedRow.brand;
        const modelName = normalizedRow.model;

        if (!brandName || !modelName) {
            throw new Error("Brand and Model are required");
        }

        // 1. Handle Brand - normalize to capitalize first letter
        const normalizeBrandName = (name: string): string => {
            if (!name || name.trim().length === 0) return name;
            const trimmed = name.trim();
            return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
        };

        const normalizedBrandName = normalizeBrandName(brandName);

        // Ensure brand exists
        try {
            const brandKey = normalizedBrandName.toLowerCase().trim();
            const allBrands = await BrandsService.getAll();
            const exists = allBrands.find(b => b.name.toLowerCase().trim() === brandKey);

            if (!exists) {
                await BrandsService.create({
                    id: brandKey.replace(/\s+/g, "-"),
                    name: normalizedBrandName
                });
            }
        } catch (err) {
            console.warn(`Brand creation warning for ${brandName}`, err);
        }

        // Parse colors
        let colorsArray: string[] = [];
        if (normalizedRow.colors && typeof normalizedRow.colors === 'string') {
            colorsArray = normalizedRow.colors.split(",").map((c: string) => c.trim()).filter((c: string) => c);
        }

        // Parse specs json if exists
        let specifications = {};
        if (normalizedRow.specifications) {
            try {
                specifications = JSON.parse(normalizedRow.specifications);
            } catch { }
        }

        // 2. Create Device
        await InventoryService.createDevice({
            brand: normalizedBrandName,
            model: modelName.trim(),
            code: normalizedRow.code?.toString(),
            image: normalizedRow.image,
            // @ts-ignore
            series: normalizedRow.series,
            colors: colorsArray.length > 0 ? colorsArray : undefined,
            specs: normalizedRow.specs,
            chipset: normalizedRow.chipset,
            specifications: Object.keys(specifications).length > 0 ? specifications : undefined
        });
    },

    importDevices: async (file: File): Promise<{ imported: number; skipped: number; errors: string[] }> => {
        // Validation wrapper reusing the new methods
        try {
            const rows = await InventoryService.parseImportFile(file);
            const result = { imported: 0, skipped: 0, errors: [] as string[] };

            for (const row of rows) {
                try {
                    await InventoryService.importDeviceRow(row);
                    result.imported++;
                } catch (err: any) {
                    result.errors.push(`Failed: ${err.message}`);
                    result.skipped++;
                }
            }
            return result;
        } catch (err: any) {
            return { imported: 0, skipped: 0, errors: [err.message] };
        }
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
    },

    // Stock Opname
    getOpnameSessions: async (): Promise<any[]> => {
        const res = await api.get<ApiResponse<any[]>>("/inventory/opname/sessions");
        return res.data?.data ?? [];
    },
    createOpnameSession: async (data: { notes?: string; categoryId?: string }): Promise<{ id: string }> => {
        const res = await api.post<ApiResponse<{ id: string }>>("/inventory/opname/sessions", data);
        return res.data?.data!;
    },
    getOpnameSessionDetails: async (id: string): Promise<any> => {
        const res = await api.get<ApiResponse<any>>(`/inventory/opname/sessions/${id}`);
        return res.data?.data;
    },
    updateOpnameItem: async (itemId: number, data: { physicalStock: number, reason?: string }): Promise<any> => {
        const res = await api.put<ApiResponse<any>>(`/inventory/opname/items/${itemId}`, data);
        return res.data?.data;
    },
    finalizeOpnameSession: async (id: string): Promise<void> => {
        await api.post(`/inventory/opname/sessions/${id}/finalize`);
    },
    cancelOpnameSession: async (id: string): Promise<void> => {
        await api.post(`/inventory/opname/sessions/${id}/cancel`);
    }
};
