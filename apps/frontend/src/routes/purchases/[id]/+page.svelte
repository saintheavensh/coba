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
    import { Separator } from "$lib/components/ui/separator";
    import {
        ArrowLeft,
        Trash2,
        Calendar,
        User,
        Truck,
        FileText,
        MapPin,
        Phone,
        Package,
        Printer,
        TrendingUp,
        AlertCircle,
    } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import { goto } from "$app/navigation";
    import { fade } from "svelte/transition";

    let purchase: any = null;
    let loading = true;
    let error = "";
    const id = $page.params.id;

    async function load() {
        try {
            const res = await api.get(`/purchases/${id}`);
            purchase = res.data?.data || res.data;
        } catch (e: any) {
            console.error(e);
            error = "Gagal memuat detail pembelian";
            toast.error(error);
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
                "Apakah Anda yakin ingin menghapus data pembelian ini? Stok akan dikembalikan dan tidak dapat dibatalkan.",
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
            minimumFractionDigits: 0,
        }).format(val);
    }
</script>

<div class="min-h-screen space-y-8 p-6 pb-20">
    <!-- Header with Gradient -->
    <div
        class="relative bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl p-8 text-white overflow-hidden shadow-2xl print:hidden"
    >
        <div
            class="absolute inset-0 bg-white/10 opacity-20 pattern-dots pointer-events-none"
        ></div>
        <div
            class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
            <div>
                <Button
                    href="/purchases"
                    variant="ghost"
                    size="sm"
                    class="text-white/80 hover:text-white hover:bg-white/10 p-0 h-auto mb-2 font-normal"
                >
                    <ArrowLeft class="mr-1 h-4 w-4" /> Kembali ke Riwayat
                </Button>
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <FileText class="h-6 w-6 text-white" />
                    </div>
                    <h1
                        class="text-3xl font-bold tracking-tight text-white flex items-center gap-3"
                    >
                        Detail Pembelian
                        <span
                            class="text-base font-normal bg-white/20 px-3 py-1 rounded-full font-mono"
                        >
                            #{purchase?.notes || id}
                        </span>
                    </h1>
                </div>
            </div>

            <div class="flex gap-3">
                <Button
                    variant="secondary"
                    size="sm"
                    onclick={() => window.print()}
                    class="bg-white/20 text-white hover:bg-white/30 border-0 shadow-sm backdrop-blur-sm"
                >
                    <Printer class="mr-2 h-4 w-4" /> Cetak
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    onclick={handleDelete}
                    class="bg-red-500 hover:bg-red-600 shadow-lg"
                >
                    <Trash2 class="mr-2 h-4 w-4" /> Hapus Transaksi
                </Button>
            </div>
        </div>
    </div>

    <!-- Print Header Only -->
    <div class="hidden print:block mb-8">
        <h1 class="text-2xl font-bold">Detail Pembelian</h1>
        <p class="text-muted-foreground">ID: {purchase?.notes || id}</p>
    </div>

    {#if loading}
        <div class="grid gap-6 md:grid-cols-3">
            <div class="md:col-span-2 space-y-6">
                <div
                    class="h-[400px] w-full bg-card/50 animate-pulse rounded-xl"
                ></div>
            </div>
            <div
                class="h-[300px] w-full bg-card/50 animate-pulse rounded-xl"
            ></div>
        </div>
    {:else if error || !purchase}
        <div
            class="flex flex-col items-center justify-center p-12 text-center bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20"
        >
            <AlertCircle class="h-10 w-10 text-red-500 mb-4" />
            <h3 class="text-lg font-bold text-red-700 dark:text-red-400">
                Data Tidak Ditemukan
            </h3>
            <p class="text-red-600/80 dark:text-red-400/80">
                Transaksi mungkin telah dihapus.
            </p>
            <Button variant="outline" href="/purchases" class="mt-4"
                >Kembali</Button
            >
        </div>
    {:else}
        <div in:fade={{ duration: 400 }} class="grid gap-6 md:grid-cols-3">
            <!-- Left Column: Details -->
            <div class="md:col-span-2 space-y-6">
                <!-- Items Table -->
                <Card
                    class="bg-card/80 backdrop-blur-sm border-t-4 border-t-violet-500 shadow-md"
                >
                    <CardHeader
                        class="flex flex-row items-center justify-between bg-muted/20 pb-4"
                    >
                        <div class="flex items-center gap-2">
                            <Package class="h-5 w-5 text-violet-600" />
                            <CardTitle class="text-lg"
                                >Daftar Barang Masuk</CardTitle
                            >
                        </div>
                        <Badge variant="outline" class="font-normal"
                            >{purchase.items.length} Items</Badge
                        >
                    </CardHeader>
                    <CardContent class="p-0">
                        <Table>
                            <TableHeader class="bg-muted/30">
                                <TableRow class="hover:bg-transparent">
                                    <TableHead class="pl-6 w-[35%]"
                                        >Produk</TableHead
                                    >
                                    <TableHead class="text-center w-[15%]"
                                        >Varian</TableHead
                                    >
                                    <TableHead class="text-right w-[10%]"
                                        >Qty</TableHead
                                    >
                                    <TableHead class="text-right w-[20%]"
                                        >Harga Beli</TableHead
                                    >
                                    <TableHead class="text-right pr-6 w-[20%]"
                                        >Subtotal</TableHead
                                    >
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {#each purchase.items as item}
                                    <TableRow
                                        class="hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-colors"
                                    >
                                        <TableCell class="pl-6">
                                            <div
                                                class="font-medium text-foreground"
                                            >
                                                {item.product?.name ||
                                                    "Unknown"}
                                            </div>
                                            {#if item.product?.code}
                                                <div
                                                    class="text-[10px] text-muted-foreground font-mono"
                                                >
                                                    SKU: {item.product.code}
                                                </div>
                                            {/if}
                                        </TableCell>
                                        <TableCell class="text-center">
                                            {#if item.variant}
                                                <Badge
                                                    variant="secondary"
                                                    class="font-normal text-xs"
                                                    >{item.variant}</Badge
                                                >
                                            {:else}
                                                <span
                                                    class="text-muted-foreground text-sm"
                                                    >-</span
                                                >
                                            {/if}
                                        </TableCell>
                                        <TableCell
                                            class="text-right font-mono font-medium"
                                        >
                                            {item.qtyReceived}
                                        </TableCell>
                                        <TableCell
                                            class="text-right font-mono text-muted-foreground"
                                        >
                                            {formatRp(item.buyPrice)}
                                        </TableCell>
                                        <TableCell
                                            class="text-right pr-6 font-bold font-mono"
                                        >
                                            {formatRp(
                                                item.buyPrice *
                                                    item.qtyReceived,
                                            )}
                                        </TableCell>
                                    </TableRow>
                                {/each}
                            </TableBody>
                        </Table>

                        <!-- Summary Section -->
                        <div
                            class="p-6 bg-muted/10 border-t flex flex-col items-end gap-3"
                        >
                            <div
                                class="w-full md:w-1/2 flex justify-between items-center text-sm text-muted-foreground"
                            >
                                <span>Total Item</span>
                                <span
                                    >{purchase.items.reduce(
                                        (a: number, b: any) =>
                                            a + b.qtyReceived,
                                        0,
                                    )} Pcs</span
                                >
                            </div>
                            <Separator class="w-full md:w-1/2" />
                            <div
                                class="w-full md:w-1/2 flex justify-between items-center"
                            >
                                <span class="font-semibold text-lg"
                                    >Total Pembelian</span
                                >
                                <span
                                    class="font-bold text-xl text-violet-600 font-mono"
                                    >{formatRp(purchase.totalAmount)}</span
                                >
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <!-- Right Column: Info Cards -->
            <div class="space-y-6">
                <!-- Info Card -->
                <Card
                    class="bg-card/80 backdrop-blur-sm border-violet-100 dark:border-violet-900/30"
                >
                    <CardHeader
                        class="pb-3 bg-violet-50/50 dark:bg-violet-900/10"
                    >
                        <CardTitle
                            class="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-violet-700 dark:text-violet-400"
                        >
                            <FileText class="h-4 w-4" /> Informasi Transaksi
                        </CardTitle>
                    </CardHeader>
                    <CardContent class="grid gap-4 p-5">
                        <div class="grid grid-cols-2 gap-y-4 text-sm">
                            <div class="space-y-1">
                                <span
                                    class="text-xs text-muted-foreground block"
                                    >No. Invoice</span
                                >
                                <span
                                    class="font-medium font-mono bg-muted/50 px-2 py-1 rounded"
                                    >{purchase.notes || "-"}</span
                                >
                            </div>

                            <div class="space-y-1">
                                <span
                                    class="text-xs text-muted-foreground block"
                                    >Input Oleh</span
                                >
                                <div class="flex items-center gap-1.5">
                                    <div
                                        class="h-5 w-5 rounded-full bg-violet-100 flex items-center justify-center text-[10px] text-violet-600 font-bold"
                                    >
                                        {(purchase.user?.name || "U")[0]}
                                    </div>
                                    <span class="font-medium"
                                        >{purchase.user?.name ||
                                            purchase.user?.username ||
                                            "-"}</span
                                    >
                                </div>
                            </div>

                            <div class="col-span-2 space-y-1">
                                <span
                                    class="text-xs text-muted-foreground block"
                                    >Waktu Transaksi</span
                                >
                                <div
                                    class="flex items-center gap-2 font-medium"
                                >
                                    <Calendar
                                        class="h-4 w-4 text-muted-foreground"
                                    />
                                    <span>{formatDate(purchase.date)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <!-- Supplier Card -->
                <Card
                    class="bg-card/80 backdrop-blur-sm border-fuchsia-100 dark:border-fuchsia-900/30"
                >
                    <CardHeader
                        class="pb-3 bg-fuchsia-50/50 dark:bg-fuchsia-900/10"
                    >
                        <CardTitle
                            class="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-400"
                        >
                            <Truck class="h-4 w-4" /> Supplier
                        </CardTitle>
                    </CardHeader>
                    <CardContent class="p-5">
                        <div class="flex items-center gap-4 mb-4">
                            <div
                                class="h-12 w-12 rounded-full bg-fuchsia-100 flex items-center justify-center text-fuchsia-600 font-bold text-lg shadow-sm"
                            >
                                {(purchase.supplier?.name || "S")[0]}
                            </div>
                            <div>
                                <div class="font-bold text-lg">
                                    {purchase.supplier?.name || "Unknown"}
                                </div>
                                <div
                                    class="text-xs text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded inline-block"
                                >
                                    {purchase.supplier?.code || "-"}
                                </div>
                            </div>
                        </div>

                        <div class="space-y-3 text-sm border-t pt-4">
                            <div class="flex items-start gap-3">
                                <Phone
                                    class="h-4 w-4 text-muted-foreground mt-0.5"
                                />
                                <span class="text-foreground/80"
                                    >{purchase.supplier?.contact ||
                                        purchase.supplier?.phone ||
                                        "-"}</span
                                >
                            </div>
                            <div class="flex items-start gap-3">
                                <MapPin
                                    class="h-4 w-4 text-muted-foreground mt-0.5"
                                />
                                <span class="text-foreground/80 leading-relaxed"
                                    >{purchase.supplier?.address || "-"}</span
                                >
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    {/if}
</div>

<style>
    @media print {
        :global(body) {
            background: white !important;
            color: black !important;
        }
        :global(header),
        :global(nav),
        :global(aside) {
            display: none !important;
        }
        .print\:hidden {
            display: none !important;
        }
    }
</style>
