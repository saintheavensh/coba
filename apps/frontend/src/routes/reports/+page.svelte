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
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
    } from "$lib/components/ui/tabs";
    import {
        Download,
        Calendar as CalendarIcon,
        Filter,
        TrendingUp,
        Package,
        Wrench,
        ShoppingCart,
        DollarSign,
        ClipboardList,
        CheckCircle,
        Users,
    } from "lucide-svelte";
    import { Badge } from "$lib/components/ui/badge";
    import { createQuery } from "@tanstack/svelte-query";
    import {
        ReportsService,
        type TransactionReport,
        type SalesSummary,
        type PurchasesSummary,
        type PurchaseReport,
        type ServiceStats,
        type ServiceReport,
        type TechnicianReport,
        type PartsUsageReport,
        type ProfitAndLoss,
        type StockValueReport,
    } from "$lib/services/reports.service";

    // State Filter
    let startDate = $state("2026-01-01");
    let endDate = $state("2026-01-31");
    let activeTab = $state("sales");

    // Sales Queries
    const salesSummaryQuery = createQuery(() => ({
        queryKey: ["reports", "sales", "summary", startDate, endDate],
        queryFn: () => ReportsService.getSummary({ startDate, endDate }),
    }));

    const salesTransactionsQuery = createQuery(() => ({
        queryKey: ["reports", "sales", "transactions", startDate, endDate],
        queryFn: () => ReportsService.getTransactions({ startDate, endDate }),
    }));

    // Purchases Queries
    const purchasesSummaryQuery = createQuery(() => ({
        queryKey: ["reports", "purchases", "summary", startDate, endDate],
        queryFn: () =>
            ReportsService.getPurchasesSummary({ startDate, endDate }),
    }));

    const purchasesTransactionsQuery = createQuery(() => ({
        queryKey: ["reports", "purchases", "transactions", startDate, endDate],
        queryFn: () =>
            ReportsService.getPurchaseTransactions({ startDate, endDate }),
    }));

    // Services Queries
    const servicesStatsQuery = createQuery(() => ({
        queryKey: ["reports", "services", "stats", startDate, endDate],
        queryFn: () => ReportsService.getServiceStats({ startDate, endDate }),
    }));

    const servicesTransactionsQuery = createQuery(() => ({
        queryKey: ["reports", "services", "transactions", startDate, endDate],
        queryFn: () =>
            ReportsService.getServiceTransactions({ startDate, endDate }),
    }));

    // Technicians Query
    const techniciansQuery = createQuery(() => ({
        queryKey: ["reports", "technicians", startDate, endDate],
        queryFn: () =>
            ReportsService.getTechnicianStats({ startDate, endDate }),
    }));

    // Parts Usage Query
    const partsUsageQuery = createQuery(() => ({
        queryKey: ["reports", "parts", startDate, endDate],
        queryFn: () =>
            ReportsService.getPartsUsageReport({ startDate, endDate }),
    }));

    // Profit & Loss Query
    const profitLossQuery = createQuery(() => ({
        queryKey: ["reports", "profit-loss", startDate, endDate],
        queryFn: () => ReportsService.getProfitAndLoss({ startDate, endDate }),
    }));

    // Stock Value Query
    const stockValueQuery = createQuery(() => ({
        queryKey: ["reports", "stock-value"],
        queryFn: () => ReportsService.getStockValueReport(),
    }));

    const stockAdjustmentsQuery = createQuery(() => ({
        queryKey: ["reports", "stock-adjustments"],
        queryFn: () => ReportsService.getStockAdjustments(),
    }));

    // Derived from queries - Sales
    let salesSummary = $derived<SalesSummary>(
        salesSummaryQuery.data || {
            totalRevenue: 0,
            totalHPP: 0,
            totalProfit: 0,
            totalTransactions: 0,
            totalItems: 0,
            profitMargin: 0,
        },
    );
    let salesTransactions = $derived<TransactionReport[]>(
        salesTransactionsQuery.data || [],
    );

    // Derived from queries - Purchases
    let purchasesSummary = $derived<PurchasesSummary>(
        purchasesSummaryQuery.data || {
            totalAmount: 0,
            totalTransactions: 0,
            totalItems: 0,
        },
    );
    let purchasesTransactions = $derived<PurchaseReport[]>(
        purchasesTransactionsQuery.data || [],
    );

    // Derived from queries - Services
    let servicesStats = $derived<ServiceStats>(
        servicesStatsQuery.data || {
            total: 0,
            completed: 0,
            byStatus: {},
            revenue: 0,
        },
    );
    let servicesTransactions = $derived<ServiceReport[]>(
        servicesTransactionsQuery.data || [],
    );

    // Derived from queries - Technicians
    let technicians = $derived<TechnicianReport[]>(techniciansQuery.data || []);
    let totalTechnicianRevenue = $derived(
        technicians.reduce((sum, t) => sum + t.revenue, 0),
    );
    let totalTechnicianServices = $derived(
        technicians.reduce((sum, t) => sum + t.totalServices, 0),
    );

    // Derived from queries - Parts
    let partsUsage = $derived<PartsUsageReport[]>(partsUsageQuery.data || []);
    let totalPartsCost = $derived(
        partsUsage.reduce((sum, p) => sum + p.subtotal, 0),
    );

    // Derived from queries - P&L
    let profitLoss = $derived<ProfitAndLoss | null>(
        profitLossQuery.data || null,
    );

    // Derived from queries - Stock Value
    let stockValue = $derived<StockValueReport | null>(
        stockValueQuery.data || null,
    );

    // Loading state
    let isLoading = $derived(
        salesSummaryQuery.isPending ||
            purchasesSummaryQuery.isPending ||
            servicesStatsQuery.isPending ||
            techniciansQuery.isPending ||
            partsUsageQuery.isPending ||
            profitLossQuery.isPending ||
            stockValueQuery.isPending ||
            stockAdjustmentsQuery.isPending,
    );

    // Helper functions
    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    function formatCurrency(amount: number) {
        return `Rp ${amount.toLocaleString("id-ID")}`;
    }

    function getStatusBadgeVariant(
        status: string,
    ): "default" | "secondary" | "outline" | "destructive" {
        switch (status) {
            case "selesai":
            case "diambil":
                return "default";
            case "dikerjakan":
                return "secondary";
            case "batal":
                return "destructive";
            default:
                return "outline";
        }
    }

    function getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            antrian: "Antrian",
            dicek: "Dicek",
            konfirmasi: "Konfirmasi",
            dikerjakan: "Dikerjakan",
            selesai: "Selesai",
            diambil: "Diambil",
            batal: "Batal",
        };
        return labels[status] || status;
    }

    function calculateStatusPercentage(count: number, total: number): number {
        if (total === 0) return 0;
        return Math.round((count / total) * 100);
    }

    function exportToCSV() {
        let content = "";
        let filename = `report_${activeTab}_${startDate}_to_${endDate}.csv`;

        if (activeTab === "sales") {
            content = "Tanggal,No Nota,Items,Total,HPP,Profit\n";
            salesTransactions.forEach((t) => {
                content += `${t.date},${t.nota},${t.items},${t.total},${t.hpp},${t.profit}\n`;
            });
        } else if (activeTab === "services") {
            content = "Tanggal,No Service,Customer,Device,Status,Biaya\n";
            servicesTransactions.forEach((s) => {
                content += `${s.date},${s.no},${s.customerName},${s.deviceInfo},${s.status},${s.actualCost}\n`;
            });
        } else if (activeTab === "stock") {
            content = "Kategori,Stock,Nilai HPP\n";
            stockValue?.categories.forEach((c) => {
                content += `${c.name},${c.stock},${c.value}\n`;
            });
        } else if (activeTab === "adjustments") {
            content =
                "Tanggal,Produk,Varian,Sistem,Fisik,Selisih,Petugas,Alasan\n";
            (stockAdjustmentsQuery.data || []).forEach((adj) => {
                content += `${adj.completedAt},${adj.productName},${adj.variantName || "-"},${adj.systemStock},${adj.physicalStock},${adj.difference},${adj.userName},${adj.reason || "-"}\n`;
            });
        }

        const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <h3 class="text-2xl font-bold tracking-tight">
                📊 Laporan Keuangan
            </h3>
            <p class="text-sm text-muted-foreground">
                Analisis komprehensif penjualan, pembelian, dan layanan service
            </p>
        </div>
        <div class="flex items-center gap-2">
            <Button variant="outline" onclick={exportToCSV}>
                <Download class="mr-2 h-4 w-4" />
                Export CSV
            </Button>
        </div>
    </div>
    <Separator />

    <!-- Date Filter -->
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
                <Button disabled={isLoading}>
                    <Filter class="mr-2 h-4 w-4" />
                    {isLoading ? "Loading..." : "Terapkan Filter"}
                </Button>
            </div>
        </CardContent>
    </Card>

    <!-- Tabbed Reports -->
    <Tabs bind:value={activeTab} class="space-y-4">
        <TabsList class="grid w-full grid-cols-7">
            <TabsTrigger value="profit-loss" class="flex items-center gap-2">
                <DollarSign class="h-4 w-4" />
                <span>Laba Rugi</span>
            </TabsTrigger>
            <TabsTrigger value="sales" class="flex items-center gap-2">
                <TrendingUp class="h-4 w-4" />
                <span>Penjualan</span>
            </TabsTrigger>
            <TabsTrigger value="purchases" class="flex items-center gap-2">
                <Package class="h-4 w-4" />
                <span>Pembelian</span>
            </TabsTrigger>
            <TabsTrigger value="services" class="flex items-center gap-2">
                <Wrench class="h-4 w-4" />
                <span>Service</span>
            </TabsTrigger>
            <TabsTrigger value="technicians" class="flex items-center gap-2">
                <Users class="h-4 w-4" />
                <span>Teknisi</span>
            </TabsTrigger>
            <TabsTrigger value="parts" class="flex items-center gap-2">
                <ClipboardList class="h-4 w-4" />
                <span>Sparepart</span>
            </TabsTrigger>
            <TabsTrigger value="stock" class="flex items-center gap-2">
                <Package class="h-4 w-4" />
                <span>Nilai Stok</span>
            </TabsTrigger>
            <TabsTrigger value="adjustments" class="flex items-center gap-2">
                <ClipboardList class="h-4 w-4" />
                <span>Audit Stok</span>
            </TabsTrigger>
        </TabsList>

        <!-- P&L Tab -->
        <TabsContent value="profit-loss" class="space-y-4">
            {#if profitLoss}
                <div class="grid gap-4 md:grid-cols-2">
                    <Card class="border-blue-200 bg-blue-50/10">
                        <CardHeader>
                            <CardTitle>Rangkuman Pendapatan</CardTitle>
                        </CardHeader>
                        <CardContent class="space-y-4">
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-medium"
                                    >Pendapatan Penjualan</span
                                >
                                <span class="font-bold"
                                    >{formatCurrency(
                                        profitLoss.revenue.sales,
                                    )}</span
                                >
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-medium"
                                    >Pendapatan Service</span
                                >
                                <span class="font-bold"
                                    >{formatCurrency(
                                        profitLoss.revenue.services,
                                    )}</span
                                >
                            </div>
                            <Separator />
                            <div class="flex justify-between items-center">
                                <span class="text-lg font-bold text-blue-600"
                                    >Total Pendapatan</span
                                >
                                <span class="text-lg font-black text-blue-600"
                                    >{formatCurrency(
                                        profitLoss.revenue.total,
                                    )}</span
                                >
                            </div>
                        </CardContent>
                    </Card>

                    <Card class="border-red-200 bg-red-50/10">
                        <CardHeader>
                            <CardTitle>Rangkuman Pengeluaran</CardTitle>
                        </CardHeader>
                        <CardContent class="space-y-4">
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-medium"
                                    >HPP Barang (Sales)</span
                                >
                                <span class="font-bold text-red-600"
                                    >({formatCurrency(
                                        profitLoss.cogs.sales,
                                    )})</span
                                >
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-medium"
                                    >HPP Sparepart (Services)</span
                                >
                                <span class="font-bold text-red-600"
                                    >({formatCurrency(
                                        profitLoss.cogs.services,
                                    )})</span
                                >
                            </div>
                            <div
                                class="flex justify-between items-center text-red-600"
                            >
                                <span class="text-sm font-medium"
                                    >Komisi Teknisi</span
                                >
                                <span class="font-bold"
                                    >({formatCurrency(
                                        profitLoss.expenses.commissions,
                                    )})</span
                                >
                            </div>
                            <div
                                class="flex justify-between items-center text-red-600"
                            >
                                <span class="text-sm font-medium"
                                    >Biaya Operasional</span
                                >
                                <span class="font-bold"
                                    >({formatCurrency(
                                        profitLoss.expenses.operational,
                                    )})</span
                                >
                            </div>
                            <Separator />
                            <div class="flex justify-between items-center">
                                <span class="text-lg font-bold text-red-600"
                                    >Total Pengeluaran</span
                                >
                                <span class="text-lg font-black text-red-600"
                                    >({formatCurrency(
                                        profitLoss.cogs.total +
                                            profitLoss.expenses.total,
                                    )})</span
                                >
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        class="md:col-span-2 border-2 border-primary bg-primary/5 shadow-inner"
                    >
                        <CardContent class="p-8">
                            <div
                                class="flex flex-col items-center justify-center space-y-2"
                            >
                                <h4
                                    class="text-xl font-bold uppercase tracking-wider text-muted-foreground"
                                >
                                    Laba Bersih (Net Profit)
                                </h4>
                                <div
                                    class={`text-5xl font-black ${profitLoss.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                    {formatCurrency(profitLoss.netProfit)}
                                </div>
                                <div
                                    class="flex items-center gap-2 font-semibold"
                                >
                                    <TrendingUp class="h-4 w-4" />
                                    {Math.round(
                                        (profitLoss.netProfit /
                                            profitLoss.revenue.total) *
                                            100,
                                    )}% Margin Keuntungan
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            {:else}
                <div
                    class="h-64 flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border-2 border-dashed"
                >
                    Pilih periode dan terapkan filter untuk melihat Laporan Laba
                    Rugi
                </div>
            {/if}
        </TabsContent>

        <!-- Sales Tab -->
        <TabsContent value="sales" class="space-y-4">
            <!-- Sales Summary Cards -->
            <div class="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader
                        class="flex flex-row items-center justify-between space-y-0 pb-2"
                    >
                        <CardTitle class="text-sm font-medium">
                            Total Penjualan (Omzet)
                        </CardTitle>
                        <DollarSign class="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold">
                            {formatCurrency(salesSummary.totalRevenue)}
                        </div>
                        <p class="text-xs text-muted-foreground">
                            {salesSummary.totalTransactions} transaksi
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
                        <ShoppingCart class="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold">
                            {formatCurrency(salesSummary.totalHPP)}
                        </div>
                        <p class="text-xs text-muted-foreground">
                            Cost of Goods Sold
                        </p>
                    </CardContent>
                </Card>
                <Card
                    class="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                >
                    <CardHeader
                        class="flex flex-row items-center justify-between space-y-0 pb-2"
                    >
                        <CardTitle
                            class="text-sm font-medium text-green-700 dark:text-green-300"
                        >
                            Keuntungan Bersih
                        </CardTitle>
                        <TrendingUp class="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div
                            class="text-2xl font-bold text-green-700 dark:text-green-300"
                        >
                            {formatCurrency(salesSummary.totalProfit)}
                        </div>
                        <p
                            class="text-xs text-green-600 dark:text-green-400 font-medium"
                        >
                            Margin: {salesSummary.profitMargin.toFixed(1)}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            <!-- Sales Transaction Table -->
            <Card>
                <CardHeader>
                    <CardTitle>Rincian Transaksi Penjualan</CardTitle>
                    <CardDescription>
                        Detail keuntungan per nomor nota penjualan.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>No. Nota</TableHead>
                                <TableHead class="text-center"
                                    >Jml Item</TableHead
                                >
                                <TableHead class="text-right"
                                    >Penjualan</TableHead
                                >
                                <TableHead class="text-right"
                                    >HPP (Modal)</TableHead
                                >
                                <TableHead
                                    class="text-right font-bold text-green-600"
                                >
                                    Keuntungan
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each salesTransactions as t}
                                <TableRow>
                                    <TableCell>{formatDate(t.date)}</TableCell>
                                    <TableCell class="font-medium text-primary"
                                        >{t.nota}</TableCell
                                    >
                                    <TableCell class="text-center">
                                        <Badge variant="outline"
                                            >{t.items} Items</Badge
                                        >
                                    </TableCell>
                                    <TableCell class="text-right"
                                        >{formatCurrency(t.total)}</TableCell
                                    >
                                    <TableCell
                                        class="text-right text-muted-foreground"
                                    >
                                        {formatCurrency(t.hpp)}
                                    </TableCell>
                                    <TableCell
                                        class="text-right font-bold text-green-600"
                                    >
                                        + {formatCurrency(t.profit)}
                                    </TableCell>
                                </TableRow>
                            {/each}
                            {#if salesTransactions.length === 0}
                                <TableRow>
                                    <TableCell
                                        colspan={6}
                                        class="text-center text-muted-foreground py-8"
                                    >
                                        Tidak ada transaksi dalam periode ini
                                    </TableCell>
                                </TableRow>
                            {:else}
                                <TableRow
                                    class="bg-muted/50 font-medium hover:bg-muted/50"
                                >
                                    <TableCell colspan={3} class="text-right"
                                        >TOTAL</TableCell
                                    >
                                    <TableCell class="text-right"
                                        >{formatCurrency(
                                            salesSummary.totalRevenue,
                                        )}</TableCell
                                    >
                                    <TableCell class="text-right"
                                        >{formatCurrency(
                                            salesSummary.totalHPP,
                                        )}</TableCell
                                    >
                                    <TableCell class="text-right text-green-600"
                                        >{formatCurrency(
                                            salesSummary.totalProfit,
                                        )}</TableCell
                                    >
                                </TableRow>
                            {/if}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <!-- Purchases Tab -->
        <TabsContent value="purchases" class="space-y-4">
            <!-- Purchases Summary Cards -->
            <div class="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader
                        class="flex flex-row items-center justify-between space-y-0 pb-2"
                    >
                        <CardTitle class="text-sm font-medium">
                            Total Pembelian
                        </CardTitle>
                        <Package class="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold">
                            {formatCurrency(purchasesSummary.totalAmount)}
                        </div>
                        <p class="text-xs text-muted-foreground">
                            Pengeluaran stok masuk
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader
                        class="flex flex-row items-center justify-between space-y-0 pb-2"
                    >
                        <CardTitle class="text-sm font-medium">
                            Jumlah Transaksi
                        </CardTitle>
                        <ClipboardList class="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold">
                            {purchasesSummary.totalTransactions}
                        </div>
                        <p class="text-xs text-muted-foreground">
                            Purchase Orders
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader
                        class="flex flex-row items-center justify-between space-y-0 pb-2"
                    >
                        <CardTitle class="text-sm font-medium">
                            Total Item Masuk
                        </CardTitle>
                        <ShoppingCart class="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold">
                            {purchasesSummary.totalItems.toLocaleString()}
                        </div>
                        <p class="text-xs text-muted-foreground">
                            Stock received
                        </p>
                    </CardContent>
                </Card>
            </div>

            <!-- Purchases Transaction Table -->
            <Card>
                <CardHeader>
                    <CardTitle>Rincian Pembelian</CardTitle>
                    <CardDescription>
                        Detail transaksi pembelian dari supplier.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>No. PO</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead class="text-center"
                                    >Jml Item</TableHead
                                >
                                <TableHead class="text-right"
                                    >Total Pembelian</TableHead
                                >
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each purchasesTransactions as p}
                                <TableRow>
                                    <TableCell>{formatDate(p.date)}</TableCell>
                                    <TableCell class="font-medium text-primary"
                                        >{p.id}</TableCell
                                    >
                                    <TableCell
                                        >{p.supplierName || "-"}</TableCell
                                    >
                                    <TableCell class="text-center">
                                        <Badge variant="outline"
                                            >{p.items} Items</Badge
                                        >
                                    </TableCell>
                                    <TableCell class="text-right font-medium">
                                        {formatCurrency(p.totalAmount)}
                                    </TableCell>
                                </TableRow>
                            {/each}
                            {#if purchasesTransactions.length === 0}
                                <TableRow>
                                    <TableCell
                                        colspan={5}
                                        class="text-center text-muted-foreground py-8"
                                    >
                                        Tidak ada pembelian dalam periode ini
                                    </TableCell>
                                </TableRow>
                            {:else}
                                <TableRow
                                    class="bg-muted/50 font-medium hover:bg-muted/50"
                                >
                                    <TableCell colspan={4} class="text-right"
                                        >TOTAL</TableCell
                                    >
                                    <TableCell class="text-right"
                                        >{formatCurrency(
                                            purchasesSummary.totalAmount,
                                        )}</TableCell
                                    >
                                </TableRow>
                            {/if}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <!-- Services Tab -->
        <TabsContent value="services" class="space-y-4">
            <!-- Services Summary Cards -->
            <div class="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader
                        class="flex flex-row items-center justify-between space-y-0 pb-2"
                    >
                        <CardTitle class="text-sm font-medium">
                            Total Service
                        </CardTitle>
                        <Wrench class="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold">
                            {servicesStats.total}
                        </div>
                        <p class="text-xs text-muted-foreground">
                            Dalam periode ini
                        </p>
                    </CardContent>
                </Card>
                <Card
                    class="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                >
                    <CardHeader
                        class="flex flex-row items-center justify-between space-y-0 pb-2"
                    >
                        <CardTitle
                            class="text-sm font-medium text-green-700 dark:text-green-300"
                        >
                            Pendapatan Service
                        </CardTitle>
                        <DollarSign class="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div
                            class="text-2xl font-bold text-green-700 dark:text-green-300"
                        >
                            {formatCurrency(servicesStats.revenue)}
                        </div>
                        <p class="text-xs text-green-600 dark:text-green-400">
                            Service revenue
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader
                        class="flex flex-row items-center justify-between space-y-0 pb-2"
                    >
                        <CardTitle class="text-sm font-medium">
                            Selesai / Diambil
                        </CardTitle>
                        <CheckCircle class="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold">
                            {servicesStats.completed}
                        </div>
                        <p class="text-xs text-muted-foreground">
                            {servicesStats.total > 0
                                ? `${calculateStatusPercentage(servicesStats.completed, servicesStats.total)}% completion rate`
                                : "No services"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <!-- Status Breakdown -->
            {#if Object.keys(servicesStats.byStatus).length > 0}
                <Card>
                    <CardHeader>
                        <CardTitle>Status Service</CardTitle>
                        <CardDescription
                            >Breakdown berdasarkan status</CardDescription
                        >
                    </CardHeader>
                    <CardContent class="space-y-3">
                        {#each Object.entries(servicesStats.byStatus) as [status, count]}
                            <div class="flex items-center gap-3">
                                <div class="w-24 text-sm font-medium">
                                    {getStatusLabel(status)}
                                </div>
                                <div
                                    class="flex-1 bg-muted rounded-full h-4 overflow-hidden"
                                >
                                    <div
                                        class="h-full bg-primary transition-all duration-300"
                                        style="width: {calculateStatusPercentage(
                                            count,
                                            servicesStats.total,
                                        )}%"
                                    ></div>
                                </div>
                                <div class="w-16 text-sm text-right">
                                    <span class="font-medium">{count}</span>
                                    <span
                                        class="text-muted-foreground text-xs ml-1"
                                        >({calculateStatusPercentage(
                                            count,
                                            servicesStats.total,
                                        )}%)</span
                                    >
                                </div>
                            </div>
                        {/each}
                    </CardContent>
                </Card>
            {/if}

            <!-- Services Transaction Table -->
            <Card>
                <CardHeader>
                    <CardTitle>Rincian Service</CardTitle>
                    <CardDescription>
                        Detail transaksi service dalam periode.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>No. Service</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Device</TableHead>
                                <TableHead class="text-center">Status</TableHead
                                >
                                <TableHead class="text-right"
                                    >Biaya Aktual</TableHead
                                >
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each servicesTransactions as s}
                                <TableRow>
                                    <TableCell>{formatDate(s.date)}</TableCell>
                                    <TableCell class="font-medium text-primary"
                                        >{s.no}</TableCell
                                    >
                                    <TableCell>{s.customerName}</TableCell>
                                    <TableCell class="text-muted-foreground"
                                        >{s.deviceInfo || "-"}</TableCell
                                    >
                                    <TableCell class="text-center">
                                        <Badge
                                            variant={getStatusBadgeVariant(
                                                s.status,
                                            )}
                                        >
                                            {getStatusLabel(s.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell class="text-right font-medium">
                                        {s.actualCost > 0
                                            ? formatCurrency(s.actualCost)
                                            : "-"}
                                    </TableCell>
                                </TableRow>
                            {/each}
                            {#if servicesTransactions.length === 0}
                                <TableRow>
                                    <TableCell
                                        colspan={6}
                                        class="text-center text-muted-foreground py-8"
                                    >
                                        Tidak ada service dalam periode ini
                                    </TableCell>
                                </TableRow>
                            {:else}
                                <TableRow
                                    class="bg-muted/50 font-medium hover:bg-muted/50"
                                >
                                    <TableCell colspan={5} class="text-right"
                                        >TOTAL PENDAPATAN</TableCell
                                    >
                                    <TableCell class="text-right text-green-600"
                                        >{formatCurrency(
                                            servicesStats.revenue,
                                        )}</TableCell
                                    >
                                </TableRow>
                            {/if}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <!-- Technicians Tab -->
        <TabsContent value="technicians" class="space-y-4">
            <!-- Technicians Summary Cards -->
            <div class="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader
                        class="flex flex-row items-center justify-between space-y-0 pb-2"
                    >
                        <CardTitle class="text-sm font-medium">
                            Total Teknisi
                        </CardTitle>
                        <Users class="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold">
                            {technicians.length}
                        </div>
                        <p class="text-xs text-muted-foreground">
                            Teknisi aktif dalam sistem
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader
                        class="flex flex-row items-center justify-between space-y-0 pb-2"
                    >
                        <CardTitle class="text-sm font-medium">
                            Total Service Dikerjakan
                        </CardTitle>
                        <Wrench class="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold">
                            {totalTechnicianServices}
                        </div>
                        <p class="text-xs text-muted-foreground">
                            Dalam periode ini
                        </p>
                    </CardContent>
                </Card>
                <Card
                    class="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                >
                    <CardHeader
                        class="flex flex-row items-center justify-between space-y-0 pb-2"
                    >
                        <CardTitle
                            class="text-sm font-medium text-green-700 dark:text-green-300"
                        >
                            Total Pendapatan
                        </CardTitle>
                        <DollarSign class="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div
                            class="text-2xl font-bold text-green-700 dark:text-green-300"
                        >
                            {formatCurrency(totalTechnicianRevenue)}
                        </div>
                        <p class="text-xs text-green-600 dark:text-green-400">
                            Revenue dari service selesai
                        </p>
                    </CardContent>
                </Card>
            </div>

            <!-- Technician Performance Table -->
            <Card>
                <CardHeader>
                    <CardTitle>Performa Teknisi</CardTitle>
                    <CardDescription>
                        Statistik kinerja setiap teknisi dalam periode ini.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Teknisi</TableHead>
                                <TableHead class="text-center"
                                    >Total Service</TableHead
                                >
                                <TableHead class="text-center"
                                    >Selesai</TableHead
                                >
                                <TableHead class="text-center"
                                    >Dalam Proses</TableHead
                                >
                                <TableHead class="text-center"
                                    >Completion Rate</TableHead
                                >
                                <TableHead class="text-right"
                                    >Pendapatan</TableHead
                                >
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each technicians as t}
                                <TableRow>
                                    <TableCell>
                                        <div class="flex items-center gap-2">
                                            <div
                                                class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium"
                                            >
                                                {t.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span class="font-medium"
                                                >{t.name}</span
                                            >
                                        </div>
                                    </TableCell>
                                    <TableCell class="text-center">
                                        <Badge variant="outline"
                                            >{t.totalServices}</Badge
                                        >
                                    </TableCell>
                                    <TableCell class="text-center">
                                        <Badge variant="default"
                                            >{t.completed}</Badge
                                        >
                                    </TableCell>
                                    <TableCell class="text-center">
                                        <Badge variant="secondary"
                                            >{t.inProgress}</Badge
                                        >
                                    </TableCell>
                                    <TableCell class="text-center">
                                        <div
                                            class="flex items-center gap-2 justify-center"
                                        >
                                            <div
                                                class="w-16 bg-muted rounded-full h-2 overflow-hidden"
                                            >
                                                <div
                                                    class="h-full bg-green-500 transition-all duration-300"
                                                    style="width: {t.completionRate}%"
                                                ></div>
                                            </div>
                                            <span class="text-xs font-medium"
                                                >{t.completionRate}%</span
                                            >
                                        </div>
                                    </TableCell>
                                    <TableCell
                                        class="text-right font-medium text-green-600"
                                    >
                                        {formatCurrency(t.revenue)}
                                    </TableCell>
                                </TableRow>
                            {/each}
                            {#if technicians.length === 0}
                                <TableRow>
                                    <TableCell
                                        colspan={6}
                                        class="text-center text-muted-foreground py-8"
                                    >
                                        Tidak ada data teknisi
                                    </TableCell>
                                </TableRow>
                            {:else}
                                <TableRow
                                    class="bg-muted/50 font-medium hover:bg-muted/50"
                                >
                                    <TableCell class="text-right"
                                        >TOTAL</TableCell
                                    >
                                    <TableCell class="text-center"
                                        >{totalTechnicianServices}</TableCell
                                    >
                                    <TableCell class="text-center"
                                        >{technicians.reduce(
                                            (sum, t) => sum + t.completed,
                                            0,
                                        )}</TableCell
                                    >
                                    <TableCell class="text-center"
                                        >{technicians.reduce(
                                            (sum, t) => sum + t.inProgress,
                                            0,
                                        )}</TableCell
                                    >
                                    <TableCell class="text-center">-</TableCell>
                                    <TableCell class="text-right text-green-600"
                                        >{formatCurrency(
                                            totalTechnicianRevenue,
                                        )}</TableCell
                                    >
                                </TableRow>
                            {/if}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <!-- Parts Usage Tab -->
        <TabsContent value="parts" class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader
                        class="flex flex-row items-center justify-between space-y-0 pb-2"
                    >
                        <CardTitle class="text-sm font-medium"
                            >Total Penggunaan</CardTitle
                        >
                        <Package class="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold">
                            {partsUsage.length} Item
                        </div>
                        <p class="text-xs text-muted-foreground">
                            Sparepart terpakai
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader
                        class="flex flex-row items-center justify-between space-y-0 pb-2"
                    >
                        <CardTitle class="text-sm font-medium"
                            >Total Nilai</CardTitle
                        >
                        <DollarSign class="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold">
                            {formatCurrency(totalPartsCost)}
                        </div>
                        <p class="text-xs text-muted-foreground">
                            Nilai jual sparepart
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Penggunaan Sparepart</CardTitle>
                    <CardDescription>
                        Daftar sparepart yang digunakan dalam service.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>No. Service</TableHead>
                                <TableHead>Sparepart</TableHead>
                                <TableHead>Sumber</TableHead>
                                <TableHead class="text-right">Qty</TableHead>
                                <TableHead class="text-right">Harga</TableHead>
                                <TableHead class="text-right"
                                    >Subtotal</TableHead
                                >
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each partsUsage as p}
                                <TableRow>
                                    <TableCell>{formatDate(p.date)}</TableCell>
                                    <TableCell class="font-medium text-primary"
                                        >{p.serviceNo}</TableCell
                                    >
                                    <TableCell>
                                        <div class="flex flex-col">
                                            <span class="font-medium"
                                                >{p.partName}</span
                                            >
                                            {#if p.variant}
                                                <span
                                                    class="text-xs text-muted-foreground"
                                                    >{p.variant}</span
                                                >
                                            {/if}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={p.source === "inventory"
                                                ? "default"
                                                : "outline"}
                                        >
                                            {p.source === "inventory"
                                                ? "Inventori"
                                                : "Beli Luar"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell class="text-right"
                                        >{p.qty}</TableCell
                                    >
                                    <TableCell class="text-right"
                                        >{formatCurrency(p.price)}</TableCell
                                    >
                                    <TableCell class="text-right font-medium"
                                        >{formatCurrency(p.subtotal)}</TableCell
                                    >
                                </TableRow>
                            {/each}
                            {#if partsUsage.length === 0}
                                <TableRow>
                                    <TableCell
                                        colspan={7}
                                        class="text-center text-muted-foreground py-8"
                                    >
                                        Tidak ada penggunaan sparepart dalam
                                        periode ini
                                    </TableCell>
                                </TableRow>
                            {/if}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <!-- Stock Value Tab -->
        <TabsContent value="stock" class="space-y-4">
            {#if stockValue}
                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader class="pb-2">
                            <CardTitle
                                class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                >Total Item</CardTitle
                            >
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">
                                {stockValue.totalItems}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader class="pb-2">
                            <CardTitle
                                class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                >Total Stok (Qty)</CardTitle
                            >
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">
                                {stockValue.totalStock}
                            </div>
                        </CardContent>
                    </Card>
                    <Card class="border-blue-200">
                        <CardHeader class="pb-2">
                            <CardTitle
                                class="text-xs font-bold uppercase tracking-wider text-blue-600"
                                >Nilai Aset (HPP)</CardTitle
                            >
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold text-blue-600">
                                {formatCurrency(stockValue.totalValueHPP)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card class="border-green-200">
                        <CardHeader class="pb-2">
                            <CardTitle
                                class="text-xs font-bold uppercase tracking-wider text-green-600"
                                >Nilai Jual (Omzet)</CardTitle
                            >
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold text-green-600">
                                {formatCurrency(stockValue.totalValueSell)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Nilai Stok Per Kategori</CardTitle>
                        <CardDescription
                            >Visualisasi aset inventori yang sedang mengendap.</CardDescription
                        >
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead class="text-center"
                                        >Jumlah Stok</TableHead
                                    >
                                    <TableHead class="text-right"
                                        >Total Nilai (HPP)</TableHead
                                    >
                                    <TableHead class="text-right"
                                        >Presentase</TableHead
                                    >
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {#each stockValue.categories as c}
                                    <TableRow>
                                        <TableCell class="font-medium"
                                            >{c.name}</TableCell
                                        >
                                        <TableCell class="text-center"
                                            >{c.stock}</TableCell
                                        >
                                        <TableCell class="text-right font-bold"
                                            >{formatCurrency(
                                                c.value,
                                            )}</TableCell
                                        >
                                        <TableCell class="text-right">
                                            {Math.round(
                                                (c.value /
                                                    stockValue.totalValueHPP) *
                                                    100,
                                            )}%
                                        </TableCell>
                                    </TableRow>
                                {/each}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            {:else}
                <div
                    class="h-64 flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border-2 border-dashed"
                >
                    Menghitung nilai stok...
                </div>
            {/if}
        </TabsContent>
        <!-- Stock Value Tab remains same... -->

        <!-- Audit Stok Tab -->
        <TabsContent value="adjustments" class="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Penyesuaian Stok (Audit)</CardTitle>
                    <CardDescription>
                        Daftar selisih stok yang ditemukan saat opname dan telah
                        disesuaikan ke sistem.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Produk</TableHead>
                                <TableHead>Varian</TableHead>
                                <TableHead class="text-center">Sistem</TableHead
                                >
                                <TableHead class="text-center">Fisik</TableHead>
                                <TableHead class="text-center"
                                    >Selisih</TableHead
                                >
                                <TableHead>Petugas</TableHead>
                                <TableHead>Alasan / Catatan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each stockAdjustmentsQuery.data || [] as adj}
                                <TableRow>
                                    <TableCell
                                        >{formatDate(
                                            adj.completedAt,
                                        )}</TableCell
                                    >
                                    <TableCell class="font-medium"
                                        >{adj.productName}</TableCell
                                    >
                                    <TableCell
                                        >{adj.variantName || "-"}</TableCell
                                    >
                                    <TableCell class="text-center font-mono"
                                        >{adj.systemStock}</TableCell
                                    >
                                    <TableCell class="text-center font-mono"
                                        >{adj.physicalStock}</TableCell
                                    >
                                    <TableCell class="text-center">
                                        {#if adj.difference > 0}
                                            <Badge
                                                class="bg-blue-100 text-blue-700 hover:bg-blue-100"
                                                >+{adj.difference} (Surplus)</Badge
                                            >
                                        {:else}
                                            <Badge
                                                variant="destructive"
                                                class="bg-red-100 text-red-700 hover:bg-red-100"
                                                >{adj.difference} (Loss)</Badge
                                            >
                                        {/if}
                                    </TableCell>
                                    <TableCell
                                        >{adj.userName || "System"}</TableCell
                                    >
                                    <TableCell
                                        class="text-sm text-muted-foreground italic"
                                    >
                                        {adj.reason || "-"}
                                    </TableCell>
                                </TableRow>
                            {/each}
                            {#if (stockAdjustmentsQuery.data || []).length === 0}
                                <TableRow>
                                    <TableCell
                                        colspan={8}
                                        class="text-center py-10 text-muted-foreground"
                                    >
                                        Tidak ada riwayat selisih stok
                                        ditemukan.
                                    </TableCell>
                                </TableRow>
                            {/if}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
</div>
