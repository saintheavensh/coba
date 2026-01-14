<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { Separator } from "$lib/components/ui/separator";
    import { toast } from "$lib/components/ui/sonner";
    import PatternLock from "$lib/components/ui/pattern-lock.svelte";
    import {
        ArrowLeft,
        Save,
        CheckCircle,
        XCircle,
        Plus,
        Repeat,
        Printer,
        MessageCircle,
        Trash2,
        User,
        Smartphone,
        Wrench,
        Calendar,
        Clock,
        CreditCard,
        Shield,
        Camera,
        FileText,
        Phone,
        MapPin,
        Hash,
        AlertTriangle,
        ChevronRight,
        Loader2,
    } from "lucide-svelte";

    import { onMount } from "svelte";
    import { ServiceService } from "$lib/services/service.service";
    import { api } from "$lib/api";

    const serviceId = parseInt($page.params.id ?? "0");
    let serviceOrder = $state<any>(null);
    let loading = $state(true);

    async function loadData() {
        loading = true;
        try {
            serviceOrder = await ServiceService.getById(serviceId);
            if (serviceOrder.device) serviceOrder.phone = serviceOrder.device;
            if (!serviceOrder.parts) serviceOrder.parts = [];
            if (!serviceOrder.timeline) serviceOrder.timeline = [];
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat detail service");
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadData();
    });

    // Computed properties
    let totalParts = $derived(
        serviceOrder?.parts?.reduce(
            (sum: number, p: any) => sum + (p.subtotal || p.price * p.qty),
            0,
        ) || 0,
    );

    let grandTotal = $derived((serviceOrder?.serviceFee || 0) + totalParts);

    // Status colors and labels
    const STATUS_CONFIG: Record<
        string,
        { color: string; bg: string; label: string }
    > = {
        antrian: {
            color: "text-gray-700",
            bg: "bg-gray-100",
            label: "Antrian",
        },
        dicek: {
            color: "text-blue-700",
            bg: "bg-blue-100",
            label: "Sedang Dicek",
        },
        konfirmasi: {
            color: "text-amber-700",
            bg: "bg-amber-100",
            label: "Konfirmasi",
        },
        dikerjakan: {
            color: "text-purple-700",
            bg: "bg-purple-100",
            label: "Dikerjakan",
        },
        selesai: {
            color: "text-green-700",
            bg: "bg-green-100",
            label: "Selesai",
        },
        diambil: {
            color: "text-teal-700",
            bg: "bg-teal-100",
            label: "Sudah Diambil",
        },
        batal: { color: "text-red-700", bg: "bg-red-100", label: "Dibatalkan" },
    };

    function getStatusConfig(status: string) {
        return STATUS_CONFIG[status] || STATUS_CONFIG.antrian;
    }

    // Timeline status order for progress indicator
    const STATUS_ORDER = [
        "antrian",
        "dicek",
        "konfirmasi",
        "dikerjakan",
        "selesai",
        "diambil",
    ];

    function getStatusIndex(status: string) {
        const idx = STATUS_ORDER.indexOf(status);
        return idx >= 0 ? idx : 0;
    }

    // Action handlers
    async function handleComplete() {
        if (!confirm("Tandai service ini selesai?")) return;
        try {
            const userId =
                JSON.parse(localStorage.getItem("user") || "{}").id ||
                "USR-ADMIN";
            await ServiceService.updateStatus(serviceId, {
                status: "selesai",
                userId,
            });
            toast.success("Service selesai!");
            loadData();
        } catch (e) {
            toast.error("Gagal update status");
        }
    }

    async function handleCancel() {
        if (!confirm("Batalkan service ini?")) return;
        try {
            const userId =
                JSON.parse(localStorage.getItem("user") || "{}").id ||
                "USR-ADMIN";
            await ServiceService.updateStatus(serviceId, {
                status: "batal",
                userId,
            });
            toast.success("Service dibatalkan");
            loadData();
        } catch (e) {
            toast.error("Gagal membatalkan");
        }
    }

    async function handlePickup() {
        if (!confirm("Konfirmasi unit sudah diambil customer?")) return;
        try {
            const userId =
                JSON.parse(localStorage.getItem("user") || "{}").id ||
                "USR-ADMIN";
            await ServiceService.updateStatus(serviceId, {
                status: "diambil",
                userId,
            });
            toast.success("Service telah diambil!");
            loadData();
        } catch (e) {
            toast.error("Gagal update status");
        }
    }

    function handleChatCustomer() {
        if (!serviceOrder) return;
        const phone =
            serviceOrder.customer?.phone?.replace(/[^0-9]/g, "") || "";
        const formattedPhone = phone.startsWith("0")
            ? "62" + phone.slice(1)
            : phone;
        const brand = serviceOrder.phone?.brand || "HP";
        const model = serviceOrder.phone?.model || "";
        const message = `Halo Kak ${serviceOrder.customer?.name || "Customer"}, mengenai service ${brand} ${model} (No: ${serviceOrder.no})...`;
        const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
    }

    async function handlePrintLabel() {
        try {
            await ServiceService.print(serviceId);
            toast.success("Perintah cetak dikirim ke server");
        } catch (e: any) {
            const errMsg =
                e.response?.data?.errors?.[0] ||
                e.response?.data?.message ||
                e.message;
            toast.error("Gagal mencetak: " + errMsg);
        }
    }

    async function handleDelete() {
        if (!confirm("Hapus permanen history service ini?")) return;
        try {
            await api.delete(`/service/${serviceId}`);
            toast.success("Service dihapus");
            goto("/service");
        } catch (e) {
            toast.error("Gagal hapus");
        }
    }

    // Helper functions
    function formatDate(dateStr: string | null | undefined) {
        if (!dateStr) return "-";
        try {
            return new Date(dateStr).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateStr;
        }
    }

    function getPhysicalLabel(v: string) {
        const map: Record<string, string> = {
            normal: "Normal (Mulus)",
            lecet: "Lecet / Goresan",
            retak: "Retak / Pecah",
            bekas_air: "Bekas Air / Korosi",
            bengkok: "Bengkok / Dent",
        };
        return map[v] || v;
    }

    function getCompletenessLabel(v: string) {
        const map: Record<string, string> = {
            charger: "Charger",
            box: "Dus/Box",
            simcard: "SIM Card",
            memorycard: "Memory Card",
            case: "Case/Casing",
            earphone: "Earphone",
        };
        return map[v] || v;
    }

    let isReadOnly = $derived(
        serviceOrder?.status === "selesai" ||
            serviceOrder?.status === "batal" ||
            serviceOrder?.status === "diambil",
    );

    let statusConfig = $derived(
        getStatusConfig(serviceOrder?.status || "antrian"),
    );

    let progress = $derived(
        ((getStatusIndex(serviceOrder?.status || "antrian") + 1) /
            STATUS_ORDER.length) *
            100,
    );
</script>

<div
    class="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500"
>
    {#if loading}
        <div class="flex items-center justify-center h-[600px]">
            <Loader2 class="h-8 w-8 animate-spin text-primary" />
        </div>
    {:else if !serviceOrder}
        <div class="flex flex-col items-center justify-center h-[600px] gap-4">
            <AlertTriangle class="h-16 w-16 text-muted-foreground" />
            <p class="text-lg text-muted-foreground">
                Service Order tidak ditemukan
            </p>
            <Button variant="outline" onclick={() => goto("/service")}>
                <ArrowLeft class="h-4 w-4 mr-2" /> Kembali
            </Button>
        </div>
    {:else}
        <!-- Hero Header -->
        <div class="bg-card rounded-3xl shadow-sm border p-6 mb-6">
            <div
                class="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
                <div class="flex items-start gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onclick={() => goto("/service")}
                        class="shrink-0"
                    >
                        <ArrowLeft class="h-5 w-5" />
                    </Button>
                    <div>
                        <div class="flex items-center gap-3 flex-wrap">
                            <h1 class="text-2xl font-bold">
                                {serviceOrder.no}
                            </h1>
                            <Badge
                                class="{statusConfig.bg} {statusConfig.color} hover:{statusConfig.bg} px-3 py-1 text-sm font-medium"
                            >
                                {statusConfig.label}
                            </Badge>
                            {#if serviceOrder.isWalkin}
                                <Badge
                                    class="bg-green-100 text-green-700 hover:bg-green-100"
                                >
                                    <Clock class="h-3 w-3 mr-1" /> Walk-in
                                </Badge>
                            {:else}
                                <Badge variant="outline">
                                    <Calendar class="h-3 w-3 mr-1" /> Regular
                                </Badge>
                            {/if}
                        </div>
                        <p class="text-muted-foreground mt-1">
                            <span class="font-medium"
                                >{serviceOrder.customer?.name ||
                                    "Unknown"}</span
                            >
                            <span class="mx-2">•</span>
                            {serviceOrder.phone?.brand || ""}
                            {serviceOrder.phone?.model || ""}
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-wrap ml-14 lg:ml-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onclick={handlePrintLabel}
                    >
                        <Printer class="h-4 w-4 mr-2" /> Cetak Label
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        class="text-green-600"
                        onclick={handleChatCustomer}
                    >
                        <MessageCircle class="h-4 w-4 mr-2" /> WhatsApp
                    </Button>
                </div>
            </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
            <!-- Left Sidebar: Timeline -->
            <aside class="space-y-6">
                <!-- Timeline Card -->
                <div class="bg-card rounded-2xl shadow-sm border p-5">
                    <h3
                        class="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2"
                    >
                        <Clock class="h-4 w-4" /> Timeline Service
                    </h3>

                    <!-- Status Progress -->
                    <div class="mb-6">
                        <div
                            class="flex justify-between text-xs text-muted-foreground mb-2"
                        >
                            <span>Masuk</span>
                            <span>Selesai</span>
                        </div>
                        <div class="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                class="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                                style="width: {Math.min(progress, 100)}%"
                            ></div>
                        </div>
                    </div>

                    <!-- Timeline Events -->
                    <div class="space-y-1">
                        {#each serviceOrder.timeline || [] as item, i}
                            {@const isLast =
                                i === (serviceOrder.timeline?.length || 0) - 1}
                            <div
                                class="relative pl-6 pb-4 {isLast
                                    ? ''
                                    : 'border-l-2 border-muted ml-2'}"
                            >
                                <div
                                    class="absolute left-0 top-0 w-4 h-4 rounded-full {isLast
                                        ? 'bg-primary ring-4 ring-primary/20'
                                        : 'bg-muted-foreground/30'} -translate-x-[7px]"
                                ></div>
                                <div class="ml-2">
                                    <p class="font-medium text-sm">
                                        {item.event}
                                    </p>
                                    {#if item.details}
                                        <div
                                            class="text-xs text-muted-foreground mt-1 space-y-0.5 border-l-2 border-muted pl-2"
                                        >
                                            {#if item.details.customer}
                                                <p>
                                                    Customer: {item.details
                                                        .customer}
                                                </p>
                                            {/if}
                                            {#if item.details.phone}
                                                <p>
                                                    Unit: {item.details.phone}
                                                </p>
                                            {/if}
                                            {#if item.details.technician}
                                                <p>
                                                    Status Teknisi: {item
                                                        .details.technician}
                                                </p>
                                            {/if}
                                            {#if item.details.isWalkin}
                                                <p>
                                                    Tipe: {item.details
                                                        .isWalkin}
                                                </p>
                                            {/if}
                                        </div>
                                    {/if}
                                    <div class="flex items-center gap-2 mt-1">
                                        <p
                                            class="text-xs text-muted-foreground flex items-center gap-1"
                                        >
                                            <User class="h-3 w-3" />
                                            {item.by}
                                        </p>
                                        <span
                                            class="text-xs text-muted-foreground"
                                            >•</span
                                        >
                                        <p
                                            class="text-xs text-muted-foreground"
                                        >
                                            {item.time}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        {/each}
                        {#if !serviceOrder.timeline?.length}
                            <p class="text-sm text-muted-foreground italic">
                                Belum ada aktivitas
                            </p>
                        {/if}
                    </div>
                </div>

                <!-- Dates Card -->
                <div class="bg-card rounded-2xl shadow-sm border p-5 space-y-4">
                    <h3
                        class="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2"
                    >
                        <Calendar class="h-4 w-4" /> Tanggal
                    </h3>
                    <div class="space-y-3 text-sm">
                        <div class="flex justify-between">
                            <span class="text-muted-foreground">Masuk</span>
                            <span class="font-medium"
                                >{formatDate(serviceOrder.dateIn)}</span
                            >
                        </div>
                        {#if serviceOrder.estimatedCompletionDate}
                            <div class="flex justify-between">
                                <span class="text-muted-foreground"
                                    >Est. Selesai</span
                                >
                                <span class="font-medium"
                                    >{formatDate(
                                        serviceOrder.estimatedCompletionDate,
                                    )}</span
                                >
                            </div>
                        {/if}
                        {#if serviceOrder.dateOut}
                            <div class="flex justify-between">
                                <span class="text-muted-foreground">Keluar</span
                                >
                                <span class="font-medium text-green-600"
                                    >{formatDate(serviceOrder.dateOut)}</span
                                >
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Technician Card -->
                <div class="bg-card rounded-2xl shadow-sm border p-5">
                    <div class="flex items-center justify-between mb-3">
                        <h3
                            class="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2"
                        >
                            <Wrench class="h-4 w-4" /> Teknisi
                        </h3>
                        <Button variant="ghost" size="sm" class="h-7 text-xs">
                            <Repeat class="h-3 w-3 mr-1" /> Ganti
                        </Button>
                    </div>
                    <div class="flex items-center gap-3">
                        <div
                            class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
                        >
                            <User class="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p class="font-medium">
                                {serviceOrder.technician?.name ||
                                    "Belum Ditentukan"}
                            </p>
                            {#if serviceOrder.technician?.assignedAt}
                                <p class="text-xs text-muted-foreground">
                                    Assigned: {serviceOrder.technician
                                        .assignedAt}
                                </p>
                            {/if}
                        </div>
                    </div>
                </div>
            </aside>

            <!-- Main Content -->
            <main class="space-y-6">
                <!-- Customer & Device Info -->
                <div class="grid gap-6 md:grid-cols-2">
                    <!-- Customer Card -->
                    <div class="bg-card rounded-2xl shadow-sm border p-5">
                        <h3 class="font-semibold mb-4 flex items-center gap-2">
                            <User class="h-5 w-5 text-primary" /> Informasi Customer
                        </h3>
                        <div class="space-y-3 text-sm">
                            <div class="flex items-start justify-between">
                                <span class="text-muted-foreground">Nama</span>
                                <span class="font-medium text-right"
                                    >{serviceOrder.customer?.name || "-"}</span
                                >
                            </div>
                            <div class="flex items-start justify-between">
                                <span
                                    class="text-muted-foreground flex items-center gap-1"
                                >
                                    <Phone class="h-3 w-3" /> Telepon
                                </span>
                                <span class="font-medium font-mono"
                                    >{serviceOrder.customer?.phone || "-"}</span
                                >
                            </div>
                            {#if serviceOrder.customer?.address}
                                <div class="flex items-start justify-between">
                                    <span
                                        class="text-muted-foreground flex items-center gap-1"
                                    >
                                        <MapPin class="h-3 w-3" /> Alamat
                                    </span>
                                    <span
                                        class="font-medium text-right max-w-[200px]"
                                        >{serviceOrder.customer.address}</span
                                    >
                                </div>
                            {/if}
                        </div>
                    </div>

                    <!-- Device Card -->
                    <div class="bg-card rounded-2xl shadow-sm border p-5">
                        <h3 class="font-semibold mb-4 flex items-center gap-2">
                            <Smartphone class="h-5 w-5 text-primary" /> Informasi
                            Perangkat
                        </h3>
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between">
                                <span class="text-muted-foreground"
                                    >Merk/Model</span
                                >
                                <span class="font-medium"
                                    >{serviceOrder.phone?.brand || "-"}
                                    {serviceOrder.phone?.model || ""}</span
                                >
                            </div>
                            {#if serviceOrder.phone?.imei}
                                <div class="flex justify-between">
                                    <span
                                        class="text-muted-foreground flex items-center gap-1"
                                    >
                                        <Hash class="h-3 w-3" /> IMEI
                                    </span>
                                    <span class="font-mono text-xs"
                                        >{serviceOrder.phone.imei}</span
                                    >
                                </div>
                            {/if}
                            {#if serviceOrder.phone?.status}
                                <div class="flex justify-between">
                                    <span class="text-muted-foreground"
                                        >Status HP</span
                                    >
                                    <Badge variant="outline"
                                        >{serviceOrder.phone.status}</Badge
                                    >
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- Physical Condition & Completeness -->
                {#if serviceOrder.phone?.physical?.length || serviceOrder.phone?.completeness?.length}
                    <div class="bg-card rounded-2xl shadow-sm border p-5">
                        <h3 class="font-semibold mb-4 flex items-center gap-2">
                            <FileText class="h-5 w-5 text-primary" /> Kondisi & Kelengkapan
                        </h3>
                        <div class="grid gap-4 md:grid-cols-2">
                            {#if serviceOrder.phone?.physical?.length}
                                <div>
                                    <p
                                        class="text-xs text-muted-foreground uppercase tracking-wider mb-2"
                                    >
                                        Kondisi Fisik
                                    </p>
                                    <div class="flex flex-wrap gap-2">
                                        {#each serviceOrder.phone.physical as p}
                                            <Badge variant="secondary"
                                                >{getPhysicalLabel(p)}</Badge
                                            >
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                            {#if serviceOrder.phone?.completeness?.length}
                                <div>
                                    <p
                                        class="text-xs text-muted-foreground uppercase tracking-wider mb-2"
                                    >
                                        Kelengkapan
                                    </p>
                                    <div class="flex flex-wrap gap-2">
                                        {#each serviceOrder.phone.completeness as c}
                                            <Badge variant="outline"
                                                >{getCompletenessLabel(
                                                    c,
                                                )}</Badge
                                            >
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}

                <!-- PIN/Pattern Display -->
                {#if serviceOrder.phone?.pin || serviceOrder.phone?.pattern}
                    <div class="bg-card rounded-2xl shadow-sm border p-5">
                        <h3 class="font-semibold mb-4 flex items-center gap-2">
                            🔐 PIN / Pattern
                        </h3>
                        <div class="flex items-center gap-6">
                            {#if serviceOrder.phone?.pin}
                                <div>
                                    <p
                                        class="text-xs text-muted-foreground mb-1"
                                    >
                                        PIN
                                    </p>
                                    <p
                                        class="font-mono text-2xl font-bold tracking-widest"
                                    >
                                        {serviceOrder.phone.pin}
                                    </p>
                                </div>
                            {/if}
                            {#if serviceOrder.phone?.pattern && Array.isArray(serviceOrder.phone.pattern)}
                                <div>
                                    <p
                                        class="text-xs text-muted-foreground mb-1"
                                    >
                                        Pattern
                                    </p>
                                    <PatternLock
                                        value={serviceOrder.phone.pattern}
                                        readonly
                                        size={120}
                                    />
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}

                <!-- Photos -->
                {#if serviceOrder.photos?.length}
                    <div class="bg-card rounded-2xl shadow-sm border p-5">
                        <h3 class="font-semibold mb-4 flex items-center gap-2">
                            <Camera class="h-5 w-5 text-primary" /> Foto Kondisi
                            Fisik
                        </h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {#each serviceOrder.photos as photo, i}
                                <button
                                    class="aspect-square rounded-xl overflow-hidden border hover:ring-2 hover:ring-primary focus:ring-2 focus:ring-primary transition-all"
                                    onclick={() => window.open(photo, "_blank")}
                                >
                                    <img
                                        src={photo}
                                        alt="Kondisi {i + 1}"
                                        class="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                    />
                                </button>
                            {/each}
                        </div>
                    </div>
                {/if}

                <!-- Complaint & Diagnosis -->
                <div class="grid gap-6 md:grid-cols-2">
                    <div class="bg-card rounded-2xl shadow-sm border p-5">
                        <h3 class="font-semibold mb-3 flex items-center gap-2">
                            <AlertTriangle class="h-5 w-5 text-amber-500" /> Keluhan
                            Customer
                        </h3>
                        <p class="text-sm">{serviceOrder.complaint || "-"}</p>
                    </div>

                    <div class="bg-card rounded-2xl shadow-sm border p-5">
                        <h3 class="font-semibold mb-3 flex items-center gap-2">
                            <Wrench class="h-5 w-5 text-blue-500" /> Diagnosa Teknisi
                        </h3>
                        {#if serviceOrder.diagnosis}
                            {#if typeof serviceOrder.diagnosis === "string" && serviceOrder.diagnosis.startsWith("{")}
                                {@const diag = JSON.parse(
                                    serviceOrder.diagnosis,
                                )}
                                <div class="space-y-2 text-sm">
                                    {#if diag.initial}<p>
                                            <span class="text-muted-foreground"
                                                >Diagnosa:</span
                                            >
                                            {diag.initial}
                                        </p>{/if}
                                    {#if diag.possibleCauses}<p>
                                            <span class="text-muted-foreground"
                                                >Kemungkinan:</span
                                            >
                                            {diag.possibleCauses}
                                        </p>{/if}
                                </div>
                            {:else}
                                <p class="text-sm">{serviceOrder.diagnosis}</p>
                            {/if}
                        {:else}
                            <p class="text-sm text-muted-foreground italic">
                                Belum ada diagnosa
                            </p>
                        {/if}
                    </div>
                </div>

                <!-- QC Section (for walk-in with QC data) -->
                {#if serviceOrder.phone?.initialQC || serviceOrder.phone?.qc}
                    <div
                        class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-200 p-5"
                    >
                        <h3
                            class="font-semibold mb-4 flex items-center gap-2 text-blue-800"
                        >
                            <CheckCircle class="h-5 w-5" /> Quality Control
                        </h3>
                        <div class="grid gap-4 md:grid-cols-2">
                            {#if serviceOrder.phone?.initialQC}
                                <div class="bg-white/70 rounded-xl p-4">
                                    <p
                                        class="text-xs text-muted-foreground uppercase tracking-wider mb-2"
                                    >
                                        QC Awal (Sebelum)
                                    </p>
                                    <div class="space-y-1">
                                        {#each Object.entries(serviceOrder.phone.initialQC) as [key, value]}
                                            <div
                                                class="flex items-center justify-between text-sm"
                                            >
                                                <span>{key}</span>
                                                {#if value}
                                                    <CheckCircle
                                                        class="h-4 w-4 text-green-500"
                                                    />
                                                {:else}
                                                    <XCircle
                                                        class="h-4 w-4 text-red-500"
                                                    />
                                                {/if}
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                            {#if serviceOrder.phone?.qc?.after}
                                <div class="bg-white/70 rounded-xl p-4">
                                    <p
                                        class="text-xs text-muted-foreground uppercase tracking-wider mb-2"
                                    >
                                        QC Akhir (Sesudah)
                                    </p>
                                    <div class="space-y-1">
                                        {#each Object.entries(serviceOrder.phone.qc.after) as [key, value]}
                                            <div
                                                class="flex items-center justify-between text-sm"
                                            >
                                                <span>{key}</span>
                                                {#if value}
                                                    <CheckCircle
                                                        class="h-4 w-4 text-green-500"
                                                    />
                                                {:else}
                                                    <XCircle
                                                        class="h-4 w-4 text-red-500"
                                                    />
                                                {/if}
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                        {#if serviceOrder.phone?.qc?.notes}
                            <div class="mt-4 p-3 bg-white/70 rounded-lg">
                                <p class="text-xs text-muted-foreground mb-1">
                                    Catatan QC
                                </p>
                                <p class="text-sm">
                                    {serviceOrder.phone.qc.notes}
                                </p>
                            </div>
                        {/if}
                    </div>
                {/if}

                <!-- Payment Section (for walk-in) -->
                {#if serviceOrder.isWalkin && (serviceOrder.payments || serviceOrder.paymentMethod)}
                    <div
                        class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-sm border border-green-200 p-5"
                    >
                        <h3
                            class="font-semibold mb-4 flex items-center gap-2 text-green-800"
                        >
                            <CreditCard class="h-5 w-5" /> Pembayaran
                        </h3>
                        <div class="grid gap-4 md:grid-cols-2">
                            <div class="space-y-3 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-muted-foreground"
                                        >Metode</span
                                    >
                                    <Badge variant="outline" class="capitalize"
                                        >{serviceOrder.paymentMethod ||
                                            "cash"}</Badge
                                    >
                                </div>
                                {#if serviceOrder.transferDetails}
                                    <div
                                        class="p-3 bg-white/70 rounded-lg space-y-1"
                                    >
                                        <p
                                            class="text-xs text-muted-foreground"
                                        >
                                            Transfer ke:
                                        </p>
                                        <p class="font-medium">
                                            {serviceOrder.transferDetails
                                                .bankName}
                                        </p>
                                        <p class="font-mono text-sm">
                                            {serviceOrder.transferDetails
                                                .accountNumber}
                                        </p>
                                        <p class="text-muted-foreground">
                                            a.n. {serviceOrder.transferDetails
                                                .accountHolder}
                                        </p>
                                    </div>
                                {/if}
                            </div>
                            <div class="space-y-3 text-sm">
                                {#if serviceOrder.warranty && serviceOrder.warranty !== "none"}
                                    <div class="flex justify-between">
                                        <span
                                            class="text-muted-foreground flex items-center gap-1"
                                        >
                                            <Shield class="h-3 w-3" /> Garansi
                                        </span>
                                        <Badge
                                            class="bg-green-100 text-green-700"
                                            >{serviceOrder.warranty}</Badge
                                        >
                                    </div>
                                {/if}
                                {#if serviceOrder.paymentNotes}
                                    <div>
                                        <p
                                            class="text-muted-foreground text-xs mb-1"
                                        >
                                            Catatan Pembayaran
                                        </p>
                                        <p>{serviceOrder.paymentNotes}</p>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- Parts Used -->
                {#if serviceOrder.parts?.length}
                    <div class="bg-card rounded-2xl shadow-sm border p-5">
                        <h3 class="font-semibold mb-4 flex items-center gap-2">
                            📦 Spare Parts yang Digunakan
                        </h3>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="border-b">
                                        <th class="text-left py-2 font-medium"
                                            >Nama Parts</th
                                        >
                                        <th class="text-left py-2 font-medium"
                                            >Sumber</th
                                        >
                                        <th class="text-right py-2 font-medium"
                                            >Qty</th
                                        >
                                        <th class="text-right py-2 font-medium"
                                            >Harga</th
                                        >
                                        <th class="text-right py-2 font-medium"
                                            >Subtotal</th
                                        >
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each serviceOrder.parts as part}
                                        <tr class="border-b last:border-0">
                                            <td class="py-2 font-medium"
                                                >{part.name}</td
                                            >
                                            <td class="py-2"
                                                ><Badge variant="outline"
                                                    >{part.source}</Badge
                                                ></td
                                            >
                                            <td class="py-2 text-right"
                                                >{part.qty}</td
                                            >
                                            <td class="py-2 text-right"
                                                >Rp {part.price?.toLocaleString(
                                                    "id-ID",
                                                )}</td
                                            >
                                            <td
                                                class="py-2 text-right font-medium"
                                                >Rp {part.subtotal?.toLocaleString(
                                                    "id-ID",
                                                )}</td
                                            >
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>
                {/if}

                <!-- Cost Summary -->
                <div class="bg-card rounded-2xl shadow-sm border p-5">
                    <h3 class="font-semibold mb-4 flex items-center gap-2">
                        💰 Rincian Biaya
                    </h3>
                    <div class="space-y-3">
                        <div class="flex justify-between text-sm">
                            <span class="text-muted-foreground">Biaya Jasa</span
                            >
                            <span
                                >Rp {(
                                    serviceOrder.serviceFee || 0
                                ).toLocaleString("id-ID")}</span
                            >
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-muted-foreground"
                                >Biaya Parts</span
                            >
                            <span>Rp {totalParts.toLocaleString("id-ID")}</span>
                        </div>
                        <Separator />
                        <div class="flex justify-between text-lg font-bold">
                            <span>TOTAL BIAYA</span>
                            <span class="text-primary"
                                >Rp {grandTotal.toLocaleString("id-ID")}</span
                            >
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                {#if !isReadOnly}
                    <div
                        class="flex flex-col-reverse md:flex-row gap-3 justify-end bg-card rounded-2xl shadow-sm border p-4"
                    >
                        <Button
                            variant="outline"
                            onclick={handleCancel}
                            class="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <XCircle class="mr-2 h-4 w-4" /> Batalkan
                        </Button>
                        {#if serviceOrder.status === "selesai"}
                            <Button
                                onclick={handlePickup}
                                class="bg-teal-600 hover:bg-teal-700"
                            >
                                <CheckCircle class="mr-2 h-4 w-4" /> Konfirmasi Diambil
                            </Button>
                        {:else}
                            <Button
                                onclick={handleComplete}
                                class="bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle class="mr-2 h-4 w-4" /> Tandai Selesai
                            </Button>
                        {/if}
                    </div>
                {:else}
                    <div class="bg-muted/50 rounded-2xl p-4 text-center">
                        <p class="text-muted-foreground italic mb-4">
                            Service status <span class="font-medium"
                                >{serviceOrder.status}</span
                            > - Data terkunci
                        </p>
                        <Button
                            variant="outline"
                            class="text-red-500 border-red-200 hover:bg-red-50"
                            onclick={handleDelete}
                        >
                            <Trash2 class="mr-2 h-4 w-4" /> Hapus Data
                        </Button>
                    </div>
                {/if}
            </main>
        </div>
    {/if}
</div>
