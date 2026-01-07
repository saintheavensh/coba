<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { SalesService } from "$lib/services/sales.service";
    import { formatCurrency } from "$lib/utils";
    import { Button } from "$lib/components/ui/button";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { Separator } from "$lib/components/ui/separator";
    import { Badge } from "$lib/components/ui/badge";
    import { ArrowLeft, Printer } from "lucide-svelte";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/components/ui/table";

    let sale: any = null;
    let loading = true;
    let error = "";

    onMount(async () => {
        const id = $page.params.id;
        if (!id) return;

        try {
            sale = await SalesService.getOne(id);
        } catch (e: any) {
            error = "Gagal memuat data penjualan.";
            console.error(e);
        } finally {
            loading = false;
        }
    });

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
</script>

<div class="space-y-6">
    <div class="flex items-center gap-4">
        <Button variant="outline" size="icon" href="/sales/history">
            <ArrowLeft class="h-4 w-4" />
        </Button>
        <h2 class="text-3xl font-bold tracking-tight">Detail Penjualan</h2>
    </div>

    {#if loading}
        <div class="py-10 text-center">Memuat data...</div>
    {:else if error}
        <div class="py-10 text-center text-red-500">{error}</div>
    {:else if sale}
        <div class="grid gap-6 md:grid-cols-2">
            <!-- Left: Items -->
            <Card class="md:col-span-2">
                <CardHeader>
                    <div class="flex justify-between items-center">
                        <CardTitle>Invoice #{sale.id}</CardTitle>
                        <Badge variant="outline" class="text-lg">
                            {sale.paymentStatus.toUpperCase()}
                        </Badge>
                    </div>
                    <p class="text-muted-foreground">
                        {formatDate(sale.createdAt)}
                    </p>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produk</TableHead>
                                <TableHead>Varian</TableHead>
                                <TableHead class="text-right">Qty</TableHead>
                                <TableHead class="text-right">Harga</TableHead>
                                <TableHead class="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each sale.items as item}
                                <TableRow>
                                    <TableCell class="font-medium">
                                        {item.product?.name ||
                                            "Unknown Product"}
                                    </TableCell>
                                    <TableCell>{item.variant}</TableCell>
                                    <TableCell class="text-right"
                                        >{item.qty}</TableCell
                                    >
                                    <TableCell class="text-right"
                                        >{formatCurrency(item.price)}</TableCell
                                    >
                                    <TableCell class="text-right font-bold">
                                        {formatCurrency(item.subtotal)}
                                    </TableCell>
                                </TableRow>
                            {/each}
                        </TableBody>
                    </Table>

                    <Separator class="my-4" />

                    <div class="flex flex-col gap-2 items-end text-sm">
                        <div class="flex justify-between w-full md:w-1/3">
                            <span class="text-muted-foreground">Subtotal:</span>
                            <span>{formatCurrency(sale.totalAmount)}</span>
                        </div>
                        {#if sale.discountAmount > 0}
                            <div
                                class="flex justify-between w-full md:w-1/3 text-red-500"
                            >
                                <span>Diskon:</span>
                                <span
                                    >- {formatCurrency(
                                        sale.discountAmount,
                                    )}</span
                                >
                            </div>
                        {/if}
                        <div
                            class="flex justify-between w-full md:w-1/3 font-bold text-lg"
                        >
                            <span>Total Tagihan:</span>
                            <span>{formatCurrency(sale.finalAmount)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Right: Info & Payment -->
            <Card>
                <CardHeader>
                    <CardTitle>Informasi Pelanggan</CardTitle>
                </CardHeader>
                <CardContent class="text-sm space-y-2">
                    <div class="flex justify-between border-b pb-2">
                        <span class="text-muted-foreground">Nama:</span>
                        <span class="font-medium"
                            >{sale.customerName || "Guest"}</span
                        >
                    </div>
                    {#if sale.member}
                        <div class="flex justify-between border-b pb-2">
                            <span class="text-muted-foreground">Telepon:</span>
                            <span>{sale.member.phone}</span>
                        </div>
                    {/if}
                    <div class="flex justify-between border-b pb-2">
                        <span class="text-muted-foreground">Kasir:</span>
                        <span>{sale.user?.name || sale.userId}</span>
                    </div>
                    {#if sale.notes}
                        <div class="pt-2">
                            <span class="text-muted-foreground block mb-1"
                                >Catatan:</span
                            >
                            <p class="bg-muted p-2 rounded text-xs">
                                {sale.notes}
                            </p>
                        </div>
                    {/if}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Rincian Pembayaran</CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                    {#each sale.payments as pay}
                        <div
                            class="flex justify-between items-center border-b pb-2 last:border-0 text-sm"
                        >
                            <div class="flex flex-col">
                                <span class="capitalize font-medium"
                                    >{pay.method}</span
                                >
                                {#if pay.method === "tempo"}
                                    <span class="text-[10px] text-red-500"
                                        >Hutang</span
                                    >
                                {/if}
                            </div>
                            <span class="font-mono"
                                >{formatCurrency(pay.amount)}</span
                            >
                        </div>
                    {/each}

                    <Button
                        class="w-full mt-4"
                        variant="secondary"
                        onclick={() => window.print()}
                    >
                        <Printer class="mr-2 h-4 w-4" /> Cetak Nota
                    </Button>
                </CardContent>
            </Card>
        </div>
    {/if}
</div>
