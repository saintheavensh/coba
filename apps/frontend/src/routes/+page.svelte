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
    import {
        DollarSign,
        Wrench,
        CheckCircle2,
        AlertCircle,
        Package,
        Loader2,
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

        // Only fetch admin dashboard data for admin role
        if (userRole === "admin") {
            fetchData();
            const interval = setInterval(fetchData, 300000);
            return () => clearInterval(interval);
        }
    });

    let stats = $derived(
        dashboardData
            ? [
                  {
                      label: "Omset Hari Ini",
                      value: `Rp ${(dashboardData.cards.revenueToday || 0).toLocaleString("id-ID")}`,
                      subtext: "Total pendapatan hari ini",
                      icon: DollarSign,
                      color: "border-l-green-500 text-green-600",
                  },
                  {
                      label: "Service Aktif",
                      value: dashboardData.cards.activeServices || 0,
                      subtext: "Unit sedang dikerjakan",
                      icon: Wrench,
                      color: "border-l-blue-500 text-blue-600",
                  },
                  {
                      label: "Siap Diambil",
                      value: dashboardData.cards.readyPickup || 0,
                      subtext: "Menunggu pengambilan",
                      icon: CheckCircle2,
                      color: "border-l-indigo-500 text-indigo-600",
                  },
                  {
                      label: "Stok Menipis",
                      value: dashboardData.cards.lowStock || 0,
                      subtext: "Perlu restock segera",
                      icon: Package,
                      color: "border-l-orange-500 text-orange-600",
                  },
              ]
            : [],
    );
</script>

<div class="flex flex-col gap-6 p-2 md:p-0 animate-in fade-in duration-500">
    <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
        {#if loading && userRole === "admin"}
            <div class="flex items-center text-sm text-muted-foreground">
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                Updating...
            </div>
        {/if}
    </div>

    {#if error && userRole === "admin"}
        <div
            class="p-4 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20"
        >
            Error: {error}
        </div>
    {/if}

    <!-- Role-based Dashboard -->
    {#if userRole === "teknisi"}
        <TechnicianDashboard />
    {:else if userRole === "kasir"}
        <CashierDashboard />
    {:else}
        <!-- 1. Summary Cards -->
        <section>
            {#if dashboardData}
                <ScrollableCardList {stats} />
            {:else if loading}
                <div
                    class="h-32 w-full bg-muted/20 animate-pulse rounded-lg"
                ></div>
            {/if}
        </section>

        <!-- 1.5 Profit & Loss Analytics -->
        <section>
            <ProfitLossSummary data={profitLossData} isLoading={loading} />
        </section>

        <!-- 2. Charts Section -->
        <div class="grid gap-6 md:grid-cols-7">
            <!-- Revenue Trend (Main) -->
            <Card class="col-span-1 md:col-span-4 shadow-sm">
                <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription
                        >Last 7 days income from Sales & Services</CardDescription
                    >
                </CardHeader>
                <CardContent class="pl-2">
                    {#if dashboardData && dashboardData.charts.revenueTrend}
                        <RevenueChart
                            data={dashboardData.charts.revenueTrend}
                        />
                    {:else if loading}
                        <div
                            class="h-[300px] w-full bg-muted/20 animate-pulse rounded-lg bg-gray-100"
                        ></div>
                    {/if}
                </CardContent>
            </Card>

            <!-- Top Products (Side) -->
            <Card class="col-span-1 md:col-span-3 shadow-sm">
                <CardHeader>
                    <CardTitle>Top Best Selling</CardTitle>
                    <CardDescription
                        >Highest quantity items sold all time</CardDescription
                    >
                </CardHeader>
                <CardContent>
                    {#if dashboardData && dashboardData.charts.topProducts}
                        <TopProductsChart
                            data={dashboardData.charts.topProducts}
                        />
                    {:else if loading}
                        <div
                            class="h-[300px] w-full bg-muted/20 animate-pulse rounded-lg bg-gray-100"
                        ></div>
                    {/if}
                </CardContent>
            </Card>
        </div>

        <!-- 3. Lists Section -->
        <div class="grid gap-6 md:grid-cols-3">
            <!-- Recent Services -->
            <Card class="shadow-sm">
                <CardHeader>
                    <CardTitle>Recent Services</CardTitle>
                    <CardDescription>Newest service entries</CardDescription>
                </CardHeader>
                <CardContent>
                    <ServiceListCompact
                        services={recentServices}
                        title="Recent"
                        emptyMessage="No recent services"
                    />
                </CardContent>
            </Card>

            <!-- Urgent Services -->
            <Card class="shadow-sm border-orange-200 bg-orange-50/30">
                <CardHeader>
                    <CardTitle class="text-orange-700"
                        >Urgent Services</CardTitle
                    >
                    <CardDescription
                        >Approaching deadline or overdue</CardDescription
                    >
                </CardHeader>
                <CardContent>
                    <ServiceListCompact
                        services={urgentServices}
                        title="Urgent"
                        emptyMessage="No urgent services found"
                    />
                </CardContent>
            </Card>

            <!-- Activity Log -->
            <Card class="shadow-sm">
                <CardHeader>
                    <CardTitle>Activity Log</CardTitle>
                    <CardDescription>Recent system events</CardDescription>
                </CardHeader>
                <CardContent>
                    <ActivityLog {activities} />
                </CardContent>
            </Card>
        </div>
    {/if}
</div>
