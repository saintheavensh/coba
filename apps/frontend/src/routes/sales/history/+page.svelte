<script lang="ts">
    import { SalesService } from "$lib/services/sales.service";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/components/ui/table";
    import { Badge } from "$lib/components/ui/badge";
    import { Card, CardContent } from "$lib/components/ui/card";
    import { Search, Calendar, Filter, Eye, RefreshCw } from "lucide-svelte";
    import { formatCurrency } from "$lib/utils";
    import { createQuery } from "@tanstack/svelte-query";

    // Reactive filter state
    let search = $state("");
    let startDate = $state("");
    let endDate = $state("");

    // Build query params reactively
    let queryParams = $derived(() => {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return params;
    });

    // TanStack Query with reactive params
    const salesQuery = createQuery(() => ({
        queryKey: ["sales", "history", search, startDate, endDate],
        queryFn: () => SalesService.getAll(queryParams()),
    }));

    // Derived state from query
    let sales = $derived(salesQuery.data || []);
    let loading = $derived(salesQuery.isPending);

    function handleSearch() {
        salesQuery.refetch();
    }

    function formatDate(dateStr: string | Date | null | undefined) {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function getPaymentStatusColor(status: string) {
        switch (status) {
            case "paid":
                return "bg-green-100 text-green-800 border-green-200";
            case "partial":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "unpaid":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-gray-100 text-gray-800";
        }
    }
</script>

<div class="space-y-6">
    <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
        <div>
            <h2 class="text-3xl font-bold tracking-tight">Riwayat Penjualan</h2>
            <p class="text-muted-foreground">
                Daftar transaksi penjualan dan status pembayaran.
            </p>
        </div>
    </div>

    <!-- Filters -->
    <Card>
        <CardContent class="p-4">
            <div class="flex flex-col md:flex-row gap-4 items-end">
                <div class="w-full md:w-1/3 space-y-2">
                    <span class="text-sm font-medium"
                        >Cari Invoice / Pelanggan</span
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
                <div class="grid grid-cols-2 md:flex gap-2 w-full md:w-auto">
                    <div class="space-y-2">
                        <span class="text-sm font-medium">Dari</span>
                        <Input type="date" bind:value={startDate} />
                    </div>
                    <div class="space-y-2">
                        <span class="text-sm font-medium">Sampai</span>
                        <Input type="date" bind:value={endDate} />
                    </div>
                </div>
                <Button
                    variant="secondary"
                    onclick={handleSearch}
                    class="w-full md:w-auto"
                >
                    <Filter class="mr-2 h-4 w-4" /> Filter
                </Button>
            </div>
        </CardContent>
    </Card>

    <!-- Desktop Table View -->
    <div class="hidden md:block rounded-md border bg-card">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Tipe Bayar</TableHead>
                    <TableHead class="text-right">Total</TableHead>
                    <TableHead class="text-center">Status</TableHead>
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
                {:else if sales.length === 0}
                    <TableRow>
                        <TableCell
                            colspan={7}
                            class="text-center h-48 text-muted-foreground"
                        >
                            Belum ada riwayat penjualan.
                        </TableCell>
                    </TableRow>
                {:else}
                    {#each sales as sale}
                        <TableRow>
                            <TableCell class="font-mono font-medium">
                                <a
                                    href="/sales/history/{sale.id}"
                                    class="hover:underline text-blue-600"
                                >
                                    {sale.id}
                                </a>
                            </TableCell>
                            <TableCell>
                                <div class="flex items-center gap-2 text-sm">
                                    <Calendar
                                        class="h-4 w-4 text-foreground/80"
                                    />
                                    {formatDate(sale.createdAt)}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div class="font-medium">
                                    {sale.customerName || "Guest"}
                                </div>
                                <div class="text-xs text-muted-foreground">
                                    {sale.member?.phone || "-"}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" class="capitalize">
                                    {sale.paymentMethod === "mixed"
                                        ? "Split"
                                        : sale.paymentMethod}
                                </Badge>
                            </TableCell>
                            <TableCell class="text-right font-bold">
                                {formatCurrency(sale.finalAmount)}
                            </TableCell>
                            <TableCell class="text-center">
                                <Badge
                                    variant="outline"
                                    class={getPaymentStatusColor(
                                        sale.paymentStatus,
                                    )}
                                >
                                    {(sale.paymentStatus === "paid"
                                        ? "Lunas"
                                        : sale.paymentStatus
                                    ).toUpperCase()}
                                </Badge>
                            </TableCell>
                            <TableCell class="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    href="/sales/history/{sale.id}"
                                >
                                    <Eye class="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    {/each}
                {/if}
            </TableBody>
        </Table>
    </div>

    <!-- Mobile Card View -->
    <div class="md:hidden space-y-4">
        {#if loading}
            <div class="p-8 text-center text-muted-foreground">
                Memuat data...
            </div>
        {:else if sales.length === 0}
            <div class="p-8 text-center border rounded-lg bg-muted/20">
                <p class="text-muted-foreground">
                    Belum ada riwayat penjualan.
                </p>
            </div>
        {:else}
            {#each sales as sale (sale.id)}
                <div
                    class="bg-card rounded-lg border shadow-sm p-4 hover:shadow-md transition-all"
                >
                    <div class="flex justify-between items-start mb-3">
                        <div class="font-mono font-bold text-blue-600">
                            #{sale.id}
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            <Badge
                                variant="outline"
                                class={getPaymentStatusColor(
                                    sale.paymentStatus,
                                )}
                            >
                                {(sale.paymentStatus === "paid"
                                    ? "Lunas"
                                    : sale.paymentStatus
                                ).toUpperCase()}
                            </Badge>
                            <div
                                class="flex items-center gap-1.5 text-xs font-medium text-foreground/80"
                            >
                                <Calendar class="h-3.5 w-3.5 text-primary" />
                                {formatDate(sale.createdAt)}
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-between items-center mb-3">
                        <div>
                            <div class="font-medium text-sm">
                                {sale.customerName || "Guest"}
                            </div>
                            <div class="text-xs text-muted-foreground">
                                {sale.member?.phone || "-"}
                            </div>
                        </div>
                        <Badge variant="secondary" class="text-xs capitalize">
                            {sale.paymentMethod === "mixed"
                                ? "Split"
                                : sale.paymentMethod}
                        </Badge>
                    </div>

                    <div
                        class="pt-3 border-t flex justify-between items-center"
                    >
                        <div>
                            <div class="text-xs text-muted-foreground">
                                Total
                            </div>
                            <div class="font-bold text-lg">
                                {formatCurrency(sale.finalAmount)}
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            class="h-8"
                            href="/sales/history/{sale.id}"
                        >
                            <Eye class="h-3.5 w-3.5 mr-2" />
                            Detail
                        </Button>
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>
