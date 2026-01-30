<script lang="ts">
    import { onMount } from "svelte";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
        CardDescription,
    } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import {
        Target,
        Wallet,
        TrendingUp,
        Calculator,
        Landmark,
        ClipboardList,
        ArrowRight,
        AlertCircle,
        CheckCircle2,
        Clock,
        FileText,
        Settings,
        Loader2,
    } from "lucide-svelte";
    import { api } from "$lib/api";

    let loading = $state(true);
    let dashboard = $state<any>(null);
    let error = $state<string | null>(null);

    async function fetchDashboard() {
        try {
            loading = true;
            error = null;
            const res = await api.get("/accounting/dashboard");
            dashboard = res.data;
        } catch (e: any) {
            console.error("Failed to fetch accounting dashboard", e);
            error =
                e.response?.data?.error || e.message || "Failed to load data";
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        fetchDashboard();
        const interval = setInterval(fetchDashboard, 60000);
        return () => clearInterval(interval);
    });

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);

    let progressColor = $derived.by(() => {
        if (!dashboard?.todayProgress) return "bg-slate-400";
        const pct = dashboard.todayProgress.progressPercent || 0;
        if (pct >= 100) return "bg-green-500";
        if (pct >= 70) return "bg-blue-500";
        if (pct >= 40) return "bg-yellow-500";
        return "bg-red-500";
    });

    let netIncome = $derived(
        (dashboard?.balanceSummary?.REVENUE?.total || 0) -
            (dashboard?.balanceSummary?.EXPENSE?.total || 0),
    );
    let expenseRatio = $derived(
        dashboard?.balanceSummary?.REVENUE?.total > 0
            ? (dashboard?.balanceSummary?.EXPENSE?.total /
                  dashboard?.balanceSummary?.REVENUE?.total) *
                  100
            : 0,
    );

    // Find depreciation expense account
    let deprExpense = $derived(
        dashboard?.balanceSummary?.EXPENSE?.accounts?.find((a: any) =>
            a.name.toLowerCase().includes("penyusutan"),
        ),
    );
</script>

<div class="space-y-8 animate-in fade-in duration-500 pb-10">
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
        <div>
            <h1
                class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
                Akuntansi
            </h1>
            <p class="text-slate-500 mt-1">
                Dashboard keuangan dan target harian
            </p>
        </div>

        <div class="flex items-center gap-3">
            {#if loading}
                <div class="flex items-center text-sm text-muted-foreground">
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Memuat...
                </div>
            {/if}
            <Button variant="outline" href="/accounting/register" class="gap-2">
                <Wallet class="h-4 w-4" />
                Kas Harian
            </Button>
            <Button href="/accounting/accounts" class="gap-2">
                <Landmark class="h-4 w-4" />
                Chart of Accounts
            </Button>
        </div>
    </div>

    {#if error}
        <div
            class="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center gap-3"
        >
            <AlertCircle class="h-5 w-5" />
            <span class="font-medium">{error}</span>
        </div>
    {/if}

    <!-- Daily Target Progress -->
    {#if dashboard?.todayProgress?.hasTarget}
        <Card
            class="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden rounded-3xl"
        >
            <CardContent class="p-8">
                <div class="flex flex-col lg:flex-row justify-between gap-8">
                    <!-- Target Info -->
                    <div class="flex-1">
                        <div class="flex items-center gap-2 text-blue-200 mb-2">
                            <Target class="h-5 w-5" />
                            <span class="text-sm font-medium"
                                >Target Harian</span
                            >
                        </div>
                        <div class="text-4xl font-bold mb-1">
                            {formatCurrency(
                                dashboard.todayProgress.dailyTarget,
                            )}
                        </div>
                        <p class="text-blue-200 text-sm">
                            Break-even: {formatCurrency(
                                dashboard.todayProgress.dailyBreakeven,
                            )}
                        </p>

                        <!-- Progress Bar -->
                        <div class="mt-6 space-y-2">
                            <div class="flex justify-between text-sm">
                                <span>Progress Hari Ini</span>
                                <span class="font-bold"
                                    >{dashboard.todayProgress
                                        .progressPercent}%</span
                                >
                            </div>
                            <div
                                class="h-4 bg-white/20 rounded-full overflow-hidden"
                            >
                                <div
                                    class="h-full {progressColor} transition-all duration-500 rounded-full"
                                    style="width: {Math.min(
                                        dashboard.todayProgress.progressPercent,
                                        100,
                                    )}%"
                                ></div>
                            </div>
                        </div>
                    </div>

                    <!-- Today's Revenue -->
                    <div
                        class="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-6"
                    >
                        <p class="text-blue-200 text-sm mb-1">
                            Pendapatan Hari Ini
                        </p>
                        <div class="text-3xl font-bold mb-4">
                            {formatCurrency(
                                Number(dashboard.todayProgress.todayRevenue) ||
                                    0,
                            )}
                        </div>

                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div class="flex items-center gap-2">
                                {#if dashboard.todayProgress.isAboveBreakeven}
                                    <CheckCircle2
                                        class="h-4 w-4 text-green-300"
                                    />
                                    <span class="text-green-200"
                                        >Di atas BEP</span
                                    >
                                {:else}
                                    <AlertCircle
                                        class="h-4 w-4 text-yellow-300"
                                    />
                                    <span class="text-yellow-200"
                                        >Di bawah BEP</span
                                    >
                                {/if}
                            </div>
                            <div class="flex items-center gap-2">
                                <Clock class="h-4 w-4 text-blue-200" />
                                <span
                                    >Kurang: {formatCurrency(
                                        dashboard.todayProgress.remaining,
                                    )}</span
                                >
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    {/if}

    <!-- Quick Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Cash Register Status -->
        <Card class="border-0 shadow-lg rounded-3xl overflow-hidden">
            <CardContent class="p-6">
                <div class="flex items-start justify-between mb-4">
                    <div
                        class="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl"
                    >
                        <Wallet
                            class="h-6 w-6 text-green-600 dark:text-green-400"
                        />
                    </div>
                    {#if dashboard?.registerStatus?.isOpen}
                        <span
                            class="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full"
                            >BUKA</span
                        >
                    {:else}
                        <span
                            class="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full"
                            >TUTUP</span
                        >
                    {/if}
                </div>
                <p class="text-slate-500 text-sm">Kas Register</p>
                {#if dashboard?.registerStatus?.isOpen}
                    <p
                        class="text-2xl font-bold text-slate-900 dark:text-white mt-1"
                    >
                        {formatCurrency(
                            dashboard.registerStatus.expectedClosing || 0,
                        )}
                    </p>
                    <p class="text-xs text-slate-400 mt-1">
                        {dashboard.registerStatus.transactionCount || 0} transaksi
                    </p>
                {:else}
                    <p class="text-lg font-medium text-slate-500 mt-1">
                        Belum dibuka
                    </p>
                {/if}
            </CardContent>
        </Card>

        <!-- Total Assets -->
        <Card class="border-0 shadow-lg rounded-3xl overflow-hidden">
            <CardContent class="p-6">
                <div
                    class="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl w-fit mb-4"
                >
                    <TrendingUp
                        class="h-6 w-6 text-blue-600 dark:text-blue-400"
                    />
                </div>
                <p class="text-slate-500 text-sm">Total Aset</p>
                <p
                    class="text-2xl font-bold text-slate-900 dark:text-white mt-1"
                >
                    {formatCurrency(
                        dashboard?.balanceSummary?.ASSET?.total || 0,
                    )}
                </p>
            </CardContent>
        </Card>

        <!-- Total Liabilities -->
        <Card class="border-0 shadow-lg rounded-3xl overflow-hidden">
            <CardContent class="p-6">
                <div
                    class="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl w-fit mb-4"
                >
                    <Calculator
                        class="h-6 w-6 text-red-600 dark:text-red-400"
                    />
                </div>
                <p class="text-slate-500 text-sm">Total Kewajiban</p>
                <p
                    class="text-2xl font-bold text-slate-900 dark:text-white mt-1"
                >
                    {formatCurrency(
                        dashboard?.balanceSummary?.LIABILITY?.total || 0,
                    )}
                </p>
            </CardContent>
        </Card>

        <!-- Monthly Revenue -->
        <Card
            class="border-0 shadow-lg rounded-3xl overflow-hidden text-white bg-slate-900"
        >
            <CardContent class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="p-2.5 bg-white/10 rounded-xl">
                        <TrendingUp class="h-6 w-6 text-green-400" />
                    </div>
                    <span
                        class="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                        >Net Profit</span
                    >
                </div>
                <p class="text-slate-400 text-sm">Laba Bersih</p>
                <div class="flex items-baseline gap-2">
                    <p
                        class="text-2xl font-black italic mt-1 {netIncome >= 0
                            ? 'text-green-400'
                            : 'text-red-400'}"
                    >
                        {formatCurrency(netIncome)}
                    </p>
                </div>
            </CardContent>
        </Card>
    </div>

    <!-- Profit & Loss Breakdown Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
            class="lg:col-span-2 border-0 shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border-none"
        >
            <CardHeader class="pb-2">
                <div class="flex items-center justify-between">
                    <div>
                        <CardTitle class="text-xl font-bold"
                            >Ringkasan Laba Rugi</CardTitle
                        >
                        <CardDescription
                            >Performa keuangan berdasarkan Chart of Accounts</CardDescription
                        >
                    </div>
                    <div
                        class="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full"
                    >
                        <Calculator class="h-4 w-4 text-blue-600" />
                        <span class="text-xs font-bold text-blue-600"
                            >Calculated Real-time</span
                        >
                    </div>
                </div>
            </CardHeader>
            <CardContent class="p-6 pt-2">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <!-- Progress Stats -->
                    <div class="space-y-6">
                        <div class="space-y-2">
                            <div class="flex justify-between text-sm">
                                <span class="text-slate-500">Pendapatan</span>
                                <span
                                    class="font-bold text-slate-900 dark:text-white"
                                    >{formatCurrency(
                                        dashboard?.balanceSummary?.REVENUE
                                            ?.total || 0,
                                    )}</span
                                >
                            </div>
                            <div
                                class="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
                            >
                                <div
                                    class="h-full bg-green-500 rounded-full"
                                    style="width: 100%"
                                ></div>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <div class="flex justify-between text-sm">
                                <span class="text-slate-500"
                                    >Total Beban (Expenses)</span
                                >
                                <span
                                    class="font-bold text-slate-900 dark:text-white"
                                    >{formatCurrency(
                                        dashboard?.balanceSummary?.EXPENSE
                                            ?.total || 0,
                                    )}</span
                                >
                            </div>
                            <div
                                class="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
                            >
                                <div
                                    class="h-full bg-red-500 rounded-full"
                                    style="width: {Math.min(
                                        expenseRatio,
                                        100,
                                    )}%"
                                ></div>
                            </div>
                            <p
                                class="text-[10px] text-red-500 font-medium italic"
                            >
                                Memakan {expenseRatio.toFixed(1)}% dari
                                pendapatan Anda.
                            </p>
                        </div>
                    </div>

                    <!-- Highlights -->
                    <div
                        class="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-4"
                    >
                        <h4
                            class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                        >
                            Highlights
                        </h4>

                        {#if deprExpense}
                            <div
                                class="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800"
                            >
                                <div class="flex items-center gap-3">
                                    <div
                                        class="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                                    >
                                        <Clock
                                            class="h-4 w-4 text-orange-600"
                                        />
                                    </div>
                                    <div>
                                        <p
                                            class="text-[11px] font-bold text-slate-900 dark:text-white line-clamp-1"
                                        >
                                            {deprExpense.name}
                                        </p>
                                        <p class="text-[10px] text-slate-500">
                                            Beban Non-Tunai
                                        </p>
                                    </div>
                                </div>
                                <span class="text-xs font-black text-orange-600"
                                    >-{formatCurrency(
                                        deprExpense.balance,
                                    )}</span
                                >
                            </div>
                        {/if}

                        <div
                            class="flex items-center justify-between p-3 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30"
                        >
                            <div class="flex items-center gap-3">
                                <div
                                    class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg"
                                >
                                    <CheckCircle2
                                        class="h-4 w-4 text-green-600"
                                    />
                                </div>
                                <div>
                                    <p
                                        class="text-[11px] font-bold text-green-700 dark:text-green-400"
                                    >
                                        Profit Margin
                                    </p>
                                    <p
                                        class="text-[10px] text-green-600 opacity-70"
                                    >
                                        Efisiensi Bisnis
                                    </p>
                                </div>
                            </div>
                            <span
                                class="text-xs font-black text-green-700 dark:text-green-400"
                                >{(100 - expenseRatio).toFixed(1)}%</span
                            >
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- Dynamic Tip Card -->
        <Card
            class="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl overflow-hidden relative group"
        >
            <div
                class="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"
            ></div>
            <CardContent
                class="p-6 flex flex-col h-full justify-between relative z-10"
            >
                <div class="space-y-4">
                    <div class="p-3 bg-white/20 rounded-2xl w-fit">
                        <AlertCircle class="h-6 w-6 text-white" />
                    </div>
                    <h3 class="text-xl font-bold leading-tight">
                        Optimasi Laba & Pajak
                    </h3>
                    <p class="text-sm text-indigo-100 leading-relaxed">
                        Mencatat <strong>Penyusutan Aset</strong> secara rutin tidak
                        hanya memberikan gambaran laba yang jujur, tapi juga membantu
                        perencanaan penggantian alat di masa depan.
                    </p>
                </div>

                <Button
                    variant="outline"
                    href="/accounting/assets"
                    class="mt-6 bg-white/10 border-white/20 hover:bg-white/20 text-white rounded-xl border-none"
                >
                    Cek Aset & Penyusutan
                    <ArrowRight class="ml-2 h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    </div>

    <!-- Quick Links -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a href="/accounting/accounts" class="group">
            <Card
                class="border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl h-full"
            >
                <CardContent class="p-6 flex items-center gap-4">
                    <div
                        class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:bg-blue-200 transition-colors"
                    >
                        <Landmark class="h-6 w-6 text-blue-600" />
                    </div>
                    <div class="flex-1">
                        <h3
                            class="font-semibold text-slate-900 dark:text-white"
                        >
                            Chart of Accounts
                        </h3>
                        <p class="text-sm text-slate-500">Kelola daftar akun</p>
                    </div>
                    <ArrowRight
                        class="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform"
                    />
                </CardContent>
            </Card>
        </a>

        <a href="/accounting/assets" class="group">
            <Card
                class="border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl h-full"
            >
                <CardContent class="p-6 flex items-center gap-4">
                    <div
                        class="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl group-hover:bg-orange-200 transition-colors"
                    >
                        <Settings class="h-6 w-6 text-orange-600" />
                    </div>
                    <div class="flex-1">
                        <h3
                            class="font-semibold text-slate-900 dark:text-white"
                        >
                            Aset & Penyusutan
                        </h3>
                        <p class="text-sm text-slate-500">
                            Kelola aset tetap toko
                        </p>
                    </div>
                    <ArrowRight
                        class="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform"
                    />
                </CardContent>
            </Card>
        </a>

        <a href="/accounting/targets" class="group">
            <Card
                class="border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl h-full"
            >
                <CardContent class="p-6 flex items-center gap-4">
                    <div
                        class="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl group-hover:bg-green-200 transition-colors"
                    >
                        <Target class="h-6 w-6 text-green-600" />
                    </div>
                    <div class="flex-1">
                        <h3
                            class="font-semibold text-slate-900 dark:text-white"
                        >
                            Target Pendapatan
                        </h3>
                        <p class="text-sm text-slate-500">
                            Atur target bulanan
                        </p>
                    </div>
                    <ArrowRight
                        class="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform"
                    />
                </CardContent>
            </Card>
        </a>

        <a href="/accounting/journals" class="group">
            <Card
                class="border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl h-full"
            >
                <CardContent class="p-6 flex items-center gap-4">
                    <div
                        class="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl group-hover:bg-indigo-200 transition-colors"
                    >
                        <FileText class="h-6 w-6 text-indigo-600" />
                    </div>
                    <div class="flex-1">
                        <h3
                            class="font-semibold text-slate-900 dark:text-white"
                        >
                            Jurnal Umum
                        </h3>
                        <p class="text-sm text-slate-500">
                            Lihat transaksi jurnal
                        </p>
                    </div>
                    <ArrowRight
                        class="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform"
                    />
                </CardContent>
            </Card>
        </a>

        <a href="/accounting/payables" class="group">
            <Card
                class="border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl h-full"
            >
                <CardContent class="p-6 flex items-center gap-4">
                    <div
                        class="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl group-hover:bg-red-200 transition-colors"
                    >
                        <ClipboardList class="h-6 w-6 text-red-600" />
                    </div>
                    <div class="flex-1">
                        <h3
                            class="font-semibold text-slate-900 dark:text-white"
                        >
                            Hutang Supplier
                        </h3>
                        <p class="text-sm text-slate-500">Kelola pembayaran</p>
                    </div>
                    <ArrowRight
                        class="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform"
                    />
                </CardContent>
            </Card>
        </a>

        <a href="/accounting/audit-log" class="group">
            <Card
                class="border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl h-full"
            >
                <CardContent class="p-6 flex items-center gap-4">
                    <div
                        class="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-slate-200 transition-colors"
                    >
                        <ClipboardList class="h-6 w-6 text-slate-600" />
                    </div>
                    <div class="flex-1">
                        <h3
                            class="font-semibold text-slate-900 dark:text-white"
                        >
                            Audit Log
                        </h3>
                        <p class="text-sm text-slate-500">
                            Riwayat perubahan data
                        </p>
                    </div>
                    <ArrowRight
                        class="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform"
                    />
                </CardContent>
            </Card>
        </a>
    </div>
</div>
