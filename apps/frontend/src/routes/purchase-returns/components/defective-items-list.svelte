<script lang="ts">
    import { createQuery, useQueryClient } from "@tanstack/svelte-query";
    import { api } from "$lib/api";
    import { Button } from "$lib/components/ui/button";
    import {
        Plus,
        ArrowRight,
        PackageX,
        RefreshCw,
        AlertCircle,
        Box,
    } from "lucide-svelte";
    import { Badge } from "$lib/components/ui/badge";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { toast } from "svelte-sonner";
    import { goto } from "$app/navigation";
    import { Card, CardContent } from "$lib/components/ui/card";
    import { fade, fly } from "svelte/transition";

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

<div class="space-y-6 p-6">
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-dashed"
    >
        <div class="space-y-1">
            <h3
                class="text-xl font-bold tracking-tight flex items-center gap-2 text-violet-700 dark:text-violet-400"
            >
                <Box class="h-5 w-5" /> Staging Area
            </h3>
            <p class="text-sm text-muted-foreground max-w-md">
                Barang rusak yang menunggu proses retur. Pilih item dari
                supplier yang sama untuk membuat dokumen retur.
            </p>
        </div>
        <div class="flex flex-wrap gap-3 w-full md:w-auto items-end">
            {#if selectedIds.length > 0}
                <div
                    in:fly={{ x: 20, duration: 300 }}
                    class="flex items-center gap-3 w-full md:w-auto bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 p-2 pl-4 rounded-xl shadow-sm"
                >
                    <div class="flex flex-col">
                        <span
                            class="text-xs font-semibold text-violet-600 dark:text-violet-300"
                        >
                            {selectedIds.length} Item Dipilih
                        </span>
                        {#if hasMixedSuppliers}
                            <span
                                class="text-[10px] text-red-500 font-bold flex items-center gap-1"
                            >
                                <AlertCircle class="h-3 w-3" /> Supplier Berbeda!
                            </span>
                        {:else}
                            <span class="text-[10px] text-muted-foreground"
                                >Siap diproses</span
                            >
                        {/if}
                    </div>

                    <Button
                        size="sm"
                        onclick={handleCreateReturn}
                        disabled={hasMixedSuppliers}
                        class="bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-sm"
                    >
                        Proses Retur
                        <ArrowRight class="ml-2 h-4 w-4" />
                    </Button>
                </div>
            {/if}
            <Button
                href="/purchase-returns/add-defective"
                variant="outline"
                class="hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-all rounded-lg"
            >
                <Plus class="mr-2 h-4 w-4" />
                Tambah Manual
            </Button>
        </div>
    </div>

    {#if query.isLoading}
        <div
            class="flex flex-col items-center justify-center py-12 space-y-4 text-muted-foreground animate-pulse"
        >
            <div class="h-12 w-12 bg-muted rounded-full"></div>
            <p>Memuat item...</p>
        </div>
    {:else if query.isError}
        <div
            class="p-4 text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl flex items-center gap-3"
        >
            <AlertCircle class="h-5 w-5" />
            <span>Error: {query.error?.message}</span>
        </div>
    {:else if query.data}
        <!-- Desktop Table View -->
        <div
            class="hidden md:block overflow-hidden rounded-xl border bg-background shadow-sm"
        >
            <table class="w-full text-sm">
                <thead>
                    <tr class="border-b bg-muted/40">
                        <th class="p-4 w-[50px]"></th>
                        <th
                            class="p-4 text-left font-semibold text-muted-foreground"
                            >Tanggal</th
                        >
                        <th
                            class="p-4 text-left font-semibold text-muted-foreground"
                            >Produk & Varian</th
                        >
                        <th
                            class="p-4 text-left font-semibold text-muted-foreground"
                            >Supplier</th
                        >
                        <th
                            class="p-4 text-left font-semibold text-muted-foreground"
                            >Isu / Alasan</th
                        >
                        <th
                            class="p-4 text-left font-semibold text-muted-foreground"
                            >Sumber</th
                        >
                        <th
                            class="p-4 text-right font-semibold text-muted-foreground"
                            >Qty</th
                        >
                    </tr>
                </thead>
                <tbody class="divide-y">
                    {#each query.data as item}
                        <tr
                            class="group hover:bg-violet-50/40 dark:hover:bg-violet-900/10 transition-colors {selectedIds.includes(
                                item.id,
                            )
                                ? 'bg-violet-50/60 dark:bg-violet-900/20'
                                : ''}"
                        >
                            <td class="p-4">
                                <Checkbox
                                    checked={selectedIds.includes(item.id)}
                                    onCheckedChange={(c: any) =>
                                        toggleSelect(item.id, c as boolean)}
                                    class="data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                                />
                            </td>
                            <td
                                class="p-4 whitespace-nowrap text-muted-foreground"
                            >
                                {new Date(item.createdAt).toLocaleDateString(
                                    "id-ID",
                                    {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    },
                                )}
                            </td>
                            <td class="p-4">
                                <div class="font-medium">
                                    {item.product.name}
                                </div>
                                <div
                                    class="text-xs text-muted-foreground font-mono bg-muted/50 inline-block px-1 rounded"
                                >
                                    {item.batch.variant || "No Variant"}
                                </div>
                            </td>
                            <td class="p-4">
                                <Badge
                                    variant="outline"
                                    class="font-normal bg-background/50"
                                >
                                    {item.supplier.name}
                                </Badge>
                            </td>
                            <td
                                class="p-4 italic text-muted-foreground max-w-[200px] truncate"
                                title={item.reason}
                            >
                                "{item.reason}"
                            </td>
                            <td class="p-4">
                                <Badge
                                    variant="secondary"
                                    class="font-normal text-xs capitalize"
                                >
                                    {item.source.replace("_", " ")}
                                </Badge>
                            </td>
                            <td class="p-4 text-right">
                                <span class="font-bold text-lg font-mono"
                                    >{item.qty}</span
                                >
                            </td>
                        </tr>
                    {/each}
                    {#if query.data.length === 0}
                        <tr>
                            <td
                                colspan="7"
                                class="py-20 text-center text-muted-foreground"
                            >
                                <div
                                    class="flex flex-col items-center gap-4 opacity-50"
                                >
                                    <div class="p-4 bg-muted rounded-full">
                                        <PackageX class="h-8 w-8" />
                                    </div>
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
                    class="py-16 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10"
                >
                    <div class="flex flex-col items-center gap-3 opacity-60">
                        <PackageX class="h-10 w-10" />
                        <p>Tidak ada barang rusak.</p>
                    </div>
                </div>
            {:else}
                {#each query.data as item (item.id)}
                    <div
                        class="bg-card rounded-xl border shadow-sm p-4 transition-all hover:border-violet-300 relative overflow-hidden active:scale-[0.99]"
                        role="button"
                        tabindex="0"
                        onclick={(e) => {
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
                        <!-- Selection Indicator -->
                        <div
                            class="absolute left-0 top-0 bottom-0 w-1.5 transition-colors {selectedIds.includes(
                                item.id,
                            )
                                ? 'bg-violet-600'
                                : 'bg-transparent'}"
                        ></div>

                        <div class="flex justify-between items-start mb-3 pl-3">
                            <div class="space-y-1 flex-1 mr-2">
                                <div class="font-bold line-clamp-2 text-sm">
                                    {item.product.name}
                                </div>
                                <div
                                    class="text-[10px] uppercase font-mono text-muted-foreground bg-muted/50 inline-block px-1.5 py-0.5 rounded"
                                >
                                    {item.batch.variant || "Default"}
                                </div>
                            </div>
                            <Checkbox
                                checked={selectedIds.includes(item.id)}
                                onCheckedChange={(c: any) =>
                                    toggleSelect(item.id, c as boolean)}
                                class="mt-1 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                            />
                        </div>

                        <div class="pl-3 space-y-3">
                            <div class="flex flex-wrap gap-2">
                                <Badge
                                    variant="outline"
                                    class="text-[10px] h-5 font-normal"
                                >
                                    {item.supplier.name}
                                </Badge>
                                <Badge
                                    variant="secondary"
                                    class="text-[10px] h-5 font-normal capitalize"
                                >
                                    {item.source.replace("_", " ")}
                                </Badge>
                            </div>

                            <div
                                class="text-sm bg-muted/30 p-2.5 rounded-lg border border-dashed text-muted-foreground italic"
                            >
                                "{item.reason}"
                            </div>

                            <div class="flex justify-between items-end pt-2">
                                <span class="text-xs text-muted-foreground">
                                    {new Date(
                                        item.createdAt,
                                    ).toLocaleDateString()}
                                </span>
                                <div class="flex items-baseline gap-1">
                                    <span class="text-xs text-muted-foreground"
                                        >Qty</span
                                    >
                                    <span
                                        class="font-bold text-xl text-violet-600"
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
