<script lang="ts">
    import { createQuery, useQueryClient } from "@tanstack/svelte-query";
    import { api } from "$lib/api";
    import { Button } from "$lib/components/ui/button";
    import { Plus, ArrowRight } from "lucide-svelte";
    import { Badge } from "$lib/components/ui/badge";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { toast } from "svelte-sonner";
    import { goto } from "$app/navigation";

    // Type Definitions
    interface DefectiveItem {
        id: string;
        createdAt: string;
        qty: number;
        reason: string;
        source: string;
        supplierId: string;
        product: { name: string };
        batch: { variant: string | null };
        supplier: { name: string };
    }

    const queryClient = useQueryClient();

    const query = createQuery<DefectiveItem[]>(() => ({
        queryKey: ["defective-items"],
        queryFn: async () => {
            const res = await api.get("/defective-items");
            return res.data.data;
        },
    }));

    let selectedIds: string[] = $state([]);

    function toggleSelect(id: string, checked: boolean) {
        if (checked) {
            selectedIds = [...selectedIds, id];
        } else {
            selectedIds = selectedIds.filter((i) => i !== id);
        }
    }

    async function handleCreateReturn() {
        if (selectedIds.length === 0) return;

        try {
            const userId = "USR-ADMIN";

            const res = await api.post("/defective-items/create-return", {
                userId,
                itemIds: selectedIds,
            });

            toast.success("Retur Pembelian berhasil dibuat!");
            await queryClient.invalidateQueries({
                queryKey: ["defective-items"],
            });
            selectedIds = [];
            goto(`/purchase-returns/${res.data.data.returnId}`);
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Gagal membuat retur");
        }
    }

    let hasMixedSuppliers = $derived.by(() => {
        if (!query.data || selectedIds.length === 0) return false;
        const selectedItems = query.data.filter((i) =>
            selectedIds.includes(i.id),
        );
        if (selectedItems.length === 0) return false;
        const firstSupplier = selectedItems[0].supplierId;
        return selectedItems.some((i) => i.supplierId !== firstSupplier);
    });
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <div class="space-y-1">
            <h3 class="text-xl font-semibold tracking-tight">Staging Area</h3>
            <p class="text-sm text-muted-foreground">
                Pilih barang rusak untuk dibuatkan dokumen Retur.
            </p>
        </div>
        <div class="flex gap-2">
            {#if selectedIds.length > 0}
                <div
                    class="flex items-center gap-2 mr-4 bg-muted px-4 py-2 rounded-md transition-all"
                >
                    <span class="text-sm font-medium"
                        >{selectedIds.length} Diplih</span
                    >
                    {#if hasMixedSuppliers}
                        <span class="text-xs text-red-500 font-bold"
                            >(Supplier Berbeda!)</span
                        >
                    {/if}
                    <Button
                        size="sm"
                        onclick={handleCreateReturn}
                        disabled={hasMixedSuppliers}
                    >
                        Proses Retur
                        <ArrowRight class="ml-2 h-4 w-4" />
                    </Button>
                </div>
            {/if}
            <Button href="/purchase-returns/add-defective">
                <Plus class="mr-2 h-4 w-4" />
                Tambah Manual
            </Button>
        </div>
    </div>

    {#if query.isLoading}
        <div class="p-8 text-center text-muted-foreground">
            Loading items...
        </div>
    {:else if query.isError}
        <div class="p-4 text-red-500 bg-red-50 rounded-md">
            Error: {query.error?.message}
        </div>
    {:else if query.data}
        <div class="border rounded-md">
            <table class="w-full text-sm">
                <thead>
                    <tr class="border-b bg-muted/50">
                        <th class="p-3 w-10"></th>
                        <th class="p-3 text-left">Tanggal</th>
                        <th class="p-3 text-left">Produk</th>
                        <th class="p-3 text-left">Batch/Varian</th>
                        <th class="p-3 text-left">Supplier</th>
                        <th class="p-3 text-right">Qty</th>
                        <th class="p-3 text-left">Alasan</th>
                        <th class="p-3 text-left">Sumber</th>
                    </tr>
                </thead>
                <tbody>
                    {#each query.data as item}
                        <tr class="border-b last:border-0 hover:bg-muted/50">
                            <td class="p-3">
                                <Checkbox
                                    checked={selectedIds.includes(item.id)}
                                    onCheckedChange={(c) =>
                                        toggleSelect(item.id, c as boolean)}
                                />
                            </td>
                            <td class="p-3">
                                {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                            <td class="p-3 font-medium">{item.product.name}</td>
                            <td class="p-3 text-muted-foreground"
                                >{item.batch.variant || "-"}</td
                            >
                            <td class="p-3">
                                <Badge variant="outline"
                                    >{item.supplier.name}</Badge
                                >
                            </td>
                            <td class="p-3 text-right font-bold">{item.qty}</td>
                            <td class="p-3 italic">{item.reason}</td>
                            <td class="p-3 capitalize"
                                >{item.source.replace("_", " ")}</td
                            >
                        </tr>
                    {/each}
                    {#if query.data.length === 0}
                        <tr>
                            <td
                                colspan="8"
                                class="p-12 text-center text-muted-foreground"
                            >
                                <div class="flex flex-col items-center gap-2">
                                    <span class="text-4xl">📦</span>
                                    <p>
                                        Tidak ada barang rusak di staging area.
                                    </p>
                                </div>
                            </td>
                        </tr>
                    {/if}
                </tbody>
            </table>
        </div>
    {/if}
</div>
