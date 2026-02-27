import { productsService } from '../services/products.service';
import type { Product, ProductFilters, ProductResponse } from '../types/products.types';
import { toast } from "svelte-sonner";

export function createProductStore() {
    let products = $state<Product[]>([]);
    let total = $state(0);
    let page = $state(1);
    let limit = $state(20);
    let loading = $state(false);
    let error = $state<string | null>(null);
    let selectedIds = $state<string[]>([]);

    // Filters
    let filters = $state<ProductFilters>({
        search: '',
        category: '',
        supplier: '',
        lowStock: false,
        sort: 'name:asc'
    });

    async function loadProducts() {
        loading = true;
        error = null;
        try {
            const data = await productsService.getProducts({
                ...filters,
                page,
                limit
            });
            products = data.items;
            total = data.total;
        } catch (e: any) {
            error = e.message || "Failed to load products";
            toast.error(error!);
        } finally {
            loading = false;
        }
    }

    // Actions
    function setPage(p: number) {
        page = p;
        loadProducts();
    }

    function setFilter(newFilters: Partial<ProductFilters>) {
        filters = { ...filters, ...newFilters };
        page = 1; // Reset to first page on filter change
        loadProducts();
    }

    function toggleSelect(id: string) {
        if (selectedIds.includes(id)) {
            selectedIds = selectedIds.filter(i => i !== id);
        } else {
            selectedIds = [...selectedIds, id];
        }
    }

    function selectAll() {
        if (selectedIds.length === products.length) {
            selectedIds = [];
        } else {
            selectedIds = products.map(p => p.id);
        }
    }

    async function deleteProduct(id: string) {
        try {
            await productsService.deleteProduct(id);
            toast.success("Product deleted successfully");
            loadProducts();
        } catch (e: any) {
            toast.error(e.message || "Failed to delete product");
        }
    }

    async function bulkUpdatePrice(percentage: number) {
        try {
            // Placeholder logic for bulk update
            await productsService.bulkUpdate(selectedIds, { priceAdjustment: percentage });
            toast.success("Bulk update successful");
            selectedIds = [];
            loadProducts();
        } catch (e: any) {
            toast.error(e.message || "Failed to bulk update price");
        }
    }

    // Specialized loaders
    async function loadSpareparts() {
        loading = true;
        try {
            const data = await productsService.getSpareparts();
            products = data;
            total = data.length;
        } catch (e: any) {
            toast.error("Failed to load spareparts");
        } finally {
            loading = false;
        }
    }

    return {
        // State
        get products() { return products; },
        get total() { return total; },
        get page() { return page; },
        get limit() { return limit; },
        get loading() { return loading; },
        get error() { return error; },
        get selectedIds() { return selectedIds; },
        get filters() { return filters; },

        // Methods
        loadProducts,
        loadSpareparts,
        setPage,
        setFilter,
        toggleSelect,
        selectAll,
        deleteProduct,
        bulkUpdatePrice
    };
}
