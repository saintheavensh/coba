<script lang="ts">
    import { onMount } from "svelte";
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
    import { Switch } from "$lib/components/ui/switch";
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
        ArrowUpRight,
        ArrowDownRight,
        Briefcase,
        Wallet,
        BarChart3,
        PieChart,
        Calculator,
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
    import {
        SettingsService,
        type GeneralSettings,
        type AccountingMode,
    } from "$lib/services/settings.service";
    import { api } from "$lib/api";

    // New Components
    import SalesTrendChart from "./components/SalesTrendChart.svelte";
    import ProfitCostChart from "./components/ProfitCostChart.svelte";
    import ServiceStatusChart from "./components/ServiceStatusChart.svelte";
    import ProModeSetupDialog from "./components/ProModeSetupDialog.svelte";
    import ProfitLossTree from "./components/ProfitLossTree.svelte";
    import DateTimePicker from "$lib/components/custom/date-time-picker.svelte";
    import * as XLSX from "xlsx";

    // Accounting Mode State
    let accountingMode = $state<AccountingMode>("simple");
    let showProModeSetup = $state(false);
    let loadingMode = $state(true);

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

    // Account Tree (for Pro Mode P&L)
    const accountTreeQuery = createQuery(() => ({
        queryKey: ["accounting", "tree"],
        queryFn: async () => {
            const res = await api.get("/accounting/accounts/tree");
            return res.data;
        },
        enabled: !!(accountingMode === "professional"),
    }));

    // Account Mappings (for Pro Mode P&L)
    const mappingSettingsQuery = createQuery(() => ({
        queryKey: ["settings", "account-mappings"],
        queryFn: () => SettingsService.getAccountMappings(),
        enabled: !!(accountingMode === "professional"),
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

    let salesTrendData = $derived(
        salesTransactions
            .map((t) => ({
                date: t.date,
                value: t.total,
            }))
            .sort(
                (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime(),
            ),
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

    let serviceStatusData = $derived(
        Object.entries(servicesStats.byStatus).map(([status, count]) => ({
            status: getStatusLabel(status),
            count,
        })),
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

    let profitCostData = $derived(
        profitLoss
            ? {
                  revenue: profitLoss.revenue.total,
                  cogs: profitLoss.cogs.total,
                  expenses: profitLoss.expenses.total,
              }
            : { revenue: 0, cogs: 0, expenses: 0 },
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

    function exportToExcel() {
        const wb = XLSX.utils.book_new();

        // Sales Sheet
        if (salesTransactions.length > 0) {
            const salesData = salesTransactions.map((t) => ({
                Tanggal: t.date,
                "No Nota": t.nota,
                Items: t.items,
                Total: t.total,
                HPP: t.hpp,
                Profit: t.profit,
            }));
            const wsSales = XLSX.utils.json_to_sheet(salesData);
            XLSX.utils.book_append_sheet(wb, wsSales, "Penjualan");
        }

        // Services Sheet
        if (servicesTransactions.length > 0) {
            const servicesData = servicesTransactions.map((s) => ({
                Tanggal: s.date,
                "No Service": s.no,
                Customer: s.customerName,
                Device: s.deviceInfo,
                Status: s.status,
                Biaya: s.actualCost,
            }));
            const wsServices = XLSX.utils.json_to_sheet(servicesData);
            XLSX.utils.book_append_sheet(wb, wsServices, "Service");
        }

        // Purchases Sheet
        if (purchasesTransactions.length > 0) {
            const purchasesData = purchasesTransactions.map((p) => ({
                Tanggal: p.date,
                "No Faktur": p.id,
                Supplier: p.supplierName,
                Total: p.totalAmount,
                Items: p.items,
            }));
            const wsPurchases = XLSX.utils.json_to_sheet(purchasesData);
            XLSX.utils.book_append_sheet(wb, wsPurchases, "Pembelian");
        }

        // Technicians Sheet
        if (technicians.length > 0) {
            const techData = technicians.map((t) => ({
                Nama: t.name,
                "Total Service": t.totalServices,
                Pendapatan: t.revenue,
            }));
            const wsTech = XLSX.utils.json_to_sheet(techData);
            XLSX.utils.book_append_sheet(wb, wsTech, "Teknisi");
        }

        // Parts Sheet
        if (partsUsage.length > 0) {
            const partsData = partsUsage.map((p) => ({
                "Nama Part": p.partName,
                Source: p.source,
                "Jumlah Terpakai": p.qty,
                Subtotal: p.subtotal,
            }));
            const wsParts = XLSX.utils.json_to_sheet(partsData);
            XLSX.utils.book_append_sheet(wb, wsParts, "Sparepart");
        }

        // Stock Sheet
        if (stockValue?.categories) {
            const stockData = stockValue.categories.map((c) => ({
                Kategori: c.name,
                Stock: c.stock,
                "Nilai HPP": c.value,
            }));
            const wsStock = XLSX.utils.json_to_sheet(stockData);
            XLSX.utils.book_append_sheet(wb, wsStock, "Stok");
        }

        // Adjustments Sheet
        const adjustments = stockAdjustmentsQuery.data || [];
        if (adjustments.length > 0) {
            const adjData = adjustments.map((adj) => ({
                Tanggal: adj.completedAt,
                Produk: adj.productName,
                Varian: adj.variantName || "-",
                Sistem: adj.systemStock,
                Fisik: adj.physicalStock,
                Selisih: adj.difference,
                Petugas: adj.userName,
                Alasan: adj.reason || "-",
            }));
            const wsAdj = XLSX.utils.json_to_sheet(adjData);
            XLSX.utils.book_append_sheet(wb, wsAdj, "Penyesuaian Stok");
        }

        const filename = `Laporan_Lengkap_${startDate}_sd_${endDate}.xlsx`;
        XLSX.writeFile(wb, filename);
    }

    // Fetch accounting mode on mount
    async function fetchAccountingMode() {
        try {
            loadingMode = true;
            const settings = await SettingsService.getGeneralSettings();
            accountingMode = settings.accountingMode;
        } catch (e) {
            console.error("Failed to fetch accounting mode", e);
            accountingMode = "simple";
        } finally {
            loadingMode = false;
        }
    }

    async function disableProMode() {
        try {
            const settings: GeneralSettings = {
                accountingMode: "simple",
                accountingSetupComplete: false,
            };
            await SettingsService.setGeneralSettings(settings);
            accountingMode = "simple";
        } catch (e) {
            console.error("Failed to disable Pro Mode", e);
        }
    }

    function handleProModeComplete() {
        accountingMode = "professional";
        showProModeSetup = false;
    }

    onMount(() => {
        fetchAccountingMode();
    });
</script>

<!-- Pro Mode Setup Dialog -->
<ProModeSetupDialog
    bind:open={showProModeSetup}
    onClose={() => (showProModeSetup = false)}
    onComplete={handleProModeComplete}
/>

<div class="space-y-8 pb-10">
    <!-- Header with Glassmorphism -->
    <div
        class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-2xl"
    >
        <div class="absolute inset-0 bg-white/10 backdrop-blur-3xl"></div>
        <div
            class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
            <div>
                <h1 class="text-3xl font-bold tracking-tight">
                    Laporan Keuangan
                </h1>
                <p class="mt-2 text-blue-100 opacity-90 max-w-xl">
                    Analisis komprehensif performa bisnis Anda. Pantau
                    penjualan, pembelian, dan layanan service secara real-time.
                </p>
            </div>
            <div class="flex items-center gap-3">
                <!-- Mode Toggle -->
                <div
                    class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md"
                >
                    <span
                        class="text-xs font-medium text-blue-100 {accountingMode ===
                        'simple'
                            ? 'opacity-100'
                            : 'opacity-50'}">Simple</span
                    >
                    <Switch
                        checked={accountingMode === "professional"}
                        onCheckedChange={(checked) => {
                            if (checked) {
                                showProModeSetup = true;
                            } else {
                                disableProMode();
                            }
                        }}
                        class="data-[state=checked]:bg-green-500"
                    />
                    <span
                        class="text-xs font-medium text-blue-100 {accountingMode ===
                        'professional'
                            ? 'opacity-100'
                            : 'opacity-50'}">Pro</span
                    >
                </div>
                <Button
                    variant="outline"
                    size="lg"
                    onclick={exportToExcel}
                    class="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-md transition-all"
                >
                    <Download class="mr-2 h-4 w-4" />
                    Export Excel
                </Button>
            </div>
        </div>

        <!-- Quick Stats Overlay -->
        <div class="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div
                class="rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10"
            >
                <p
                    class="text-xs font-medium text-blue-200 uppercase tracking-wider"
                >
                    Total Omzet
                </p>
                <p class="text-2xl font-bold mt-1 text-white">
                    {formatCurrency(salesSummary.totalRevenue)}
                </p>
            </div>
            <div
                class="rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10"
            >
                <p
                    class="text-xs font-medium text-blue-200 uppercase tracking-wider"
                >
                    Profit Bersih
                </p>
                <div class="flex items-center gap-2 mt-1">
                    <p class="text-2xl font-bold text-white">
                        {formatCurrency(salesSummary.totalProfit)}
                    </p>
                    {#if salesSummary.totalProfit > 0}
                        <ArrowUpRight class="h-4 w-4 text-green-300" />
                    {/if}
                </div>
            </div>
            <div
                class="rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10"
            >
                <p
                    class="text-xs font-medium text-blue-200 uppercase tracking-wider"
                >
                    Total Service
                </p>
                <p class="text-2xl font-bold mt-1 text-white">
                    {servicesStats.total}
                </p>
            </div>
            <div
                class="rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10"
            >
                <p
                    class="text-xs font-medium text-blue-200 uppercase tracking-wider"
                >
                    Margin
                </p>
                <p class="text-2xl font-bold mt-1 text-white">
                    {salesSummary.profitMargin.toFixed(1)}%
                </p>
            </div>
        </div>
    </div>

    <!-- Filter Section -->
    <div class="flex flex-col md:flex-row gap-6 mt-6">
        <Card
            class="flex-1 border-0 shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl overflow-visible relative z-50"
        >
            <CardContent class="p-6">
                <div class="flex flex-col sm:flex-row gap-4 items-end">
                    <div class="grid gap-2 flex-1 w-full">
                        <Label
                            class="text-xs font-bold uppercase text-muted-foreground tracking-wider"
                            >Mulai Tanggal</Label
                        >
                        <DateTimePicker
                            showTime={false}
                            bind:value={startDate}
                        />
                    </div>
                    <div class="grid gap-2 flex-1 w-full">
                        <Label
                            class="text-xs font-bold uppercase text-muted-foreground tracking-wider"
                            >Sampai Tanggal</Label
                        >
                        <DateTimePicker showTime={false} bind:value={endDate} />
                    </div>
                    <Button
                        disabled={isLoading}
                        size="lg"
                        class="w-full sm:w-auto h-11 shadow-md hover:shadow-lg transition-all"
                    >
                        <Filter class="mr-2 h-4 w-4" />
                        {isLoading ? "Mengambil Data..." : "Terapkan Filter"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>

    <!-- Main Content Tabs -->
    <Tabs bind:value={activeTab} class="space-y-8">
        <div class="overflow-x-auto pb-2 scrollbar-hide">
            <TabsList
                class="inline-flex h-12 items-center justify-start rounded-xl bg-muted/50 p-1 w-full md:w-auto"
            >
                <TabsTrigger
                    value="sales"
                    class="rounded-lg px-4 h-10 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all hover:text-blue-600"
                >
                    <TrendingUp class="h-4 w-4 mr-2" />
                    Penjualan
                </TabsTrigger>
                <TabsTrigger
                    value="profit-loss"
                    class="rounded-lg px-4 h-10 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all hover:text-blue-600"
                >
                    <Wallet class="h-4 w-4 mr-2" />
                    Laba Rugi
                </TabsTrigger>
                <TabsTrigger
                    value="services"
                    class="rounded-lg px-4 h-10 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all hover:text-blue-600"
                >
                    <Wrench class="h-4 w-4 mr-2" />
                    Service
                </TabsTrigger>
                <TabsTrigger
                    value="purchases"
                    class="rounded-lg px-4 h-10 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all hover:text-blue-600"
                >
                    <ShoppingCart class="h-4 w-4 mr-2" />
                    Pembelian
                </TabsTrigger>
                <TabsTrigger
                    value="technicians"
                    class="rounded-lg px-4 h-10 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all hover:text-blue-600"
                >
                    <Users class="h-4 w-4 mr-2" />
                    Teknisi
                </TabsTrigger>
                <TabsTrigger
                    value="parts"
                    class="rounded-lg px-4 h-10 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all hover:text-blue-600"
                >
                    <ClipboardList class="h-4 w-4 mr-2" />
                    Sparepart
                </TabsTrigger>
                <TabsTrigger
                    value="stock"
                    class="rounded-lg px-4 h-10 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all hover:text-blue-600"
                >
                    <Package class="h-4 w-4 mr-2" />
                    Stok
                </TabsTrigger>
                {#if accountingMode === "professional"}
                    <TabsTrigger
                        value="accounting"
                        class="rounded-lg px-4 h-10 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm transition-all hover:text-purple-600 border border-purple-200 bg-purple-50/50"
                    >
                        <Calculator class="h-4 w-4 mr-2" />
                        Akuntansi
                    </TabsTrigger>
                {/if}
            </TabsList>
        </div>

        <!-- Sales Tab -->
        <TabsContent
            value="sales"
            class="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500"
        >
            <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <!-- Trend Chart -->
                <Card
                    class="lg:col-span-4 border-0 shadow-lg bg-white/50 backdrop-blur-xl"
                >
                    <CardHeader>
                        <CardTitle class="flex items-center gap-2">
                            <BarChart3 class="h-5 w-5 text-blue-600" />
                            Tren Penjualan
                        </CardTitle>
                        <CardDescription
                            >Grafik pendapatan harian dalam periode terpilih</CardDescription
                        >
                    </CardHeader>
                    <CardContent class="pl-0">
                        <SalesTrendChart data={salesTrendData} />
                    </CardContent>
                </Card>

                <!-- Summary Cards -->
                <div class="lg:col-span-3 space-y-6">
                    <Card class="border-l-4 border-l-blue-500 shadow-md">
                        <CardHeader class="pb-2">
                            <CardTitle
                                class="text-sm font-medium text-muted-foreground uppercase tracking-wider"
                                >Total Penjualan</CardTitle
                            >
                        </CardHeader>
                        <CardContent>
                            <div class="text-3xl font-bold">
                                {formatCurrency(salesSummary.totalRevenue)}
                            </div>
                            <p class="text-sm text-muted-foreground mt-1">
                                {salesSummary.totalTransactions} transaksi berhasil
                            </p>
                        </CardContent>
                    </Card>
                    <Card class="border-l-4 border-l-orange-500 shadow-md">
                        <CardHeader class="pb-2">
                            <CardTitle
                                class="text-sm font-medium text-muted-foreground uppercase tracking-wider"
                                >Total Modal (HPP)</CardTitle
                            >
                        </CardHeader>
                        <CardContent>
                            <div class="text-3xl font-bold">
                                {formatCurrency(salesSummary.totalHPP)}
                            </div>
                            <p class="text-sm text-muted-foreground mt-1">
                                Cost of Goods Sold
                            </p>
                        </CardContent>
                    </Card>
                    <Card
                        class="border-l-4 border-l-green-500 shadow-md bg-green-50/30 dark:bg-green-900/10"
                    >
                        <CardHeader class="pb-2">
                            <CardTitle
                                class="text-sm font-medium text-green-600 dark:text-green-400 uppercase tracking-wider"
                                >Keuntungan Bersih</CardTitle
                            >
                        </CardHeader>
                        <CardContent>
                            <div
                                class="text-3xl font-bold text-green-600 dark:text-green-400"
                            >
                                {formatCurrency(salesSummary.totalProfit)}
                            </div>
                            <p
                                class="text-sm font-medium text-green-600/80 dark:text-green-400/80 mt-1"
                            >
                                Margin: {salesSummary.profitMargin.toFixed(1)}%
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <!-- Transactions Table -->
            <Card class="border-0 shadow-lg overflow-hidden">
                <CardHeader class="bg-muted/30">
                    <CardTitle>Rincian Transaksi</CardTitle>
                    <CardDescription>Detail per nota penjualan</CardDescription>
                </CardHeader>
                <CardContent class="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow class="hover:bg-transparent">
                                <TableHead class="pl-6">Tanggal</TableHead>
                                <TableHead>No. Nota</TableHead>
                                <TableHead class="text-center">Items</TableHead>
                                <TableHead class="text-right">Total</TableHead>
                                <TableHead class="text-right">HPP</TableHead>
                                <TableHead
                                    class="text-right pr-6 font-bold text-green-600"
                                    >Profit</TableHead
                                >
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each salesTransactions as t}
                                <TableRow class="hover:bg-muted/50">
                                    <TableCell
                                        class="pl-6 font-medium text-muted-foreground"
                                        >{formatDate(t.date)}</TableCell
                                    >
                                    <TableCell
                                        class="font-semibold text-primary"
                                        >{t.nota}</TableCell
                                    >
                                    <TableCell class="text-center"
                                        ><Badge
                                            variant="outline"
                                            class="font-normal">{t.items}</Badge
                                        ></TableCell
                                    >
                                    <TableCell class="text-right font-medium"
                                        >{formatCurrency(t.total)}</TableCell
                                    >
                                    <TableCell
                                        class="text-right text-muted-foreground"
                                        >{formatCurrency(t.hpp)}</TableCell
                                    >
                                    <TableCell
                                        class="text-right pr-6 font-bold text-green-600"
                                        >+{formatCurrency(t.profit)}</TableCell
                                    >
                                </TableRow>
                            {/each}
                            {#if salesTransactions.length === 0}
                                <TableRow>
                                    <TableCell
                                        colspan={6}
                                        class="text-center py-12 text-muted-foreground"
                                        >Tidak ada transaksi ditemukan</TableCell
                                    >
                                </TableRow>
                            {/if}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <!-- Profit Loss Tab -->
        <TabsContent
            value="profit-loss"
            class="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500"
        >
            <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div class="lg:col-span-3 space-y-6">
                    <Card
                        class="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-950"
                    >
                        <CardHeader>
                            <CardTitle>Rangkuman Keuangan</CardTitle>
                            <CardDescription
                                >Laporan Laba Rugi Bersih</CardDescription
                            >
                        </CardHeader>
                        <CardContent class="space-y-6">
                            {#if profitLoss}
                                <!-- Revenue Section -->
                                <div class="space-y-2">
                                    <div
                                        class="flex justify-between items-center text-sm"
                                    >
                                        <span
                                            class="text-muted-foreground uppercase tracking-wider font-semibold text-xs"
                                            >Pendapatan</span
                                        >
                                    </div>
                                    <div
                                        class="flex justify-between items-center p-3 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30"
                                    >
                                        <span
                                            class="font-medium text-green-800 dark:text-green-300"
                                            >Total Pendapatan</span
                                        >
                                        <span
                                            class="font-bold text-green-700 dark:text-green-400"
                                            >{formatCurrency(
                                                profitLoss.revenue.total,
                                            )}</span
                                        >
                                    </div>
                                    <div
                                        class="pl-4 space-y-1 text-sm text-muted-foreground"
                                    >
                                        <div class="flex justify-between">
                                            <span>Penjualan Toko</span>
                                            <span
                                                >{formatCurrency(
                                                    profitLoss.revenue.sales,
                                                )}</span
                                            >
                                        </div>
                                        <div class="flex justify-between">
                                            <span>Jasa Service</span>
                                            <span
                                                >{formatCurrency(
                                                    profitLoss.revenue.services,
                                                )}</span
                                            >
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <!-- Expenses Section -->
                                <div class="space-y-2">
                                    <div
                                        class="flex justify-between items-center text-sm"
                                    >
                                        <span
                                            class="text-muted-foreground uppercase tracking-wider font-semibold text-xs"
                                            >Pengeluaran & HPP</span
                                        >
                                    </div>
                                    <div
                                        class="flex justify-between items-center p-3 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30"
                                    >
                                        <span
                                            class="font-medium text-red-800 dark:text-red-300"
                                            >Total Biaya</span
                                        >
                                        <span
                                            class="font-bold text-red-700 dark:text-red-400"
                                            >({formatCurrency(
                                                profitLoss.cogs.total +
                                                    profitLoss.expenses.total,
                                            )})</span
                                        >
                                    </div>
                                </div>

                                <Separator />

                                <!-- Net Profit -->
                                <div class="pt-2">
                                    <div
                                        class="flex flex-col items-center justify-center p-6 rounded-2xl bg-primary/5 border-2 border-primary/20"
                                    >
                                        <span
                                            class="text-sm font-bold uppercase tracking-widest text-primary mb-2"
                                            >Laba Bersih</span
                                        >
                                        <span
                                            class="text-4xl font-black text-primary tracking-tight"
                                            >{formatCurrency(
                                                profitLoss.netProfit,
                                            )}</span
                                        >
                                    </div>
                                </div>
                            {:else}
                                <div
                                    class="h-40 flex items-center justify-center text-muted-foreground"
                                >
                                    Memuat data...
                                </div>
                            {/if}
                        </CardContent>
                    </Card>
                </div>

                <!-- Chart -->
                <div class="lg:col-span-4">
                    <Card class="h-full border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>Analisis Biaya & Profit</CardTitle>
                            <CardDescription
                                >Visualisasi komponen keuangan</CardDescription
                            >
                        </CardHeader>
                        <CardContent>
                            <ProfitCostChart data={profitCostData} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TabsContent>

        <!-- Services Tab -->
        <TabsContent
            value="services"
            class="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500"
        >
            <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card class="lg:col-span-1 border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle class="flex items-center gap-2">
                            <PieChart class="h-5 w-5 text-blue-600" />
                            Status Service
                        </CardTitle>
                        <CardDescription
                            >Distribusi status pengerjaan</CardDescription
                        >
                    </CardHeader>
                    <CardContent>
                        <ServiceStatusChart data={serviceStatusData} />
                    </CardContent>
                </Card>

                <div class="lg:col-span-2 grid gap-6 md:grid-cols-2">
                    <Card class="border-l-4 border-l-purple-500 shadow-md">
                        <CardHeader>
                            <CardTitle
                                class="text-sm font-medium uppercase tracking-wider text-muted-foreground"
                                >Total Service Masuk</CardTitle
                            >
                        </CardHeader>
                        <CardContent>
                            <div class="text-4xl font-bold">
                                {servicesStats.total}
                            </div>
                            <p class="text-sm text-muted-foreground mt-2">
                                Unit device diterima
                            </p>
                        </CardContent>
                    </Card>
                    <Card
                        class="border-l-4 border-l-green-500 shadow-md bg-green-50/20"
                    >
                        <CardHeader>
                            <CardTitle
                                class="text-sm font-medium uppercase tracking-wider text-green-700"
                                >Pendapatan Service</CardTitle
                            >
                        </CardHeader>
                        <CardContent>
                            <div class="text-4xl font-bold text-green-700">
                                {formatCurrency(servicesStats.revenue)}
                            </div>
                            <p class="text-sm text-green-600/80 mt-2">
                                Dari service selesai
                            </p>
                        </CardContent>
                    </Card>
                    <Card class="col-span-2 border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>Statistik Pengerjaan</CardTitle>
                        </CardHeader>
                        <CardContent class="grid grid-cols-2 gap-4">
                            <div class="p-4 rounded-xl bg-muted/50">
                                <span class="text-sm text-muted-foreground"
                                    >Selesai / Diambil</span
                                >
                                <div class="text-2xl font-bold mt-1">
                                    {servicesStats.completed}
                                </div>
                            </div>
                            <div class="p-4 rounded-xl bg-muted/50">
                                <span class="text-sm text-muted-foreground"
                                    >Completion Rate</span
                                >
                                <div class="text-2xl font-bold mt-1">
                                    {servicesStats.total > 0
                                        ? calculateStatusPercentage(
                                              servicesStats.completed,
                                              servicesStats.total,
                                          )
                                        : 0}%
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card class="border-0 shadow-lg overflow-hidden">
                <CardHeader class="bg-muted/30">
                    <CardTitle>Riwayat Service</CardTitle>
                    <CardDescription
                        >Daftar transaksi service terbaru</CardDescription
                    >
                </CardHeader>
                <CardContent class="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow class="hover:bg-transparent">
                                <TableHead class="pl-6">Tanggal</TableHead>
                                <TableHead>No. Service</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Device</TableHead>
                                <TableHead class="text-center">Status</TableHead
                                >
                                <TableHead class="text-right pr-6"
                                    >Biaya</TableHead
                                >
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each servicesTransactions as s}
                                <TableRow class="hover:bg-muted/50">
                                    <TableCell
                                        class="pl-6 text-muted-foreground"
                                        >{formatDate(s.date)}</TableCell
                                    >
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
                                            class="shadow-sm"
                                        >
                                            {getStatusLabel(s.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell
                                        class="text-right pr-6 font-medium"
                                    >
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
                                        class="text-center py-12 text-muted-foreground"
                                        >Tidak ada service dalam periode ini</TableCell
                                    >
                                </TableRow>
                            {/if}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <!-- Other Contents (Technician, Parts, Stock) - Keeping them functional but styled -->
        <!-- Technicians -->
        <TabsContent
            value="technicians"
            class="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500"
        >
            <Card class="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle>Kinerja Teknisi</CardTitle>
                    <CardDescription
                        >Performansi dan kontribusi revenue</CardDescription
                    >
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
                                <TableHead class="text-center">Rate</TableHead>
                                <TableHead class="text-right"
                                    >Pendapatan</TableHead
                                >
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each technicians as t}
                                <TableRow>
                                    <TableCell>
                                        <div class="flex items-center gap-3">
                                            <div
                                                class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold"
                                            >
                                                {t.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span class="font-medium"
                                                >{t.name}</span
                                            >
                                        </div>
                                    </TableCell>
                                    <TableCell class="text-center"
                                        ><Badge variant="outline"
                                            >{t.totalServices}</Badge
                                        ></TableCell
                                    >
                                    <TableCell
                                        class="text-center text-green-600 font-bold"
                                        >{t.completed}</TableCell
                                    >
                                    <TableCell class="text-center">
                                        <div
                                            class="flex items-center gap-2 justify-center"
                                        >
                                            <div
                                                class="w-16 bg-muted rounded-full h-1.5 overflow-hidden"
                                            >
                                                <div
                                                    class="h-full bg-green-500"
                                                    style="width: {t.completionRate}%"
                                                ></div>
                                            </div>
                                            <span class="text-xs"
                                                >{t.completionRate}%</span
                                            >
                                        </div>
                                    </TableCell>
                                    <TableCell
                                        class="text-right font-medium text-green-600"
                                        >{formatCurrency(t.revenue)}</TableCell
                                    >
                                </TableRow>
                            {/each}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <!-- Keep other tabs simple but wrapped in the new container style if needed or just leave as is but ensure they don't break -->
        <!-- I'll implement Parts and Stock similarly to ensure consistency -->

        <TabsContent
            value="parts"
            class="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500"
        >
            <Card class="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle>Penggunaan Sparepart</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Sparepart</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead class="text-right">Qty</TableHead>
                                <TableHead class="text-right"
                                    >Subtotal</TableHead
                                >
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each partsUsage as p}
                                <TableRow>
                                    <TableCell>{formatDate(p.date)}</TableCell>
                                    <TableCell>
                                        <div class="flex flex-col">
                                            <span class="font-medium"
                                                >{p.partName}</span
                                            >
                                            <span
                                                class="text-xs text-muted-foreground"
                                                >{p.variant || "-"}</span
                                            >
                                        </div>
                                    </TableCell>
                                    <TableCell
                                        ><Badge variant="outline"
                                            >{p.source}</Badge
                                        ></TableCell
                                    >
                                    <TableCell class="text-right"
                                        >{p.qty}</TableCell
                                    >
                                    <TableCell class="text-right font-medium"
                                        >{formatCurrency(p.subtotal)}</TableCell
                                    >
                                </TableRow>
                            {/each}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent
            value="purchases"
            class="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500"
        >
            <div class="grid gap-6 md:grid-cols-3">
                <Card class="shadow-md">
                    <CardHeader class="pb-2"
                        ><CardTitle
                            class="text-sm uppercase text-muted-foreground"
                            >Total Pembelian</CardTitle
                        ></CardHeader
                    >
                    <CardContent
                        ><div class="text-2xl font-bold">
                            {formatCurrency(purchasesSummary.totalAmount)}
                        </div></CardContent
                    >
                </Card>
                <Card class="shadow-md">
                    <CardHeader class="pb-2"
                        ><CardTitle
                            class="text-sm uppercase text-muted-foreground"
                            >Transaksi</CardTitle
                        ></CardHeader
                    >
                    <CardContent
                        ><div class="text-2xl font-bold">
                            {purchasesSummary.totalTransactions}
                        </div></CardContent
                    >
                </Card>
                <Card class="shadow-md">
                    <CardHeader class="pb-2"
                        ><CardTitle
                            class="text-sm uppercase text-muted-foreground"
                            >Item Masuk</CardTitle
                        ></CardHeader
                    >
                    <CardContent
                        ><div class="text-2xl font-bold">
                            {purchasesSummary.totalItems}
                        </div></CardContent
                    >
                </Card>
            </div>
            <Card class="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle>Riwayat Pembelian</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead class="text-center">Items</TableHead>
                                <TableHead class="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each purchasesTransactions as p}
                                <TableRow>
                                    <TableCell>{formatDate(p.date)}</TableCell>
                                    <TableCell
                                        >{p.supplierName || "-"}</TableCell
                                    >
                                    <TableCell class="text-center"
                                        >{p.items}</TableCell
                                    >
                                    <TableCell class="text-right font-medium"
                                        >{formatCurrency(
                                            p.totalAmount,
                                        )}</TableCell
                                    >
                                </TableRow>
                            {/each}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent
            value="stock"
            class="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500"
        >
            {#if stockValue}
                <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card
                        class="bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30"
                    >
                        <CardHeader class="pb-2"
                            ><CardTitle
                                class="text-xs uppercase text-blue-600 font-bold tracking-wider"
                                >Nilai Aset (HPP)</CardTitle
                            ></CardHeader
                        >
                        <CardContent
                            ><div
                                class="text-2xl font-bold text-blue-700 dark:text-blue-400"
                            >
                                {formatCurrency(stockValue.totalValueHPP)}
                            </div></CardContent
                        >
                    </Card>
                    <Card
                        class="bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30"
                    >
                        <CardHeader class="pb-2"
                            ><CardTitle
                                class="text-xs uppercase text-green-600 font-bold tracking-wider"
                                >Potensi Omzet</CardTitle
                            ></CardHeader
                        >
                        <CardContent
                            ><div
                                class="text-2xl font-bold text-green-700 dark:text-green-400"
                            >
                                {formatCurrency(stockValue.totalValueSell)}
                            </div></CardContent
                        >
                    </Card>
                    <Card>
                        <CardHeader class="pb-2"
                            ><CardTitle
                                class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                                >Total Item</CardTitle
                            ></CardHeader
                        >
                        <CardContent
                            ><div class="text-2xl font-bold">
                                {stockValue.totalItems}
                            </div></CardContent
                        >
                    </Card>
                    <Card>
                        <CardHeader class="pb-2"
                            ><CardTitle
                                class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                                >Total Stok Qty</CardTitle
                            ></CardHeader
                        >
                        <CardContent
                            ><div class="text-2xl font-bold">
                                {stockValue.totalStock}
                            </div></CardContent
                        >
                    </Card>
                </div>

                <Card class="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle>Stok per Kategori</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead class="text-center"
                                        >Jml Stok</TableHead
                                    >
                                    <TableHead class="text-right"
                                        >Nilai Aset</TableHead
                                    >
                                    <TableHead class="text-right">%</TableHead>
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
                                        <TableCell
                                            class="text-right font-medium"
                                            >{formatCurrency(
                                                c.value,
                                            )}</TableCell
                                        >
                                        <TableCell
                                            class="text-right text-muted-foreground"
                                            >{Math.round(
                                                (c.value /
                                                    stockValue.totalValueHPP) *
                                                    100,
                                            )}%</TableCell
                                        >
                                    </TableRow>
                                {/each}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            {/if}
        </TabsContent>

        <!-- Akuntansi Tab (Pro Mode Only) -->
        {#if accountingMode === "professional"}
            <TabsContent
                value="accounting"
                class="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500"
            >
                <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <!-- Quick Links Card -->
                    <Card
                        class="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20"
                    >
                        <CardHeader>
                            <CardTitle
                                class="flex items-center gap-2 text-purple-700 dark:text-purple-300"
                            >
                                <Calculator class="h-5 w-5" />
                                Modul Akuntansi
                            </CardTitle>
                            <CardDescription
                                >Akses fitur akuntansi profesional</CardDescription
                            >
                        </CardHeader>
                        <CardContent class="space-y-3">
                            <a
                                href="/accounting/accounts"
                                class="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 transition-all border border-purple-100 dark:border-purple-800"
                            >
                                <div
                                    class="p-2 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300"
                                >
                                    <ClipboardList class="h-4 w-4" />
                                </div>
                                <div>
                                    <p class="font-semibold text-sm">
                                        Chart of Accounts
                                    </p>
                                    <p class="text-xs text-muted-foreground">
                                        Kelola daftar akun
                                    </p>
                                </div>
                            </a>
                            <a
                                href="/accounting/journals"
                                class="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 transition-all border border-purple-100 dark:border-purple-800"
                            >
                                <div
                                    class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                                >
                                    <Briefcase class="h-4 w-4" />
                                </div>
                                <div>
                                    <p class="font-semibold text-sm">
                                        Jurnal Umum
                                    </p>
                                    <p class="text-xs text-muted-foreground">
                                        Lihat entri jurnal
                                    </p>
                                </div>
                            </a>
                            <a
                                href="/accounting/assets"
                                class="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 transition-all border border-purple-100 dark:border-purple-800"
                            >
                                <div
                                    class="p-2 rounded-lg bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300"
                                >
                                    <Package class="h-4 w-4" />
                                </div>
                                <div>
                                    <p class="font-semibold text-sm">
                                        Aset Tetap
                                    </p>
                                    <p class="text-xs text-muted-foreground">
                                        Kelola & penyusutan
                                    </p>
                                </div>
                            </a>
                            <a
                                href="/settings/accounting"
                                class="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 transition-all border border-purple-100 dark:border-purple-800"
                            >
                                <div
                                    class="p-2 rounded-lg bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300"
                                >
                                    <DollarSign class="h-4 w-4" />
                                </div>
                                <div>
                                    <p class="font-semibold text-sm">
                                        Mapping Akun
                                    </p>
                                    <p class="text-xs text-muted-foreground">
                                        Konfigurasi akun default
                                    </p>
                                </div>
                            </a>
                        </CardContent>
                    </Card>

                    <!-- P&L Summary Card (Pro) -->
                    <div class="lg:col-span-2">
                        <ProfitLossTree
                            {profitLoss}
                            accountTree={accountTreeQuery.data || []}
                            mappingSettings={mappingSettingsQuery.data || null}
                        />
                    </div>
                </div>

                <!-- Previous Summary Cards (Optional to keep for quick view) or replace entirely -->
                <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card class="lg:col-span-3 border-0 shadow-lg hidden">
                        <!-- Hiding old one -->
                        <CardHeader>
                            <CardTitle class="flex items-center gap-2">
                                <Wallet class="h-5 w-5 text-green-600" />
                                Ringkasan Laba Rugi (Pro)
                            </CardTitle>
                            <CardDescription
                                >Laporan lengkap dengan breakdown kategori</CardDescription
                            >
                        </CardHeader>
                        <CardContent>
                            {#if profitLoss}
                                <div class="grid grid-cols-3 gap-4">
                                    <div
                                        class="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800"
                                    >
                                        <p
                                            class="text-xs font-medium text-green-600 uppercase tracking-wider"
                                        >
                                            Pendapatan
                                        </p>
                                        <p
                                            class="text-xl font-bold text-green-700 dark:text-green-400 mt-1"
                                        >
                                            {formatCurrency(
                                                profitLoss.revenue.total,
                                            )}
                                        </p>
                                        <div
                                            class="mt-2 text-xs text-green-600/70 space-y-0.5"
                                        >
                                            <p>
                                                Penjualan: {formatCurrency(
                                                    profitLoss.revenue.sales,
                                                )}
                                            </p>
                                            <p>
                                                Service: {formatCurrency(
                                                    profitLoss.revenue.services,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        class="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800"
                                    >
                                        <p
                                            class="text-xs font-medium text-orange-600 uppercase tracking-wider"
                                        >
                                            HPP
                                        </p>
                                        <p
                                            class="text-xl font-bold text-orange-700 dark:text-orange-400 mt-1"
                                        >
                                            {formatCurrency(
                                                profitLoss.cogs.total,
                                            )}
                                        </p>
                                        <div
                                            class="mt-2 text-xs text-orange-600/70 space-y-0.5"
                                        >
                                            <p>
                                                Penjualan: {formatCurrency(
                                                    profitLoss.cogs.sales,
                                                )}
                                            </p>
                                            <p>
                                                Service: {formatCurrency(
                                                    profitLoss.cogs.services,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        class="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800"
                                    >
                                        <p
                                            class="text-xs font-medium text-blue-600 uppercase tracking-wider"
                                        >
                                            Laba Bersih
                                        </p>
                                        <p
                                            class="text-xl font-bold {profitLoss.netProfit >=
                                            0
                                                ? 'text-green-600'
                                                : 'text-red-600'} mt-1"
                                        >
                                            {formatCurrency(
                                                profitLoss.netProfit,
                                            )}
                                        </p>
                                        <div
                                            class="mt-2 text-xs text-blue-600/70"
                                        >
                                            <p>
                                                Margin: {(
                                                    (profitLoss.netProfit /
                                                        profitLoss.revenue
                                                            .total) *
                                                    100
                                                ).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            {:else}
                                <p
                                    class="text-muted-foreground text-center py-8"
                                >
                                    Memuat data...
                                </p>
                            {/if}
                        </CardContent>
                    </Card>
                </div>

                <!-- Pro Mode Info Banner -->
                <Card
                    class="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/20"
                >
                    <CardContent class="py-4">
                        <div class="flex items-center gap-3">
                            <div
                                class="p-2 rounded-lg bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-300"
                            >
                                <Calculator class="h-5 w-5" />
                            </div>
                            <div class="flex-1">
                                <p
                                    class="font-semibold text-sm text-purple-800 dark:text-purple-200"
                                >
                                    Mode Profesional Aktif
                                </p>
                                <p
                                    class="text-xs text-purple-600/70 dark:text-purple-300/70"
                                >
                                    Anda memiliki akses ke fitur akuntansi
                                    lengkap. Gunakan menu Akuntansi di sidebar
                                    untuk mengakses Chart of Accounts, Jurnal,
                                    dan Laporan Neraca.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        {/if}
    </Tabs>
</div>
