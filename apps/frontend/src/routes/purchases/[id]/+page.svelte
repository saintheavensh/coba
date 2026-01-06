<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { api } from "$lib/api";
    import { Button } from "$lib/components/ui/button";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/components/ui/table";
    import { Badge } from "$lib/components/ui/badge";
    import { ArrowLeft, Trash2, Calendar, User, Truck } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import { goto } from "$app/navigation";

    let purchase: any = null;
    let loading = true;
    const id = $page.params.id;

    async function load() {
        try {
            const res = await api.get(`/purchases/${id}`);
            purchase = res.data?.data || res.data;
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat detail pembelian");
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        load();
    });

    async function handleDelete() {
        if (
            !confirm(
                "Apakah Anda yakin ingin menghapus data pembelian ini? Stok akan dikembalikan.",
            )
        )
            return;
        try {
            await api.delete(`/purchases/${id}`);
            toast.success("Pembelian berhasil dihapus");
            goto("/purchases");
        } catch (e) {
            console.error(e);
            toast.error("Gagal menghapus pembelian");
        }
    }

    function formatDate(dateStr: string) {
        if (!dateStr) return "-";
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

<div class="space-y-6 max-w-5xl mx-auto pb-12">
    <div class="flex items-center gap-4">
        <Button variant="outline" size="icon" href="/purchases">
            <ArrowLeft class="h-4 w-4" />
        </Button>
        <div>
            <h2 class="text-2xl font-bold tracking-tight">Detail Pembelian</h2>
            <p class="text-muted-foreground">ID: {id}</p>
        </div>
        <div class="ml-auto">
            <Button variant="destructive" onclick={handleDelete}>
                <Trash2 class="mr-2 h-4 w-4" /> Hapus Transaksi
            </Button>
        </div>
    </div>

    {#if loading}
        <div class="p-12 text-center text-muted-foreground">Memuat data...</div>
    {:else if !purchase}
        <div class="p-12 text-center text-red-500">Data tidak ditemukan</div>
    {:else}
        <div class="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle class="text-lg">Informasi Transaksi</CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <span class="text-muted-foreground">No. Invoice</span>
                        <span class="font-medium font-mono"
                            >{purchase.notes || "-"}</span
                        >

                        <span class="text-muted-foreground">Tanggal</span>
                        <div class="flex items-center gap-2">
                            <Calendar class="h-3 w-3" />
                            <span>{formatDate(purchase.date)}</span>
                        </div>

                        <span class="text-muted-foreground">Total Nominal</span>
                        <span class="font-bold text-primary"
                            >{formatRp(purchase.totalAmount)}</span
                        >

                        <span class="text-muted-foreground">Input Oleh</span>
                        <div class="flex items-center gap-2">
                            <User class="h-3 w-3" />
                            <span
                                >{purchase.user?.name ||
                                    purchase.user?.username ||
                                    "-"}</span
                            >
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle class="text-lg">Supplier</CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="flex items-center gap-4">
                        <div
                            class="h-10 w-10 rounded-full bg-muted flex items-center justify-center"
                        >
                            <Truck class="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <div class="font-bold">
                                {purchase.supplier?.name || "Unknown"}
                            </div>
                            <div class="text-sm text-muted-foreground">
                                {purchase.supplier?.contact || "-"}
                            </div>
                            <div class="text-xs text-muted-foreground">
                                {purchase.supplier?.address || "-"}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Item Barang</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produk</TableHead>
                            <TableHead>Varian</TableHead>
                            <TableHead class="text-right">Qty</TableHead>
                            <TableHead class="text-right">Harga Beli</TableHead>
                            <TableHead class="text-right">Harga Jual</TableHead>
                            <TableHead class="text-right">Subtotal</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {#each purchase.items as item}
                            <TableRow>
                                <TableCell>
                                    <div class="font-medium">
                                        {item.product?.name || "Unknown"}
                                    </div>
                                    <div class="text-xs text-muted-foreground">
                                        {item.product?.code || "-"}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {#if item.variant}
                                        <Badge variant="outline"
                                            >{item.variant}</Badge
                                        >
                                    {:else}
                                        <span class="text-muted-foreground"
                                            >-</span
                                        >
                                    {/if}
                                </TableCell>
                                <TableCell class="text-right"
                                    >{item.qtyReceived}</TableCell
                                >
                                <TableCell class="text-right"
                                    >{formatRp(item.buyPrice)}</TableCell
                                >
                                <TableCell class="text-right"
                                    >{formatRp(item.sellPrice)}</TableCell
                                >
                                <TableCell class="text-right font-medium"
                                    >{formatRp(
                                        item.buyPrice * item.qtyReceived,
                                    )}</TableCell
                                >
                            </TableRow>
                        {/each}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    {/if}
</div>
