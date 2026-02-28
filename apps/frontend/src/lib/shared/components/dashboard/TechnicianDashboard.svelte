<script lang="ts">
    import { onMount } from "svelte";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import { Badge } from "$lib/shared/components/ui/badge";
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
        Hammer,
        Plus,
        Send,
    } from "lucide-svelte";
    import { api } from "$lib/shared/lib/api-client";
    import { goto } from "$app/navigation";
    import { cn } from "$lib/shared/lib/utils";
    import {
        ServiceToolsService,
        type ServiceTool,
        type ServiceToolRequest,
    } from "$lib/features/services/services/service-tools.service";
    import * as Dialog from "$lib/shared/components/ui/dialog";
    import { Label } from "$lib/shared/components/ui/label";
    import { Input } from "$lib/shared/components/ui/input";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import { toast } from "svelte-sonner";

    let loading = $state(true);
    let stats = $state<any>(null);
    let myJobs = $state<any[]>([]);
    let queue = $state<any[]>([]);
    let myTools = $state<ServiceTool[]>([]);
    let myRequests = $state<ServiceToolRequest[]>([]);
    let error = $state<string | null>(null);
    let userId = $state("");

    // Request Tool State
    let isRequestDialogOpen = $state(false);
    let isSubmittingRequest = $state(false);
    let requestForm = $state({
        toolName: "",
        justification: "",
    });

    async function fetchData() {
        try {
            loading = true;
            error = null;

            // Get userId from storage if not set
            if (!userId && typeof window !== "undefined") {
                const u = JSON.parse(localStorage.getItem("user") || "{}");
                userId = u.id;
            }

            // Fetch Stats, My Jobs, Queue, Tools, and Requests
            const [statsRes, jobsRes, queueRes, tools, requests] =
                await Promise.all([
                    api.get("/service/stats"),
                    api.get(`/service?technicianId=${userId}`),
                    api.get("/service?status=antrian"),
                    ServiceToolsService.getMyTools(),
                    ServiceToolsService.getMyRequests(),
                ]);

            stats = statsRes.data.data;
            myTools = tools;
            myRequests = requests;

            // Filter My Jobs to show only Active work
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

    async function handleRequestTool() {
        if (!requestForm.toolName || !requestForm.justification) {
            toast.error("Mohon isi semua field");
            return;
        }

        try {
            isSubmittingRequest = true;
            await ServiceToolsService.createRequest(requestForm);
            toast.success("Permintaan alat telah dikirim");
            isRequestDialogOpen = false;
            requestForm = { toolName: "", justification: "" };
            fetchData(); // Refresh requests list
        } catch (e: any) {
            toast.error(
                e.response?.data?.message || "Gagal mengirim permintaan",
            );
        } finally {
            isSubmittingRequest = false;
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

    function getReqStatusColor(status: string) {
        const colors: Record<string, string> = {
            pending: "bg-amber-100 text-amber-700 border-amber-200",
            approved: "bg-green-100 text-green-700 border-green-200",
            rejected: "bg-red-100 text-red-700 border-red-200",
        };
        return colors[status] || "bg-gray-100 text-gray-700";
    }
</script>

<div class="space-y-6 pb-12">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Profit -->
        <Card
            class="border-l-4 border-l-green-500 overflow-hidden relative group"
        >
            <CardContent class="pt-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p
                            class="text-sm text-muted-foreground uppercase tracking-wider font-semibold"
                        >
                            Keuntungan Bulan Ini
                        </p>
                        <p class="text-2xl font-bold text-green-600 mt-1">
                            {loading
                                ? "..."
                                : `Rp ${(stats?.profit || 0).toLocaleString("id-ID")}`}
                        </p>
                    </div>
                    <div
                        class="p-3 rounded-xl bg-green-50 group-hover:scale-110 transition-transform"
                    >
                        <DollarSign class="h-6 w-6 text-green-500" />
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- Total Service -->
        <Card
            class="border-l-4 border-l-blue-500 overflow-hidden relative group"
        >
            <CardContent class="pt-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p
                            class="text-sm text-muted-foreground uppercase tracking-wider font-semibold"
                        >
                            Total Service
                        </p>
                        <p class="text-2xl font-bold text-blue-600 mt-1">
                            {loading ? "..." : stats?.total || 0}
                        </p>
                    </div>
                    <div
                        class="p-3 rounded-xl bg-blue-50 group-hover:scale-110 transition-transform"
                    >
                        <Wrench class="h-6 w-6 text-blue-500" />
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- Success -->
        <Card
            class="border-l-4 border-l-indigo-500 overflow-hidden relative group"
        >
            <CardContent class="pt-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p
                            class="text-sm text-muted-foreground uppercase tracking-wider font-semibold"
                        >
                            Sukses (Selesai)
                        </p>
                        <p class="text-2xl font-bold text-indigo-600 mt-1">
                            {loading ? "..." : stats?.success || 0}
                        </p>
                    </div>
                    <div
                        class="p-3 rounded-xl bg-indigo-50 group-hover:scale-110 transition-transform"
                    >
                        <CheckCircle2 class="h-6 w-6 text-indigo-500" />
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- Failed -->
        <Card
            class="border-l-4 border-l-red-500 overflow-hidden relative group"
        >
            <CardContent class="pt-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p
                            class="text-sm text-muted-foreground uppercase tracking-wider font-semibold"
                        >
                            Gagal (Batal)
                        </p>
                        <p class="text-2xl font-bold text-red-600 mt-1">
                            {loading ? "..." : stats?.failed || 0}
                        </p>
                    </div>
                    <div
                        class="p-3 rounded-xl bg-red-50 group-hover:scale-110 transition-transform"
                    >
                        <XCircle class="h-6 w-6 text-red-500" />
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>

    {#if loading}
        <div class="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 class="h-10 w-10 animate-spin text-blue-500" />
            <p class="text-sm text-slate-500 animate-pulse">
                Memuat Dashboard...
            </p>
        </div>
    {:else if error}
        <Card class="border-red-200 bg-red-50/50 backdrop-blur-sm">
            <CardContent class="pt-6">
                <div class="flex items-center gap-3 text-red-600 font-medium">
                    <XCircle class="h-5 w-5" />
                    <p>{error}</p>
                </div>
            </CardContent>
        </Card>
    {:else}
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Left Column: Jobs -->
            <div class="lg:col-span-8 space-y-6">
                <!-- My Jobs -->
                <Card
                    class="border-none shadow-xl bg-white/80 backdrop-blur-md"
                >
                    <CardHeader
                        class="pb-3 flex flex-row items-center justify-between"
                    >
                        <CardTitle class="flex items-center gap-2 text-xl">
                            <Wrench class="h-5 w-5 text-blue-500" />
                            Job Saya
                        </CardTitle>
                        <Badge
                            variant="outline"
                            class="bg-blue-50 text-blue-600 border-blue-100"
                        >
                            {myJobs.length} Aktif
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        {#if myJobs?.length}
                            <div class="space-y-3">
                                {#each myJobs as job}
                                    <button
                                        onclick={() =>
                                            goto(`/service/${job.id}`)}
                                        class="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-blue-200 hover:shadow-md transition-all text-left group"
                                    >
                                        <div class="flex items-center gap-4">
                                            <div
                                                class="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors"
                                            >
                                                <User
                                                    class="h-6 w-6 text-slate-400 group-hover:text-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <p
                                                    class="font-bold text-slate-900"
                                                >
                                                    {job.no}
                                                </p>
                                                <p
                                                    class="text-sm text-slate-500 flex items-center gap-1.5"
                                                >
                                                    <span
                                                        class="font-medium text-slate-700"
                                                        >{job.customer?.name ||
                                                            "Customer"}</span
                                                    >
                                                    <span class="text-slate-300"
                                                        >•</span
                                                    >
                                                    <span
                                                        >{job.device?.brand ||
                                                            ""}
                                                        {job.device?.model ||
                                                            ""}</span
                                                    >
                                                </p>
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-4">
                                            <Badge
                                                class={cn(
                                                    "px-2.5 py-0.5 rounded-full font-medium capitalize",
                                                    getStatusColor(job.status),
                                                )}
                                            >
                                                {job.status}
                                            </Badge>
                                            <div
                                                class="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-blue-500 group-hover:text-white transition-all text-slate-400"
                                            >
                                                <ChevronRight class="h-5 w-5" />
                                            </div>
                                        </div>
                                    </button>
                                {/each}
                            </div>
                        {:else}
                            <div
                                class="flex flex-col items-center justify-center py-12 px-4 text-center"
                            >
                                <div
                                    class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4"
                                >
                                    <Wrench class="h-8 w-8 text-slate-300" />
                                </div>
                                <h3 class="font-semibold text-slate-900">
                                    Tidak ada job aktif
                                </h3>
                                <p
                                    class="text-sm text-slate-500 max-w-[240px] mt-1"
                                >
                                    Semua pekerjaan telah selesai. Silakan ambil
                                    job baru dari antrian tersedia.
                                </p>
                            </div>
                        {/if}
                    </CardContent>
                </Card>

                <!-- Queue -->
                <Card
                    class="border-none shadow-xl bg-white/80 backdrop-blur-md"
                >
                    <CardHeader
                        class="pb-3 flex flex-row items-center justify-between"
                    >
                        <CardTitle class="flex items-center gap-2 text-xl">
                            <ListTodo class="h-5 w-5 text-amber-500" />
                            Antrian Tersedia
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {#if queue?.length}
                            <div class="space-y-3">
                                {#each queue as job}
                                    <div
                                        class="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-amber-200 transition-all text-left"
                                    >
                                        <div class="flex items-center gap-4">
                                            <div
                                                class="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center"
                                            >
                                                <Clock
                                                    class="h-6 w-6 text-slate-400"
                                                />
                                            </div>
                                            <div>
                                                <p
                                                    class="font-bold text-slate-900"
                                                >
                                                    {job.no}
                                                </p>
                                                <p
                                                    class="text-sm text-slate-500 leading-relaxed max-w-[400px]"
                                                >
                                                    <span
                                                        class="font-medium text-slate-700"
                                                        >{job.device?.brand ||
                                                            ""}
                                                        {job.device?.model ||
                                                            ""}</span
                                                    >
                                                    <span class="text-slate-300"
                                                        >•</span
                                                    >
                                                    <span>{job.complaint}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            class="rounded-full border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 font-semibold px-5"
                                            onclick={() =>
                                                goto(`/service/${job.id}`)}
                                        >
                                            Cek Job
                                        </Button>
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <div
                                class="flex flex-col items-center justify-center py-12 px-4 text-center"
                            >
                                <div
                                    class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4"
                                >
                                    <Clock class="h-8 w-8 text-slate-300" />
                                </div>
                                <h3 class="font-semibold text-slate-900">
                                    Antrian kosong
                                </h3>
                                <p class="text-sm text-slate-500 mt-1">
                                    Belum ada kiriman service baru yang masuk ke
                                    antrian.
                                </p>
                            </div>
                        {/if}
                    </CardContent>
                </Card>
            </div>

            <!-- Right Column: Tools & Requests -->
            <div class="lg:col-span-4 space-y-6">
                <!-- My Tools -->
                <Card
                    class="border-none shadow-xl bg-white/80 backdrop-blur-md"
                >
                    <CardHeader
                        class="pb-3 flex flex-row items-center justify-between space-y-0"
                    >
                        <CardTitle class="flex items-center gap-2 text-xl">
                            <Hammer class="h-5 w-5 text-indigo-500" />
                            Alat Saya
                        </CardTitle>
                        <Dialog.Root bind:open={isRequestDialogOpen}>
                            <Dialog.Trigger>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    class="h-8 w-8 p-0 rounded-full hover:bg-indigo-50 hover:text-indigo-600"
                                >
                                    <Plus class="h-5 w-5" />
                                </Button>
                            </Dialog.Trigger>
                            <Dialog.Content class="sm:max-w-[425px]">
                                <Dialog.Header>
                                    <Dialog.Title
                                        >Request Alat Baru</Dialog.Title
                                    >
                                    <Dialog.Description>
                                        Ajukan permintaan alat service baru
                                        dengan alasan yang jelas.
                                    </Dialog.Description>
                                </Dialog.Header>
                                <div class="grid gap-4 py-4">
                                    <div class="grid gap-2">
                                        <Label for="tool-name">Nama Alat</Label>
                                        <Input
                                            id="tool-name"
                                            placeholder="Contoh: Solder JBC, Multimeter, dll"
                                            bind:value={requestForm.toolName}
                                        />
                                    </div>
                                    <div class="grid gap-2">
                                        <Label for="justification"
                                            >Justifikasi / Alasan</Label
                                        >
                                        <Textarea
                                            id="justification"
                                            placeholder="Jelaskan mengapa Anda membutuhkan alat ini..."
                                            rows={4}
                                            bind:value={
                                                requestForm.justification
                                            }
                                        />
                                    </div>
                                </div>
                                <Dialog.Footer>
                                    <Button
                                        type="submit"
                                        class="w-full bg-indigo-600 hover:bg-indigo-700"
                                        disabled={isSubmittingRequest}
                                        onclick={handleRequestTool}
                                    >
                                        {#if isSubmittingRequest}
                                            <Loader2
                                                class="mr-2 h-4 w-4 animate-spin"
                                            />
                                            Mengirim...
                                        {:else}
                                            <Send class="mr-2 h-4 w-4" />
                                            Kirim Permintaan
                                        {/if}
                                    </Button>
                                </Dialog.Footer>
                            </Dialog.Content>
                        </Dialog.Root>
                    </CardHeader>
                    <CardContent>
                        {#if myTools?.length}
                            <div class="space-y-4">
                                {#each myTools as tool}
                                    <div
                                        class="flex items-center justify-between group"
                                    >
                                        <div class="flex items-center gap-3">
                                            <div
                                                class="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors"
                                            >
                                                <Hammer class="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p
                                                    class="text-sm font-bold text-slate-900 leading-none"
                                                >
                                                    {tool.name}
                                                </p>
                                                {#if tool.brand}
                                                    <p
                                                        class="text-xs text-slate-500 mt-1"
                                                    >
                                                        {tool.brand}
                                                    </p>
                                                {/if}
                                            </div>
                                        </div>
                                        <Badge
                                            class="bg-indigo-50 text-indigo-600 border-indigo-100 font-medium"
                                        >
                                            x{tool.qty}
                                        </Badge>
                                    </div>
                                {/each}
                            </div>
                            <div class="mt-6 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    class="w-full text-indigo-600 border-indigo-100 hover:bg-indigo-50 hover:text-indigo-700 font-semibold"
                                    onclick={() => goto("/service-tools")}
                                >
                                    Kelola & Lapor Alat
                                    <ChevronRight class="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        {:else}
                            <div
                                class="flex flex-col items-center justify-center py-6 text-center"
                            >
                                <p class="text-sm text-slate-500">
                                    Belum ada alat yang ditugaskan.
                                </p>
                                <Button
                                    variant="link"
                                    class="text-indigo-600 font-semibold p-0 h-auto mt-1"
                                    onclick={() => (isRequestDialogOpen = true)}
                                >
                                    Minta alat sekarang
                                </Button>
                            </div>
                        {/if}
                    </CardContent>
                </Card>

                <!-- Tool Requests -->
                {#if myRequests?.length}
                    <Card
                        class="border-none shadow-xl bg-white/80 backdrop-blur-md"
                    >
                        <CardHeader class="pb-3">
                            <CardTitle class="flex items-center gap-2 text-lg">
                                <Send class="h-4 w-4 text-slate-500" />
                                Riwayat Permintaan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div class="space-y-4">
                                {#each myRequests as req}
                                    <div
                                        class="p-3 rounded-xl border border-slate-50 bg-slate-50/30"
                                    >
                                        <div
                                            class="flex items-center justify-between mb-2"
                                        >
                                            <p
                                                class="text-sm font-bold text-slate-900"
                                            >
                                                {req.toolName}
                                            </p>
                                            <Badge
                                                class={cn(
                                                    "text-[10px] uppercase tracking-wider border",
                                                    getReqStatusColor(
                                                        req.status,
                                                    ),
                                                )}
                                            >
                                                {req.status}
                                            </Badge>
                                        </div>
                                        <p
                                            class="text-xs text-slate-500 line-clamp-2 italic"
                                        >
                                            "{req.justification}"
                                        </p>
                                    </div>
                                {/each}
                            </div>
                        </CardContent>
                    </Card>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    /* Add any custom animations if needed */
    :global(.animate-in) {
        animation: fadeIn 0.5s ease-out;
    }
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
