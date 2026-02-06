import { PurchaseService } from "$lib/features/purchases/purchase.service";
import { InventoryService } from "$lib/features/inventory/services/inventory.service";
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";

export type PurchaseItemRow = {
    productId: string;
    variant: string;
    qty: number;
    buyPrice: number;
    sellPrice: number;
    productName?: string;
    estimatedBuyPrice?: number; // Helpers for UI
};

export class PurchaseFormController {
    // Form State
    selectedSupplierId = $state("");
    referenceNumber = $state("");
    notes = $state("");
    date = $state(new Date().toISOString().slice(0, 16));
    items = $state<PurchaseItemRow[]>([]);

    // Loading State
    loading = $state(false);

    // Dependencies Data
    suppliers = $state<any[]>([]);
    products = $state<any[]>([]);
    categories = $state<any[]>([]);

    // Helper State
    supplierPrioritizedIds = $state<string[]>([]);
    categoryItems = $state<Record<string, any[]>>({}); // For category-based selection if needed

    constructor() {
        this.addItem(); // Start with one row
    }

    // Computed
    totalAmount = $derived(
        this.items.reduce((sum, i) => sum + (i.qty || 0) * (i.buyPrice || 0), 0)
    );

    isValid = $derived(
        this.selectedSupplierId &&
        this.items.length > 0 &&
        this.items.every(i => i.productId && i.qty > 0)
    );

    // Actions
    async loadDependencies() {
        try {
            const [s, p, c] = await Promise.all([
                InventoryService.getSuppliers(),
                InventoryService.getProducts(),
                InventoryService.getCategories(),
            ]);
            this.suppliers = s;
            this.products = p;
            this.categories = c;
        } catch (e) {
            console.error("Failed to load dependencies", e);
            toast.error("Gagal memuat data awal");
        }
    }

    async loadPriorities(supplierId: string) {
        if (!supplierId) return;
        try {
            // Logic to fetch specific supplier variants or categories if needed
            // Keeping it simple based on original implementation requests
            // For now, we just update the ID
            this.selectedSupplierId = supplierId;

            // Example: Fetch prioritized items (from original code snippet intent)
            // const variants = await InventoryService.getSupplierVariants(supplierId);
            // this.supplierPrioritizedIds = variants.map((v: any) => v.name);
        } catch (e) {
            console.error("Failed to load priorities", e);
        }
    }

    addItem() {
        this.items = [
            ...this.items,
            {
                productId: "",
                variant: "Original",
                qty: 1,
                buyPrice: 0,
                sellPrice: 0,
            },
        ];
    }

    removeItem(index: number) {
        if (this.items.length <= 1) return;
        this.items = this.items.filter((_, i) => i !== index);
    }

    updateItemProduct(index: number, productId: string) {
        if (!this.items[index]) return;

        this.items[index].productId = productId;
        const p = this.products.find((x: any) => x.id === productId);
        if (p) {
            this.items[index].productName = p.name;
            // potential auto-fill logic for price could go here
        }
    }

    reset() {
        this.selectedSupplierId = "";
        this.notes = "";
        this.referenceNumber = "";
        this.date = new Date().toISOString().slice(0, 16);
        this.items = [];
        this.addItem();
    }

    async submit() {
        if (!this.isValid) {
            if (!this.selectedSupplierId) toast.error("Pilih Supplier terlebih dahulu");
            else toast.error("Lengkapi data item (Produk & Qty)");
            return;
        }

        this.loading = true;
        try {
            const payload = {
                supplierId: this.selectedSupplierId,
                notes: this.notes,
                date: new Date(this.date), // Ensure date is sent
                referenceNumber: this.referenceNumber,
                items: this.items.map((i) => ({
                    productId: i.productId,
                    variant: i.variant,
                    qty: Number(i.qty),
                    buyPrice: Number(i.buyPrice),
                    sellPrice: Number(i.sellPrice),
                })),
            };

            await PurchaseService.create(payload);
            toast.success("Pembelian berhasil disimpan!");
            this.reset();
            return true;
        } catch (e: any) {
            console.error("Submit error", e);
            const msg = e.response?.data?.message || "Gagal menyimpan pembelian";
            toast.error(msg);
            return false;
        } finally {
            this.loading = false;
        }
    }
}
