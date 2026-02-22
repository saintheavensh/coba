/**
 * Domain entities and DTOs for the Products module (Catalog Core).
 * These types define the shape of data flowing through the application layer.
 * No infrastructure dependencies allowed here.
 */

export interface ProductEntity {
    id: string;
    name: string;
    code: string | null;
    categoryId: string | null;
    image: string | null;
    minStock: number;
    stock: number;
    category?: { id: string; name: string } | null;
    batches?: ProductBatchView[];
    variants?: VariantEntity[];
    compatibility?: unknown[];
    price?: number;
}

/** Read-only batch view for product display. Products module does NOT own batches. */
export interface ProductBatchView {
    id: string;
    productId: string;
    supplierId: string | null;
    variantId: string | null;
    buyPrice: number;
    sellPrice: number;
    initialStock: number;
    currentStock: number;
    supplier?: { id: string; name: string } | null;
}

export interface VariantEntity {
    id: string;
    productId: string;
    name: string;
    image?: string | null;
    sku?: string | null;
    defaultPrice?: number | null;
    createdAt?: Date;
}

export interface InventoryStats {
    totalProducts: number;
    lowStock: number;
    totalValue: number;
    totalCategories: number;
}

export interface SearchResult {
    id: string;
    productId: string;
    productName: string;
    variantName: string;
    categoryName: string | null;
    universalCode: string | null;
    sku: string | null;
    price: number;
    stock: number;
    displayName: string;
}

export interface CreateProductData {
    id: string;
    name: string;
    code: string | null;
    categoryId: string | null;
    image?: string | null;
    minStock?: number;
    stock: number;
    compatibility?: string[];
}

export interface UpdateProductData {
    name?: string;
    code?: string | null;
    categoryId?: string | null;
    image?: string | null;
    minStock?: number;
    compatibility?: string[];
}

export interface CreateVariantData {
    id: string;
    productId: string;
    name: string;
    image?: string | null;
    sku?: string | null;
    defaultPrice?: number | null;
}

export interface UpdateVariantData {
    name?: string;
    image?: string | null;
    sku?: string | null;
    defaultPrice?: number | null;
}

export interface CategoryWithTemplates {
    id: string;
    variantTemplates?: Array<{ name: string }>;
}

export interface LabelData {
    productName: string;
    variantName?: string;
    code: string;
    price?: number;
}
