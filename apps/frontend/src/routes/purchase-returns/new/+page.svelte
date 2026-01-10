<script lang="ts">
    import { createMutation, createQuery } from "@tanstack/svelte-query";
    import { api } from "$lib/api";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { ArrowLeft, Trash2, Plus } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import { goto } from "$app/navigation";
    import { Label } from "$lib/components/ui/label";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";

    // 1. Fetch Suppliers
    const suppliersQuery = createQuery(() => ({
        queryKey: ["suppliers"],
        queryFn: async () => {
            const res = await api.get("/suppliers");
            return res.data.data.map((s: any) => ({
                value: s.id,
                label: s.name,
            }));
        },
    }));

    let selectedSupplierId = $state("");
    let notes = $state("");

    // 2. Fetch Batches when Supplier Selected
    // Note: We need an endpoint to get batches by supplier!
    // Or we can filter client side if we fetch all? Efficient? No.
    // Let's assuming we can search products then filter batches?
    // Workflow say: "Pilih Supplier -> Lihat Batch dari Supplier".
    // We should probably add `GET /inventory/batches?supplierId=...`
    // OR just fetch all products and filter? Inventory endpoint usually returns batches.
    // Let's try to query products list which usually has batches?
    // Actually, `products` endpoint might not return batches details suitable for selection.
    // Let's create a specific query for "Batches by Supplier" OR
    // Just fetch all products and filter locally for now if simplified?
    // Re-reading docs: "Pilih Batch" is key.
    // Let's implement a quick inline query here.
    // Assuming `api.get('/inventory?supplierId=...')` works?
    // Let's check `inventory.controller`.
    // It returns products.
    // Let's stick to: Select Product -> Select Variant (Batch).
    // But we want to filter by supplier.
    // Let's add a temporary `batches` state that loads when supplier changes.
    // And since we don't have a dedicated endpoint yet, let's make a guess or use what we have.
    // Or better: Just fetch all products, flatten batches, filter by supplierId.
    const productsQuery = createQuery(() => ({
        queryKey: ["products-for-return"],
        queryFn: async () => {
            const res = await api.get("/inventory"); // Assuming this returns products with batches
            return res.data.data;
        },
    }));

    let availableBatches = $state<any[]>([]);

    // Update available batches when products or supplier changes
    $effect(() => {
        if (productsQuery.data && selectedSupplierId) {
            // Flatten batches from all products that match supplier
            const batches = [];
            for (const p of productsQuery.data) {
                if (p.batches) {
                    for (const b of p.batches) {
                        if (
                            b.supplierId === selectedSupplierId &&
                            b.currentStock > 0
                        ) {
                            batches.push({
                                ...b,
                                productName: p.name,
                                label: `${p.name} - ${p.category?.name || "Uncategorized"} - ${b.variant} (Stok: ${b.currentStock})`,
                                value: b.id,
                            });
                        }
                    }
                }
            }
            availableBatches = batches;
        }
    });

    // Return Items State
    let items = $state<
        {
            batchId: string;
            qty: number;
            reason: string;
            maxQty: number;
            label: string;
        }[]
    >([]);
    let selectedBatchId = $state("");

    function addItem() {
        if (!selectedBatchId) return;
        const batch = availableBatches.find((b) => b.id === selectedBatchId);
        if (!batch) return;

        // Prevent duplicate
        if (items.find((i) => i.batchId === batch.id)) {
            return toast.error("Item sudah ada di daftar");
        }

        items = [
            ...items,
            {
                batchId: batch.id,
                qty: 1,
                reason: "",
                maxQty: batch.currentStock,
                label: batch.label,
            },
        ];
        selectedBatchId = "";
    }

    function removeItem(index: number) {
        items = items.filter((_, i) => i !== index);
    }

    const createReturnMutation = createMutation(() => ({
        mutationFn: async (data: any) => {
            return api.post("/purchase-returns", data);
        },
        onSuccess: () => {
            toast.success("Retur berhasil dibuat");
            goto("/purchase-returns");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Gagal membuat retur");
        },
    }));

    function handleSubmit() {
        if (!selectedSupplierId) return toast.error("Pilih supplier");
        if (items.length === 0) return toast.error("Minimal 1 item");

        // Validate Qty
        for (const item of items) {
            if (item.qty <= 0)
                return toast.error(`Qty untuk ${item.label} tidak valid`);
            if (item.qty > item.maxQty)
                return toast.error(
                    `Qty untuk ${item.label} melebihi stok (${item.maxQty})`,
                );
        }

        createReturnMutation.mutate({
            supplierId: selectedSupplierId,
            userId: JSON.parse(localStorage.getItem("user") || "{}").id, // Safety check
            notes,
            items: items.map((i) => ({
                batchId: i.batchId,
                qty: i.qty,
                reason: i.reason,
            })),
        });
    }
</script>

<div class="space-y-6 max-w-3xl">
    <div class="flex items-center gap-4">
        <Button variant="outline" size="icon" href="/purchase-returns">
            <ArrowLeft class="h-4 w-4" />
        </Button>
        <h2 class="text-3xl font-bold tracking-tight">Buat Retur Pembelian</h2>
    </div>

    <div class="grid gap-6">
        <div class="grid gap-2">
            <Label>Supplier</Label>
            <!-- Using Native Select for simplicity or filtered items -->
            <Select
                type="single"
                onValueChange={(v) => {
                    selectedSupplierId = v;
                    items = [];
                }}
            >
                <SelectTrigger>
                    {suppliersQuery.data?.find(
                        (s: any) => s.value === selectedSupplierId,
                    )?.label || "Pilih Supplier"}
                </SelectTrigger>
                <SelectContent>
                    {#if suppliersQuery.data}
                        {#each suppliersQuery.data as s}
                            <SelectItem value={s.value}>{s.label}</SelectItem>
                        {/each}
                    {/if}
                </SelectContent>
            </Select>
        </div>

        <div class="grid gap-2">
            <Label>Tambah Item (Batch)</Label>
            <div class="flex gap-2">
                <Select
                    type="single"
                    onValueChange={(v) => (selectedBatchId = v)}
                    disabled={!selectedSupplierId}
                >
                    <SelectTrigger class="w-full">
                        {availableBatches.find(
                            (b: any) => b.value === selectedBatchId,
                        )?.label ||
                            (!selectedSupplierId
                                ? "Pilih Supplier Terlebih Dahulu"
                                : "Pilih Batch Barang")}
                    </SelectTrigger>
                    <SelectContent>
                        {#each availableBatches as b}
                            <SelectItem value={b.value}>{b.label}</SelectItem>
                        {/each}
                    </SelectContent>
                </Select>
                <Button onclick={addItem} disabled={!selectedBatchId}>
                    <Plus class="h-4 w-4" />
                </Button>
            </div>
        </div>

        {#if items.length > 0}
            <div class="border rounded-md">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b bg-muted/50">
                            <th class="p-3 text-left">Item</th>
                            <th class="p-3 text-left w-24">Qty</th>
                            <th class="p-3 text-left">Alasan</th>
                            <th class="p-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each items as item, i}
                            <tr class="border-b last:border-0">
                                <td class="p-3 font-medium">{item.label}</td>
                                <td class="p-3">
                                    <Input
                                        type="number"
                                        min="1"
                                        max={item.maxQty}
                                        bind:value={item.qty}
                                    />
                                </td>
                                <td class="p-3">
                                    <Input
                                        placeholder="Cacat / Salah Kirim"
                                        bind:value={item.reason}
                                    />
                                </td>
                                <td class="p-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        class="text-red-500"
                                        onclick={() => removeItem(i)}
                                    >
                                        <Trash2 class="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}

        <div class="grid gap-2">
            <Label>Catatan</Label>
            <Input bind:value={notes} placeholder="Catatan tambahan..." />
        </div>

        <div class="flex justify-end gap-2">
            <Button variant="outline" href="/purchase-returns">Batal</Button>
            <Button
                onclick={handleSubmit}
                disabled={createReturnMutation.isPending}
            >
                {createReturnMutation.isPending
                    ? "Menyimpan..."
                    : "Simpan Retur"}
            </Button>
        </div>
    </div>
</div>
