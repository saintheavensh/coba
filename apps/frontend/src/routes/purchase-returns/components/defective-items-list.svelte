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
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
        <div class="space-y-1">
            <h3 class="text-xl font-semibold tracking-tight">Staging Area</h3>
            <p class="text-sm text-muted-foreground">
                Pilih barang rusak untuk dibuatkan dokumen Retur.
            </p>
        </div>
        <div class="flex flex-wrap gap-2 w-full md:w-auto">
            {#if selectedIds.length > 0}
                <div
                    class="flex items-center gap-2 w-full md:w-auto md:mr-4 bg-muted px-4 py-2 rounded-md transition-all justify-between md:justify-start"
                >
                    <div
                        class="flex flex-col md:flex-row md:items-center gap-1 md:gap-2"
                    >
                        <span class="text-sm font-medium"
                            >{selectedIds.length} Dipilih</span
                        >
                        {#if hasMixedSuppliers}
                            <span class="text-xs text-red-500 font-bold"
                                >(Beda Supplier!)</span
                            >
                        {/if}
                    </div>
                    <Button
                        size="sm"
                        onclick={handleCreateReturn}
                        disabled={hasMixedSuppliers}
                    >
                        Proses
                        <ArrowRight class="ml-2 h-4 w-4" />
                    </Button>
                </div>
            {/if}
            <Button
                href="/purchase-returns/add-defective"
                variant="outline"
                class="w-full md:w-auto"
            >
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
        <!-- Desktop Table View -->
        <div class="hidden md:block border rounded-md">
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
                                    onCheckedChange={(
                                        c: boolean | "indeterminate",
                                    ) => toggleSelect(item.id, c as boolean)}
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

        <!-- Mobile Card View -->
        <div class="md:hidden space-y-4">
            {#if query.data.length === 0}
                <div
                    class="p-8 text-center text-muted-foreground border rounded-lg bg-muted/20"
                >
                    <div class="flex flex-col items-center gap-2">
                        <span class="text-4xl">📦</span>
                        <p>Tidak ada barang rusak di staging area.</p>
                    </div>
                </div>
            {:else}
                {#each query.data as item (item.id)}
                    <div
                        class="bg-card rounded-lg border shadow-sm p-4 transition-all hover:shadow-md relative overflow-hidden"
                        role="button"
                        tabindex="0"
                        onclick={(e) => {
                            // Prevent toggling if hitting buttons/links directly,
                            // but generally card click toggles select is good UX here
                            const target = e.target as HTMLElement;
                            if (target.closest("button") || target.closest("a"))
                                return;
                            toggleSelect(
                                item.id,
                                !selectedIds.includes(item.id),
                            );
                        }}
                        onkeydown={(e) =>
                            e.key === "Enter" &&
                            toggleSelect(
                                item.id,
                                !selectedIds.includes(item.id),
                            )}
                    >
                        <!-- Selection Indicator Strip -->
                        {#if selectedIds.includes(item.id)}
                            <div
                                class="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                            ></div>
                        {/if}

                        <div class="flex justify-between items-start mb-2 pl-2">
                            <div class="space-y-0.5">
                                <div class="font-bold line-clamp-2">
                                    {item.product.name}
                                </div>
                                <div class="text-xs text-muted-foreground">
                                    {item.batch.variant || "No Variant"}
                                </div>
                            </div>
                            <Checkbox
                                checked={selectedIds.includes(item.id)}
                                onCheckedChange={(
                                    c: boolean | "indeterminate",
                                ) => toggleSelect(item.id, c as boolean)}
                                class="mt-1"
                            />
                        </div>

                        <div class="pl-2 space-y-3">
                            <div
                                class="flex justify-between items-center text-xs"
                            >
                                <Badge
                                    variant="outline"
                                    class="max-w-[150px] truncate"
                                >
                                    {item.supplier.name}
                                </Badge>
                                <span class="text-muted-foreground capitalize">
                                    {item.source.replace("_", " ")}
                                </span>
                            </div>

                            <div
                                class="flex items-start gap-2 text-sm bg-muted/30 p-2 rounded"
                            >
                                <span class="font-medium shrink-0">Alasan:</span
                                >
                                <span class="italic text-muted-foreground"
                                    >{item.reason}</span
                                >
                            </div>

                            <div
                                class="flex justify-between items-end border-t pt-2 mt-2"
                            >
                                <span class="text-xs text-muted-foreground">
                                    {new Date(
                                        item.createdAt,
                                    ).toLocaleDateString()}
                                </span>
                                <div class="text-right">
                                    <span
                                        class="text-xs text-muted-foreground block"
                                        >Qty</span
                                    >
                                    <span class="font-bold text-lg"
                                        >{item.qty}</span
                                    >
                                </div>
                            </div>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>
    {/if}
</div>
