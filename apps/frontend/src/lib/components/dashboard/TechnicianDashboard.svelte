<script lang="ts">
    import { onMount } from "svelte";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import {
        Wrench,
        Clock,
        CheckCircle2,
        ListTodo,
        User,
        ChevronRight,
        Loader2,
        DollarSign,
        XCircle,
    } from "lucide-svelte";
    import { api } from "$lib/api";
    import { goto } from "$app/navigation";

    let loading = $state(true);
    let stats = $state<any>(null);
    let myJobs = $state<any[]>([]);
    let queue = $state<any[]>([]);
    let error = $state<string | null>(null);
    let userId = $state("");

    async function fetchData() {
        try {
            loading = true;
            error = null;

            // Get userId from storage if not set
            if (!userId && typeof window !== "undefined") {
                const u = JSON.parse(localStorage.getItem("user") || "{}");
                userId = u.id;
            }

            // Fetch Stats, My Jobs, and Queue
            const [statsRes, jobsRes, queueRes] = await Promise.all([
                api.get("/service/stats"),
                // My Jobs: Active services assigned to me
                // Note: ideally exclude 'selesai' from active jobs list, or include?
                // Prompt implies "Dashboard ... card keuntungan ... total service ...". List usually shows active.
                // Let's filter for active statuses only for "My Jobs" list.
                // Or if API supports multiple statuses: status=dikerjakan,dicek,konfirmasi
                // For now, let's fetch all assigned and filter in client or just fetching 'dikerjakan' as primary focus?
                // Let's try fetching all for me and filtering non-final in client.
                api.get(`/service?technicianId=${userId}`),
                api.get("/service?status=antrian"),
            ]);

            stats = statsRes.data.data;

            // Filter My Jobs to show only Active work (Hide Selesai/Batal/Diambil from the "Active List")
            // This list handles "My Jobs" section.
            const allMyServices = jobsRes.data.data || [];
            myJobs = allMyServices.filter(
                (s: any) => !["selesai", "batal", "diambil"].includes(s.status),
            );

            queue = queueRes.data.data || [];
        } catch (e: any) {
            console.error("Failed to fetch technician dashboard", e);
            error = e.response?.data?.message || e.message || "Failed to load";
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    });

    function getStatusColor(status: string) {
        const colors: Record<string, string> = {
            antrian: "bg-gray-100 text-gray-700",
            dicek: "bg-blue-100 text-blue-700",
            konfirmasi: "bg-amber-100 text-amber-700",
            dikerjakan: "bg-purple-100 text-purple-700",
            "re-konfirmasi": "bg-orange-100 text-orange-700",
        };
        return colors[status] || "bg-gray-100 text-gray-700";
    }
</script>

<div class="space-y-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Profit -->
        <Card class="border-l-4 border-l-green-500">
            <CardContent class="pt-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-muted-foreground">
                            Keuntungan Bulan Ini
                        </p>
                        <p class="text-2xl font-bold text-green-600">
                            {loading
                                ? "..."
                                : `Rp ${(stats?.profit || 0).toLocaleString("id-ID")}`}
                        </p>
                    </div>
                    <DollarSign class="h-8 w-8 text-green-200" />
                </div>
            </CardContent>
        </Card>

        <!-- Total Service -->
        <Card class="border-l-4 border-l-blue-500">
            <CardContent class="pt-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-muted-foreground">
                            Total Service
                        </p>
                        <p class="text-2xl font-bold text-blue-600">
                            {loading ? "..." : stats?.total || 0}
                        </p>
                    </div>
                    <Wrench class="h-8 w-8 text-blue-200" />
                </div>
            </CardContent>
        </Card>

        <!-- Success -->
        <Card class="border-l-4 border-l-indigo-500">
            <CardContent class="pt-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-muted-foreground">
                            Sukses (Selesai)
                        </p>
                        <p class="text-2xl font-bold text-indigo-600">
                            {loading ? "..." : stats?.success || 0}
                        </p>
                    </div>
                    <CheckCircle2 class="h-8 w-8 text-indigo-200" />
                </div>
            </CardContent>
        </Card>

        <!-- Failed -->
        <Card class="border-l-4 border-l-red-500">
            <CardContent class="pt-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-muted-foreground">
                            Gagal (Batal)
                        </p>
                        <p class="text-2xl font-bold text-red-600">
                            {loading ? "..." : stats?.failed || 0}
                        </p>
                    </div>
                    <XCircle class="h-8 w-8 text-red-200" />
                </div>
            </CardContent>
        </Card>
    </div>

    {#if loading}
        <div class="flex items-center justify-center py-12">
            <Loader2 class="h-8 w-8 animate-spin text-primary" />
        </div>
    {:else if error}
        <Card class="border-red-200 bg-red-50">
            <CardContent class="pt-6">
                <p class="text-red-600">{error}</p>
            </CardContent>
        </Card>
    {:else}
        <!-- My Jobs -->
        <Card>
            <CardHeader>
                <CardTitle class="flex items-center gap-2">
                    <Wrench class="h-5 w-5 text-primary" />
                    Job Saya
                </CardTitle>
            </CardHeader>
            <CardContent>
                {#if myJobs?.length}
                    <div class="space-y-3">
                        {#each myJobs as job}
                            <button
                                onclick={() => goto(`/service/${job.id}`)}
                                class="w-full flex items-center justify-between p-4 rounded-xl border hover:bg-muted/50 transition-colors text-left"
                            >
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
                                    >
                                        <User class="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p class="font-medium">{job.no}</p>
                                        <p
                                            class="text-sm text-muted-foreground"
                                        >
                                            {job.customer?.name || "Customer"} •
                                            {job.device?.brand || ""}
                                            {job.device?.model || ""}
                                        </p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <Badge class={getStatusColor(job.status)}>
                                        {job.status}
                                    </Badge>
                                    <ChevronRight
                                        class="h-4 w-4 text-muted-foreground"
                                    />
                                </div>
                            </button>
                        {/each}
                    </div>
                {:else}
                    <p class="text-muted-foreground text-center py-8">
                        Tidak ada job aktif. Ambil job dari antrian!
                    </p>
                {/if}
            </CardContent>
        </Card>

        <!-- Queue -->
        <Card>
            <CardHeader>
                <CardTitle class="flex items-center gap-2">
                    <ListTodo class="h-5 w-5 text-blue-500" />
                    Antrian Tersedia
                </CardTitle>
            </CardHeader>
            <CardContent>
                {#if queue?.length}
                    <div class="space-y-3">
                        {#each queue as job}
                            <button
                                onclick={() => goto(`/service/${job.id}`)}
                                class="w-full flex items-center justify-between p-4 rounded-xl border hover:bg-muted/50 transition-colors text-left"
                            >
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                                    >
                                        <Clock class="h-5 w-5 text-gray-500" />
                                    </div>
                                    <div>
                                        <p class="font-medium">{job.no}</p>
                                        <p
                                            class="text-sm text-muted-foreground"
                                        >
                                            {job.device?.brand || ""}
                                            {job.device?.model || ""} • {job.complaint?.slice(
                                                0,
                                                40,
                                            )}...
                                        </p>
                                    </div>
                                </div>
                                <Button size="sm" variant="outline">
                                    Ambil Job
                                </Button>
                            </button>
                        {/each}
                    </div>
                {:else}
                    <p class="text-muted-foreground text-center py-8">
                        Tidak ada antrian baru
                    </p>
                {/if}
            </CardContent>
        </Card>
    {/if}
</div>
