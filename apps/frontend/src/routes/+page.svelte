<script lang="ts">
    import { onMount } from "svelte";
    import ScrollableCardList from "$lib/components/dashboard/ScrollableCardList.svelte";
    import RevenueChart from "$lib/components/dashboard/RevenueChart.svelte";
    import TopProductsChart from "$lib/components/dashboard/TopProductsChart.svelte";
    import ActivityLog from "$lib/components/dashboard/ActivityLog.svelte";
    import ServiceListCompact from "$lib/components/dashboard/ServiceListCompact.svelte";
    import TechnicianDashboard from "$lib/components/dashboard/TechnicianDashboard.svelte";
    import CashierDashboard from "$lib/components/dashboard/CashierDashboard.svelte";
    import ProfitLossSummary from "$lib/components/dashboard/ProfitLossSummary.svelte";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
        CardDescription,
    } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import {
        DollarSign,
        Wrench,
        CheckCircle2,
        AlertCircle,
        Package,
        Loader2,
        ShoppingCart,
        Plus,
        Search,
        Bell,
        Calendar,
        TrendingUp,
        ArrowUpRight,
        ArrowDownRight,
    } from "lucide-svelte";
    import { api } from "$lib/api";

    let loading = $state(true);
    let dashboardData = $state<any>(null);
    let activities = $state<any[]>([]);
    let recentServices = $state<any[]>([]);
    let urgentServices = $state<any[]>([]);
    let profitLossData = $state<any>(null);
    let error = $state<string | null>(null);
    let userRole = $state<string>("admin");
    let currentTime = $state(new Date());

    async function fetchData() {
        try {
            loading = true;
            error = null;
            // Use api.get which adds Authorization header automatically
            const [dashRes, actRes, recentRes, urgentRes, plRes] =
                await Promise.all([
                    api.get("/dashboard"),
                    api.get("/dashboard/activities", { params: { limit: 10 } }),
                    api.get("/dashboard/recent-services", {
                        params: { limit: 5 },
                    }),
                    api.get("/dashboard/urgent-services", {
                        params: { limit: 5 },
                    }),
                    api.get("/dashboard/profit-loss"),
                ]);

            dashboardData = dashRes.data.data;
            activities = actRes.data.data;
            recentServices = recentRes.data.data;
            urgentServices = urgentRes.data.data;
            profitLossData = plRes.data.data;
        } catch (e: any) {
            console.error("Failed to fetch dashboard data", e);
            error =
                e.response?.data?.message ||
                e.message ||
                "Failed to load dashboard data";
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        // Get user role from localStorage
        try {
            const u = JSON.parse(localStorage.getItem("user") || "{}");
            userRole = u.role || "admin";
        } catch {}

        // Timer for clock
        const timer = setInterval(() => {
            currentTime = new Date();
        }, 1000);

        // Only fetch admin dashboard data for admin role
        if (userRole === "admin") {
            fetchData();
            const interval = setInterval(fetchData, 300000);
            return () => {
                clearInterval(interval);
                clearInterval(timer);
            };
        }

        return () => clearInterval(timer);
    });

    let greeting = $derived.by(() => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    });

    // Formatting currency
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);
</script>

<div class="space-y-8 animate-in fade-in duration-700 pb-10">
    <!-- Header Section -->
    <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
        <div>
            <h1
                class="text-4xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
                {greeting}, <span class="text-blue-600">Admin</span>
            </h1>
            <p class="text-slate-500 mt-1 flex items-center gap-2">
                <Calendar class="h-4 w-4" />
                {currentTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })}
            </p>
        </div>

        <div class="flex items-center gap-3">
            {#if loading && userRole === "admin"}
                <div
                    class="flex items-center text-sm text-muted-foreground bg-white/50 px-3 py-1.5 rounded-full backdrop-blur-sm border"
                >
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Updating data...
                </div>
            {/if}
            <Button
                variant="outline"
                class="gap-2 border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white shadow-sm"
            >
                <Bell class="h-4 w-4 text-slate-600" />
                <span class="hidden sm:inline">Notifications</span>
            </Button>
            <Button
                class="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 text-white border-0"
            >
                <Plus class="h-4 w-4" />
                <span class="hidden sm:inline">New Transaction</span>
            </Button>
        </div>
    </div>

    {#if error && userRole === "admin"}
        <div
            class="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center gap-3"
        >
            <AlertCircle class="h-5 w-5" />
            <span class="font-medium">Error loading data: {error}</span>
        </div>
    {/if}

    <!-- Role-based Dashboard -->
    {#if userRole === "teknisi"}
        <TechnicianDashboard />
    {:else if userRole === "kasir"}
        <CashierDashboard />
    {:else}
        <!-- 1. Stats Overview (Glassmorphism Cards) -->
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Revenue Card -->
            <div
                class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 p-6 text-white shadow-xl shadow-blue-900/10 group hover:shadow-2xl hover:scale-[1.01] transition-all duration-300"
            >
                <div
                    class="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/20 blur-2xl"
                ></div>
                <div
                    class="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-black/10 blur-xl"
                ></div>

                <div class="relative z-10 flex flex-col justify-between h-full">
                    <div class="flex justify-between items-start">
                        <div
                            class="p-2.5 bg-white/20 backdrop-blur-md rounded-xl"
                        >
                            <DollarSign class="h-6 w-6 text-white" />
                        </div>
                        {#if dashboardData}
                            <div
                                class="flex items-center gap-1 text-xs font-medium bg-green-400/20 px-2 py-1 rounded-full text-green-100 border border-green-400/30"
                            >
                                <ArrowUpRight class="h-3 w-3" />
                                +12.5%
                            </div>
                        {/if}
                    </div>

                    <div class="mt-6">
                        <p
                            class="text-blue-100 font-medium text-sm tracking-wide"
                        >
                            Total Revenue (Today)
                        </p>
                        {#if dashboardData}
                            <h3 class="text-3xl font-bold mt-1 tracking-tight">
                                {formatCurrency(
                                    dashboardData.cards.revenueToday || 0,
                                )}
                            </h3>
                        {:else}
                            <div
                                class="h-9 w-32 bg-white/20 animate-pulse rounded mt-1"
                            ></div>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Active Services Card -->
            <div
                class="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-lg group hover:shadow-xl transition-all duration-300"
            >
                <div class="flex flex-col justify-between h-full">
                    <div class="flex justify-between items-start">
                        <div
                            class="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400"
                        >
                            <Wrench class="h-6 w-6" />
                        </div>
                    </div>

                    <div class="mt-6">
                        <p class="text-slate-500 font-medium text-sm">
                            Active Services
                        </p>
                        {#if dashboardData}
                            <div class="flex items-end gap-2 mt-1">
                                <h3
                                    class="text-3xl font-bold text-slate-900 dark:text-white"
                                >
                                    {dashboardData.cards.activeServices || 0}
                                </h3>
                                <span class="text-sm text-slate-400 mb-1"
                                    >units</span
                                >
                            </div>
                        {:else}
                            <div
                                class="h-9 w-20 bg-slate-100 animate-pulse rounded mt-1"
                            ></div>
                        {/if}
                    </div>
                    <div
                        class="absolute bottom-0 right-0 h-16 w-16 bg-gradient-to-tl from-orange-500/10 to-transparent rounded-tl-3xl"
                    ></div>
                </div>
            </div>

            <!-- Ready for Pickup Card -->
            <div
                class="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-lg group hover:shadow-xl transition-all duration-300"
            >
                <div class="flex flex-col justify-between h-full">
                    <div class="flex justify-between items-start">
                        <div
                            class="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400"
                        >
                            <CheckCircle2 class="h-6 w-6" />
                        </div>
                    </div>

                    <div class="mt-6">
                        <p class="text-slate-500 font-medium text-sm">
                            Ready to Pickup
                        </p>
                        {#if dashboardData}
                            <div class="flex items-end gap-2 mt-1">
                                <h3
                                    class="text-3xl font-bold text-slate-900 dark:text-white"
                                >
                                    {dashboardData.cards.readyPickup || 0}
                                </h3>
                                <span class="text-sm text-slate-400 mb-1"
                                    >units</span
                                >
                            </div>
                        {:else}
                            <div
                                class="h-9 w-20 bg-slate-100 animate-pulse rounded mt-1"
                            ></div>
                        {/if}
                    </div>
                    <div
                        class="absolute bottom-0 right-0 h-16 w-16 bg-gradient-to-tl from-purple-500/10 to-transparent rounded-tl-3xl"
                    ></div>
                </div>
            </div>

            <!-- Low Stock Card -->
            <div
                class="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-lg group hover:shadow-xl transition-all duration-300"
            >
                <div class="flex flex-col justify-between h-full">
                    <div class="flex justify-between items-start">
                        <div
                            class="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400"
                        >
                            <Package class="h-6 w-6" />
                        </div>
                        {#if dashboardData && dashboardData.cards.lowStock > 0}
                            <div
                                class="animate-pulse h-2 w-2 rounded-full bg-red-500"
                            ></div>
                        {/if}
                    </div>

                    <div class="mt-6">
                        <p class="text-slate-500 font-medium text-sm">
                            Low Stock Items
                        </p>
                        {#if dashboardData}
                            <div class="flex items-end gap-2 mt-1">
                                <h3
                                    class="text-3xl font-bold text-slate-900 dark:text-white"
                                >
                                    {dashboardData.cards.lowStock || 0}
                                </h3>
                                <span class="text-sm text-slate-400 mb-1"
                                    >items</span
                                >
                            </div>
                        {:else}
                            <div
                                class="h-9 w-20 bg-slate-100 animate-pulse rounded mt-1"
                            ></div>
                        {/if}
                    </div>
                    <div
                        class="absolute bottom-0 right-0 h-16 w-16 bg-gradient-to-tl from-red-500/10 to-transparent rounded-tl-3xl"
                    ></div>
                </div>
            </div>
        </section>

        <!-- 2. Main Content Grid -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <!-- Left Column: Charts -->
            <div class="xl:col-span-2 space-y-8">
                <!-- Revenue Chart -->
                <Card
                    class="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden rounded-3xl"
                >
                    <CardHeader class="border-b border-slate-100/50 pb-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <CardTitle class="text-lg font-bold"
                                    >Revenue Analytics</CardTitle
                                >
                                <CardDescription
                                    >Income trends from Sales & Services (Last 7
                                    Days)</CardDescription
                                >
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                class="rounded-full"
                            >
                                <TrendingUp class="h-4 w-4 text-slate-500" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent class="p-6">
                        {#if dashboardData && dashboardData.charts.revenueTrend}
                            <div class="h-[350px] w-full">
                                <RevenueChart
                                    data={dashboardData.charts.revenueTrend}
                                />
                            </div>
                        {:else if loading}
                            <div
                                class="h-[350px] w-full bg-slate-100 animate-pulse rounded-2xl"
                            ></div>
                        {/if}
                    </CardContent>
                </Card>

                <!-- Profit & Loss Summary (Integrated) -->
                <div>
                    <ProfitLossSummary
                        data={profitLossData}
                        isLoading={loading}
                    />
                </div>
            </div>

            <!-- Right Column: Lists & Side Widgets -->
            <div class="space-y-8">
                <!-- Top Products -->
                <Card
                    class="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl"
                >
                    <CardHeader class="border-b border-slate-100/50 pb-4">
                        <CardTitle class="text-lg font-bold"
                            >Top Selling Products</CardTitle
                        >
                        <CardDescription
                            >Best performing inventory items</CardDescription
                        >
                    </CardHeader>
                    <CardContent class="p-6">
                        {#if dashboardData && dashboardData.charts.topProducts}
                            <div class="h-[250px]">
                                <TopProductsChart
                                    data={dashboardData.charts.topProducts}
                                />
                            </div>
                        {:else if loading}
                            <div
                                class="h-[250px] w-full bg-slate-100 animate-pulse rounded-2xl"
                            ></div>
                        {/if}
                    </CardContent>
                </Card>

                <!-- Urgent Services -->
                <Card
                    class="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-slate-900 rounded-3xl overflow-hidden"
                >
                    <CardHeader class="pb-2">
                        <div class="flex items-center gap-2 text-orange-600">
                            <AlertCircle class="h-5 w-5" />
                            <CardTitle class="text-md font-bold"
                                >Urgent Attention</CardTitle
                            >
                        </div>
                        <CardDescription
                            >Services approaching deadline</CardDescription
                        >
                    </CardHeader>
                    <CardContent class="p-0">
                        <div class="px-6 pb-6">
                            <ServiceListCompact
                                services={urgentServices}
                                title=""
                                emptyMessage="No urgent services found"
                            />
                        </div>
                    </CardContent>
                </Card>

                <!-- Activity Stream -->
                <Card
                    class="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl"
                >
                    <CardHeader class="border-b border-slate-100/50 pb-4">
                        <CardTitle class="text-lg font-bold"
                            >Recent Activity</CardTitle
                        >
                    </CardHeader>
                    <CardContent
                        class="p-0 max-h-[400px] overflow-auto custom-scrollbar"
                    >
                        <ActivityLog {activities} />
                    </CardContent>
                </Card>
            </div>
        </div>

        <!-- Bottom Section: Recent Service List Full Width -->
        <Card class="border-0 shadow-lg bg-white dark:bg-slate-900 rounded-3xl">
            <CardHeader>
                <div class="flex items-center justify-between">
                    <div>
                        <CardTitle>Recent Services</CardTitle>
                        <CardDescription
                            >Latest service entries and updates</CardDescription
                        >
                    </div>
                    <Button
                        variant="outline"
                        href="/service"
                        size="sm"
                        class="rounded-full">View All</Button
                    >
                </div>
            </CardHeader>
            <CardContent>
                <ServiceListCompact
                    services={recentServices}
                    title=""
                    emptyMessage="No recent services"
                />
            </CardContent>
        </Card>
    {/if}
</div>

<style>
    /* Custom Scrollbar for activity log */
    :global(.custom-scrollbar::-webkit-scrollbar) {
        width: 6px;
    }
    :global(.custom-scrollbar::-webkit-scrollbar-track) {
        background: transparent;
    }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb) {
        background-color: rgba(0, 0, 0, 0.1);
        border-radius: 20px;
    }
</style>
