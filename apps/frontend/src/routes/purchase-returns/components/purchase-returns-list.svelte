<script lang="ts">
    import { createQuery } from "@tanstack/svelte-query";
    import { api } from "$lib/api";
    import { Button } from "$lib/components/ui/button";
    import { Search, Eye } from "lucide-svelte";
    import { Input } from "$lib/components/ui/input";
    import { formatCurrency } from "$lib/utils";

    const query = createQuery(() => ({
        queryKey: ["purchase-returns"],
        queryFn: async () => {
            const res = await api.get("/purchase-returns");
            return res.data.data;
        },
    }));

    let searchQuery = $state("");
    let filtered = $derived(
        (query.data || []).filter(
            (item: any) =>
                item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.supplier.name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
        ),
    );
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <div class="space-y-1">
            <h3 class="text-xl font-semibold tracking-tight">Riwayat Retur</h3>
            <p class="text-sm text-muted-foreground">
                Dokumen pengembalian yang telah diproses.
            </p>
        </div>
        <div class="flex items-center">
            <div class="relative w-full max-w-sm">
                <Search
                    class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
                />
                <Input
                    placeholder="Cari ID atau Supplier..."
                    bind:value={searchQuery}
                    class="pl-8"
                />
            </div>
        </div>
    </div>

    <div class="rounded-md border">
        <div class="relative w-full overflow-auto">
            <table class="w-full caption-bottom text-sm">
                <thead class="[&_tr]:border-b">
                    <tr
                        class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                            >ID Retur</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                            >Tanggal</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                            >Supplier</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                            >Items</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                            >Catatan</th
                        >
                        <th
                            class="h-12 px-4 text-right align-middle font-medium text-muted-foreground w-[50px]"
                        ></th>
                    </tr>
                </thead>
                <tbody class="[&_tr:last-child]:border-0">
                    {#if query.isLoading}
                        <tr
                            ><td colspan="6" class="p-8 text-center"
                                >Loading...</td
                            ></tr
                        >
                    {:else if filtered.length === 0}
                        <tr
                            ><td
                                colspan="6"
                                class="p-8 text-center text-muted-foreground"
                                >Tidak ada data retur.</td
                            ></tr
                        >
                    {:else}
                        {#each filtered as ret}
                            <tr
                                class="border-b transition-colors hover:bg-muted/50"
                            >
                                <td class="p-4 font-medium">
                                    <a
                                        href="/purchase-returns/{ret.id}"
                                        class="hover:underline font-semibold text-primary"
                                    >
                                        {ret.id}
                                    </a>
                                </td>
                                <td class="p-4"
                                    >{new Date(
                                        ret.date,
                                    ).toLocaleDateString()}</td
                                >
                                <td class="p-4">{ret.supplier.name}</td>
                                <td class="p-4">
                                    <ul
                                        class="list-disc list-inside text-xs text-muted-foreground"
                                    >
                                        {#each ret.items as item}
                                            <li>
                                                {item.product.name} ({item.batch
                                                    .variant}) x{item.qty}
                                            </li>
                                        {/each}
                                    </ul>
                                </td>
                                <td class="p-4 text-muted-foreground"
                                    >{ret.notes || "-"}</td
                                >
                                <td class="p-4 text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        href="/purchase-returns/{ret.id}"
                                        title="Lihat Detail"
                                    >
                                        <Eye class="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        {/each}
                    {/if}
                </tbody>
            </table>
        </div>
    </div>
</div>
