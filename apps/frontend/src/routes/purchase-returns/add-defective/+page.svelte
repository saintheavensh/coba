<script lang="ts">
    import { createQuery } from "@tanstack/svelte-query";
    import { api } from "$lib/api";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";
    import { Loader2, ArrowLeft } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { toast } from "svelte-sonner";
    import { formatCurrency } from "$lib/utils";

    // Form State
    let selectedProductId = $state("");
    let selectedBatchId = $state("");
    let qty = $state(0);
    let reason = $state("");
    let isSubmitting = $state(false);

    // Queries
    const productsQuery = createQuery<any[]>(() => ({
        queryKey: ["products"],
        queryFn: async () => (await api.get("/inventory")).data.data,
    }));

    const batchesQuery = createQuery<any[]>(() => ({
        queryKey: ["batches", selectedProductId],
        queryFn: async () => {
            if (!selectedProductId) return [];
            const res = await api.get(`/inventory/${selectedProductId}`);
            return res.data.data.batches;
        },
        enabled: !!selectedProductId,
    }));

    // Derived Logic
    let selectedBatch = $derived(
        batchesQuery.data?.find((b: any) => b.id === selectedBatchId),
    );

    async function handleSubmit() {
        if (!selectedProductId || !selectedBatchId || qty <= 0 || !reason) {
            toast.error("Mohon lengkapi semua field");
            return;
        }

        if (selectedBatch && qty > selectedBatch.currentStock) {
            toast.error("Stok tidak mencukupi");
            return;
        }

        isSubmitting = true;
        try {
            await api.post("/defective-items", {
                productId: selectedProductId,
                batchId: selectedBatchId,
                qty,
                reason,
            });
            toast.success("Barang rusak berhasil dicatat");
            goto("/purchase-returns");
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Gagal menyimpan");
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="max-w-2xl mx-auto space-y-6">
    <div class="flex items-center gap-4">
        <Button variant="outline" size="icon" href="/purchase-returns">
            <ArrowLeft class="h-4 w-4" />
        </Button>
        <h2 class="text-3xl font-bold tracking-tight">Catat Barang Rusak</h2>
    </div>

    <div class="space-y-4 border p-6 rounded-md bg-white">
        <!-- Product Selection -->
        <div class="space-y-2">
            <Label>Produk</Label>
            <Select type="single" bind:value={selectedProductId}>
                <SelectTrigger>
                    {#if selectedProductId && productsQuery.data}
                        {@const selectedProduct = productsQuery.data.find(
                            (p: any) => p.id === selectedProductId,
                        )}
                        {selectedProduct?.category?.name
                            ? `${selectedProduct.category.name} - ${selectedProduct.name}`
                            : selectedProduct?.name || "Pilih Produk"}
                    {:else}
                        Pilih Produk
                    {/if}
                </SelectTrigger>
                <SelectContent>
                    {#if productsQuery.data}
                        {#each productsQuery.data as product}
                            <SelectItem value={product.id}
                                >{product.category?.name
                                    ? `${product.category.name} - ${product.name}`
                                    : product.name}</SelectItem
                            >
                        {/each}
                    {/if}
                </SelectContent>
            </Select>
        </div>

        <!-- Batch Selection -->
        <div class="space-y-2">
            <Label>Pilih Batch / Varian Stok</Label>
            <Select
                type="single"
                bind:value={selectedBatchId}
                disabled={!selectedProductId}
            >
                <SelectTrigger>
                    {#if selectedBatchId && batchesQuery.data}
                        {@const b = batchesQuery.data.find(
                            (b: any) => b.id === selectedBatchId,
                        )}
                        {b
                            ? `${b.variant || "Original"} (Stok: ${b.currentStock}) - ${b.supplierName || "Unknown"}`
                            : "Pilih Batch"}
                    {:else}
                        Pilih Batch
                    {/if}
                </SelectTrigger>
                <SelectContent>
                    {#if batchesQuery.data}
                        {#each batchesQuery.data as batch}
                            <SelectItem value={batch.id}>
                                <div class="flex justify-between w-full gap-4">
                                    <span>{batch.variant || "Original"}</span>
                                    <span class="text-muted-foreground"
                                        >{batch.supplierName}</span
                                    >
                                    <span class="font-bold"
                                        >Stok: {batch.currentStock}</span
                                    >
                                </div>
                            </SelectItem>
                        {/each}
                    {/if}
                </SelectContent>
            </Select>
            {#if selectedBatch}
                <p class="text-sm text-muted-foreground">
                    Supplier: {selectedBatch.supplierName} | Stok Tersedia: {selectedBatch.currentStock}
                </p>
            {/if}
        </div>

        <!-- Qty Input -->
        <div class="space-y-2">
            <Label>Jumlah Rusak</Label>
            <Input
                type="number"
                min="1"
                max={selectedBatch?.currentStock || 9999}
                bind:value={qty}
            />
        </div>

        <!-- Reason Input -->
        <div class="space-y-2">
            <Label>Alasan Kerusakan / Keterangan</Label>
            <Input
                placeholder="Contoh: Pecah saat display, Expired, dll"
                bind:value={reason}
            />
        </div>

        <div class="pt-4">
            <Button
                class="w-full"
                onclick={handleSubmit}
                disabled={isSubmitting}
            >
                {#if isSubmitting}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                {:else}
                    Simpan ke Gudang Retur
                {/if}
            </Button>
        </div>
    </div>
</div>
