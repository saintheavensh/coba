<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { goto } from "$app/navigation";
    import {
        Plus,
        ShoppingCart,
        Calendar,
        User,
        ArrowRight,
        Search,
        Filter,
        MoreHorizontal,
        Eye,
        Pencil,
        Trash2,
    } from "lucide-svelte";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/components/ui/table";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { Badge } from "$lib/components/ui/badge";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { toast } from "svelte-sonner";

    let purchases: any[] = [];
    let loading = false;
    let search = "";
    let startDate = "";
    let endDate = "";

    async function load() {
        loading = true;
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);

            const res = await api(`/purchases?${params.toString()}`);
            purchases = res.data?.data || res.data || [];
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        load();
    });

    function handleSearch() {
        load();
    }

    async function handleDelete(id: string) {
        if (
            !confirm(
                "Apakah Anda yakin ingin menghapus data pembelian ini? Stok akan dikembalikan.",
            )
        )
            return;
        try {
            await api.delete(`/purchases/${id}`);
            toast.success("Pembelian berhasil dihapus");
            load();
        } catch (e) {
            console.error(e);
            toast.error("Gagal menghapus pembelian");
        }
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function formatRp(val: number) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(val);
    }
</script>

<div class="space-y-6">
    <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
        <div>
            <h2 class="text-3xl font-bold tracking-tight">Pembelian</h2>
            <p class="text-muted-foreground">
                Kelola stok masuk dan riwayat belanja dari supplier.
            </p>
        </div>
        <Button
            href="/purchases/new"
            class="shadow-lg hover:shadow-xl transition-all"
        >
            <Plus class="mr-2 h-4 w-4" /> Buat Pembelian Baru
        </Button>
    </div>

    <!-- Filters -->
    <Card>
        <CardContent class="p-4">
            <div class="flex flex-col md:flex-row gap-4 items-end">
                <div class="w-full md:w-1/3 space-y-2">
                    <span class="text-sm font-medium"
                        >Cari (Invoice / Supplier)</span
                    >
                    <div class="relative">
                        <Search
                            class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                        />
                        <Input
                            type="search"
                            placeholder="Cari..."
                            class="pl-8"
                            bind:value={search}
                            onkeydown={(e) =>
                                e.key === "Enter" && handleSearch()}
                        />
                    </div>
                </div>
                <div class="flex gap-2 w-full md:w-auto">
                    <div class="space-y-2">
                        <span class="text-sm font-medium">Dari Tanggal</span>
                        <Input type="date" bind:value={startDate} />
                    </div>
                    <div class="space-y-2">
                        <span class="text-sm font-medium">Sampai</span>
                        <Input type="date" bind:value={endDate} />
                    </div>
                </div>
                <Button variant="secondary" onclick={handleSearch}>
                    <Filter class="mr-2 h-4 w-4" /> Filter
                </Button>
            </div>
        </CardContent>
    </Card>

    <div class="rounded-md border bg-card">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>No. Invoice</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Input Oleh</TableHead>
                    <TableHead class="text-right">Total Nominal</TableHead>
                    <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#if loading}
                    <TableRow>
                        <TableCell colspan={7} class="text-center h-24"
                            >Memuat data...</TableCell
                        >
                    </TableRow>
                {:else if purchases.length === 0}
                    <TableRow>
                        <TableCell
                            colspan={7}
                            class="text-center h-48 text-muted-foreground"
                        >
                            Belum ada riwayat pembelian.
                        </TableCell>
                    </TableRow>
                {:else}
                    {#each purchases as po}
                        <TableRow>
                            <TableCell class="font-mono text-xs font-medium"
                                >{po.notes || po.id}</TableCell
                            >
                            <TableCell>
                                <div class="flex items-center gap-2 text-sm">
                                    <Calendar
                                        class="h-3 w-3 text-muted-foreground"
                                    />
                                    {formatDate(po.date)}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div class="font-medium">
                                    {po.supplier?.name || "Unknown"}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant="secondary"
                                    class="font-normal text-xs"
                                >
                                    {po.items?.length || 0} Item
                                </Badge>
                                <div
                                    class="text-xs text-muted-foreground mt-1 truncate max-w-[150px]"
                                >
                                    {#each po.items?.slice(0, 2) || [] as item, i}
                                        {i > 0 ? ", " : ""}{item.product?.name}
                                    {/each}
                                    {#if (po.items?.length || 0) > 2}...{/if}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div class="flex items-center gap-2">
                                    <User
                                        class="h-3 w-3 text-muted-foreground"
                                    />
                                    <span class="text-sm"
                                        >{po.user?.name ||
                                            po.user?.username ||
                                            "-"}</span
                                    >
                                </div>
                            </TableCell>
                            <TableCell class="text-right font-bold font-mono"
                                >{formatRp(po.totalAmount)}</TableCell
                            >
                            <TableCell class="text-right">
                                <DropdownMenu.Root>
                                    <DropdownMenu.Trigger
                                        class={buttonVariants({
                                            variant: "ghost",
                                            size: "icon",
                                        })}
                                    >
                                        <span class="sr-only">Open menu</span>
                                        <MoreHorizontal class="h-4 w-4" />
                                    </DropdownMenu.Trigger>
                                    <DropdownMenu.Content align="end">
                                        <DropdownMenu.Label
                                            >Aksi</DropdownMenu.Label
                                        >
                                        <DropdownMenu.Item
                                            onclick={() =>
                                                goto(`/purchases/${po.id}`)}
                                        >
                                            <Eye class="mr-2 h-4 w-4" /> Lihat Detail
                                        </DropdownMenu.Item>

                                        <DropdownMenu.Separator />
                                        <DropdownMenu.Item
                                            class="text-red-500 focus:text-red-500"
                                            onclick={() => handleDelete(po.id)}
                                        >
                                            <Trash2 class="mr-2 h-4 w-4" /> Hapus
                                        </DropdownMenu.Item>
                                    </DropdownMenu.Content>
                                </DropdownMenu.Root>
                            </TableCell>
                        </TableRow>
                    {/each}
                {/if}
            </TableBody>
        </Table>
    </div>
</div>
