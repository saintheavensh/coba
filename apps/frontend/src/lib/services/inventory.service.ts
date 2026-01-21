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
    importDevices: async (file: File): Promise<{ imported: number; skipped: number; errors: string[] }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Get first sheet
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // Convert to JSON
                    const rows = XLSX.utils.sheet_to_json<any>(worksheet);

                    const result = { imported: 0, skipped: 0, errors: [] as string[] };

                    // fetch existing brands to minimize requests
                    const existingBrands = await BrandsService.getAll();
                    const brandMap = new Set(existingBrands.map(b => b.name.toLowerCase().trim()));

                    for (const row of rows) {
                        try {
                            // Normalize keys (Brand, brand, BRAND -> brand)
                            const normalizedRow: any = {};
                            Object.keys(row).forEach(key => {
                                normalizedRow[key.toLowerCase()] = row[key];
                            });

                            const brandName = normalizedRow.brand;
                            const modelName = normalizedRow.model;

                            if (!brandName || !modelName) {
                                result.skipped++;
                                continue;
                            }

                            // 1. Handle Brand
                            const brandKey = brandName.toLowerCase().trim();
                            if (!brandMap.has(brandKey)) {
                                try {
                                    // Optimistic check before create
                                    const allBrands = await BrandsService.getAll();
                                    const exists = allBrands.find(b => b.name.toLowerCase().trim() === brandKey);

                                    if (!exists) {
                                        await BrandsService.create({
                                            id: brandKey.replace(/\s+/g, "-"),
                                            name: brandName.trim()
                                        });
                                        // Refresh map
                                        brandMap.add(brandKey);
                                    } else {
                                        brandMap.add(brandKey);
                                    }
                                } catch (err) {
                                    console.warn(`Brand creation warning for ${brandName}`, err);
                                    // Proceed anyway, backend might handle it or it failed
                                }
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
                                brand: brandName.trim(),
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

                            result.imported++;
                        } catch (err: any) {
                            result.errors.push(`Failed to import ${row.brand || '?'} ${row.model || '?'}: ${err.message}`);
                            result.skipped++;
                        }
                    }

                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            };

            reader.onerror = (err) => reject(err);
            reader.readAsArrayBuffer(file);
        });
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
