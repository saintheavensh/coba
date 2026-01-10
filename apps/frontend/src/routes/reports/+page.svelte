<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
        CardDescription,
    } from "$lib/components/ui/card";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/components/ui/table";
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import { Label } from "$lib/components/ui/label";
    import { Separator } from "$lib/components/ui/separator";
    import {
        Search,
        Download,
        Calendar as CalendarIcon,
        Filter,
        Loader2,
    } from "lucide-svelte";
    import { Badge } from "$lib/components/ui/badge";
    import { createQuery } from "@tanstack/svelte-query";
    import {
        ReportsService,
        type TransactionReport,
        type SalesSummary,
    } from "$lib/services/reports.service";

    // State Filter
    let startDate = $state("2026-01-01");
    let endDate = $state("2026-01-31");

    // Queries
    const summaryQuery = createQuery(() => ({
        queryKey: ["reports", "summary", startDate, endDate],
        queryFn: () => ReportsService.getSummary({ startDate, endDate }),
    }));

    const transactionsQuery = createQuery(() => ({
        queryKey: ["reports", "transactions", startDate, endDate],
        queryFn: () => ReportsService.getTransactions({ startDate, endDate }),
    }));

    // Derived from queries
    let summary = $derived<SalesSummary>(
        summaryQuery.data || {
            totalRevenue: 0,
            totalHPP: 0,
            totalProfit: 0,
            totalTransactions: 0,
            totalItems: 0,
            profitMargin: 0,
        },
    );
    let transactions = $derived<TransactionReport[]>(
        transactionsQuery.data || [],
    );
    let isLoading = $derived(
        summaryQuery.isPending || transactionsQuery.isPending,
    );

    // Legacy variable names for template compatibility
    let totalRevenue = $derived(summary.totalRevenue);
    let totalHPP = $derived(summary.totalHPP);
    let totalProfit = $derived(summary.totalProfit);
    let totalItems = $derived(summary.totalItems);
    let profitMargin = $derived(summary.profitMargin);

    function handleFilter() {
        // Queries will automatically refetch when startDate/endDate change
    }
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h3 class="text-lg font-medium">Laporan Keuntungan</h3>
            <p class="text-sm text-muted-foreground">
                Analisis pendapatan, modal (HPP), dan keuntungan bersih periode
                ini.
            </p>
        </div>
        <div class="flex items-center gap-2">
            <Button variant="outline">
                <Download class="mr-2 h-4 w-4" />
                Export CSV
            </Button>
        </div>
    </div>
    <Separator />

    <!-- Filters -->
    <Card>
        <CardContent class="p-4">
            <div class="flex flex-col sm:flex-row gap-4 items-end">
                <div class="grid gap-2 flex-1">
                    <Label>Mulai Tanggal</Label>
                    <div class="relative">
                        <CalendarIcon
                            class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                        />
                        <Input
                            type="date"
                            bind:value={startDate}
                            class="pl-8"
                        />
                    </div>
                </div>
                <div class="grid gap-2 flex-1">
                    <Label>Sampai Tanggal</Label>
                    <div class="relative">
                        <CalendarIcon
                            class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                        />
                        <Input type="date" bind:value={endDate} class="pl-8" />
                    </div>
                </div>
                <Button>
                    <Filter class="mr-2 h-4 w-4" /> Terapkan Filter
                </Button>
            </div>
        </CardContent>
    </Card>

    <!-- Summary Cards -->
    <div class="grid gap-4 md:grid-cols-3">
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium">
                    Total Penjualan (Omzet)
                </CardTitle>
                <span class="text-muted-foreground font-bold">💰</span>
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    Rp {totalRevenue.toLocaleString()}
                </div>
                <p class="text-xs text-muted-foreground">
                    +20.1% dari bulan lalu
                </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium">
                    Total Modal (HPP)
                </CardTitle>
                <span class="text-muted-foreground font-bold">📦</span>
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    Rp {totalHPP.toLocaleString()}
                </div>
                <p class="text-xs text-muted-foreground">Cost of Goods Sold</p>
            </CardContent>
        </Card>
        <Card class="bg-primary/5 border-primary/20">
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium text-green-700">
                    Keuntungan Bersih
                </CardTitle>
                <span class="text-green-600 font-bold">📈</span>
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold text-green-700">
                    Rp {totalProfit.toLocaleString()}
                </div>
                <p class="text-xs text-green-600 font-medium">
                    Margin: {profitMargin.toFixed(1)}%
                </p>
            </CardContent>
        </Card>
    </div>

    <!-- Detail Table -->
    <Card>
        <CardHeader>
            <CardTitle>Rincian Transaksi</CardTitle>
            <CardDescription
                >Detail keuntungan per nomor nota penjualan.</CardDescription
            >
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>No. Nota</TableHead>
                        <TableHead class="text-center">Jml Item</TableHead>
                        <TableHead class="text-right">Penjualan</TableHead>
                        <TableHead class="text-right">HPP (Modal)</TableHead>
                        <TableHead class="text-right font-bold text-green-600"
                            >Keuntungan</TableHead
                        >
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {#each transactions as t}
                        <TableRow>
                            <TableCell>{t.date}</TableCell>
                            <TableCell class="font-medium text-primary"
                                >{t.nota}</TableCell
                            >
                            <TableCell class="text-center">
                                <Badge variant="outline">{t.items} Items</Badge>
                            </TableCell>
                            <TableCell class="text-right"
                                >Rp {t.total.toLocaleString()}</TableCell
                            >
                            <TableCell class="text-right text-muted-foreground"
                                >Rp {t.hpp.toLocaleString()}</TableCell
                            >
                            <TableCell
                                class="text-right font-bold text-green-600"
                                >+ Rp {t.profit.toLocaleString()}</TableCell
                            >
                        </TableRow>
                    {/each}
                    <TableRow class="bg-muted/50 font-medium hover:bg-muted/50">
                        <TableCell colspan={3} class="text-right"
                            >TOTAL</TableCell
                        >
                        <TableCell class="text-right"
                            >Rp {totalRevenue.toLocaleString()}</TableCell
                        >
                        <TableCell class="text-right"
                            >Rp {totalHPP.toLocaleString()}</TableCell
                        >
                        <TableCell class="text-right text-green-600"
                            >Rp {totalProfit.toLocaleString()}</TableCell
                        >
                    </TableRow>
                </TableBody>
            </Table>
        </CardContent>
    </Card>
</div>
