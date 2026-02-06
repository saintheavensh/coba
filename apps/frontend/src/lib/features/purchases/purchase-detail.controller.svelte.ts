import { api } from "$lib/shared/core/api";
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { authStore } from "$lib/features/auth/auth.svelte";

export class PurchaseDetailController {
    id: string;
    purchase = $state<any>(null);
    loading = $state(true);
    error = $state("");

    // Edit State
    isEditing = $state(false);
    editItems = $state<any[]>([]);
    isSubmitting = $state(false);

    constructor(id: string) {
        this.id = id;
    }

    get role() {
        return authStore.role;
    }

    async load() {
        this.loading = true;
        this.error = "";
        try {
            const res = await api.get(`/purchases/${this.id}`);
            this.purchase = res.data?.data || res.data;

            // Initialize edit values
            if (this.purchase) {
                this.editItems = this.purchase.items.map((it: any) => ({
                    productId: it.productId,
                    variant: it.variant,
                    qtyReceived: it.qtyReceived || it.qtyOrdered,
                    buyPrice: it.buyPrice || it.estimatedBuyPrice || 0,
                    sellPrice: it.sellPrice || it.targetSellPrice || 0,
                }));
            }
        } catch (e: any) {
            console.error(e);
            this.error = "Gagal memuat detail pembelian";
            toast.error(this.error);
        } finally {
            this.loading = false;
        }
    }

    async handleReceive() {
        this.isSubmitting = true;
        try {
            await api.post(`/purchases/${this.id}/receive`, { items: this.editItems });
            toast.success("Barang berhasil diterima!");
            this.isEditing = false;
            await this.load();
        } catch (e) {
            toast.error("Gagal memproses penerimaan");
        } finally {
            this.isSubmitting = false;
        }
    }

    async handleVerify() {
        this.isSubmitting = true;
        try {
            await api.post(`/purchases/${this.id}/verify`, { items: this.editItems });
            toast.success("PO berhasil diverifikasi dan stok diupdate!");
            this.isEditing = false;
            await this.load();
        } catch (e) {
            toast.error("Gagal memverifikasi PO");
        } finally {
            this.isSubmitting = false;
        }
    }

    async handleDelete() {
        if (!confirm("Apakah Anda yakin ingin menghapus data pembelian ini? Stok akan dikembalikan dan tidak dapat dibatalkan.")) {
            return;
        }
        try {
            await api.delete(`/purchases/${this.id}`);
            toast.success("Pembelian berhasil dihapus");
            goto("/purchases");
        } catch (e) {
            console.error(e);
            toast.error("Gagal menghapus pembelian");
        }
    }

    async printLabel(item: any) {
        try {
            await api.post(`/inventory/print-label`, {
                productName: item.product?.name,
                variantName: item.variant,
                code: item.product?.code || item.productId,
                price: item.sellPrice || item.targetSellPrice,
            });
            toast.success("Label sedang diprint");
        } catch (e) {
            toast.error("Gagal print label");
        }
    }

    // Helpers
    getStatusColor(status: string) {
        switch (status) {
            case "ORDERED":
                return "bg-blue-500";
            case "RECEIVED":
                return "bg-amber-500";
            case "VERIFIED":
                return "bg-green-500";
            default:
                return "bg-slate-500";
        }
    }

    formatDate(dateStr: string) {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    formatRp(val: number) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);
    }
}
