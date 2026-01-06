import { z } from "zod";

// --- Auth Schemas ---
export const loginSchema = z.object({
    username: z.string(),
    password: z.string()
});
export type LoginRequest = z.infer<typeof loginSchema>;
export type LoginResponse = {
    token: string;
    user: {
        id: string;
        name: string;
        role: string;
    }
};

// --- Inventory Schemas ---
// --- Inventory Schemas ---
export const categorySchema = z.object({
    name: z.string().min(1),
    description: z.string().optional()
});
export type CreateCategoryRequest = z.infer<typeof categorySchema>;

export const productSchema = z.object({
    name: z.string().min(1),
    code: z.string().optional(), // Universal Code
    categoryId: z.string().optional(), // Link to category
    image: z.string().optional(),
    minStock: z.number().default(5)
});
export type CreateProductRequest = z.infer<typeof productSchema>;

export const batchSchema = z.object({
    productId: z.string(),
    brand: z.string().optional(), // Brand/Merk for this batch
    supplier: z.string().optional(),
    buyPrice: z.number(),
    sellPrice: z.number(),
    stock: z.number()
});
export type AddBatchRequest = z.infer<typeof batchSchema>;

export type Product = {
    id: string;
    code?: string | null;
    name: string;
    categoryId: string | null;
    stock: number;
    minStock: number | null;
    createdAt: Date | null;
    // Computed/Frontend props
    status?: "Normal" | "Critical" | "Empty";
    categoryName?: string; // Joined name
    min?: number; // legacy alias
};

// --- Service Schemas ---
export const createServiceSchema = z.object({
    type: z.enum(["regular", "walk_in"]),
    customer: z.object({
        name: z.string(),
        phone: z.string(),
        address: z.string().optional()
    }),
    unit: z.object({
        brand: z.string(),
        model: z.string(),
        status: z.string(),
        imei: z.string().optional(),
        pin: z.string().optional(),
        condition: z.array(z.string()).optional(),
        completeness: z.array(z.string()).optional(),
        physicalNotes: z.string().optional()
    }),
    complaint: z.string(),
    technicianId: z.string().nullable().optional(),
    // Schema says: technicianId: text("technician_id").references(() => users.id)
    // Users ID is text (UUID). So string.
    // Frontend sent parseInt(technician).
    // I need to check backend schema again.

    status: z.enum(["antrian", "dicek", "konfirmasi", "dikerjakan", "selesai", "diambil", "batal"]).default("antrian"),

    // Regular specific
    diagnosis: z.object({
        initial: z.string().optional(),
        possibleCauses: z.string().optional(),
        estimatedCost: z.string().optional(), // Can be range "100-200" or simple "150000"
        downPayment: z.string().optional() // received as string from input?
    }).optional(),

    // Walk-in/Parts
    parts: z.array(z.object({
        productId: z.string().or(z.number()), // might be ID or name?
        qty: z.number(),
        price: z.number()
    })).optional()
});

export type CreateServiceRequest = z.infer<typeof createServiceSchema>;

// Update Status Schema
export const updateStatusSchema = z.object({
    status: z.enum(["antrian", "dicek", "konfirmasi", "dikerjakan", "selesai", "diambil", "batal"]),
    notes: z.string().optional(),
    actualCost: z.number().optional(),
    userId: z.string() // Who performed the action
});
export type UpdateStatusRequest = z.infer<typeof updateStatusSchema>;

// Shared Types
export type Category = {
    id: string;
    name: string;
    description: string | null;
};

export type User = {
    id: string;
    username: string;
    name: string;
    role: "admin" | "teknisi" | "kasir";
};
