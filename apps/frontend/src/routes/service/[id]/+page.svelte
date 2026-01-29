<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { cn } from "$lib/utils";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { Separator } from "$lib/components/ui/separator";
    import { toast } from "$lib/components/ui/sonner";
    import { SettingsService } from "$lib/services/settings.service";
    import PatternLock from "$lib/components/ui/pattern-lock.svelte";
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
        DialogFooter,
    } from "$lib/components/ui/dialog";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";

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
        AlertCircle,
        RefreshCw,
        ShieldCheck,
        Search,
        UserPlus,
        Activity,
        Gavel,
    } from "lucide-svelte";

    import { onMount } from "svelte";
    import { ServiceService } from "$lib/services/service.service";
    import { refreshServiceList } from "$lib/stores/events";
    import { api } from "$lib/api";
    import ServiceCompletionWizard from "../components/service-completion-wizard.svelte";
    import ServicePickupWizard from "../components/service-pickup-wizard.svelte";
    import ServiceNotePrint from "../components/service-note-print.svelte";
    import CurrencyInput from "$lib/components/custom/currency-input.svelte";
    import DateTimePicker from "$lib/components/custom/date-time-picker.svelte";

    const serviceId = parseInt($page.params.id ?? "0");
    let serviceOrder = $state<any>(null);
    let loading = $state(true);

    // Modal States
    let showDiagnosisModal = $state(false);
    let showCompletionModal = $state(false);
    let showAssignModal = $state(false); // Added

    // Data States
    let technicians = $state<{ id: string; name: string }[]>([]);
    let selectedTechnicianId = $state("");
    let currentUser = $state<any>(null); // Added

    // Input States
    let diagnosisInput = $state({
        initial: "",
        possibleCauses: "",
        costEstimate: 0,
        estimatedCompletion: "", // Added
    });

    let completionInput = $state({
        actualCost: 0,
        notes: "",
    });

    let showPartsModal = $state(false);
    let newPart = $state({
        name: "",
        source: "stok",
        qty: 1,
        price: 0,
    });

    let showReconfirmModal = $state(false);
    let reconfirmInput = $state({
        notes: "",
        replacedComponent: "", // Added
        cost: 0,
    });

    let showCancelModal = $state(false);
    let cancelReason = $state("");

    // Confirmation Dialog States
    let showCompleteConfirm = $state(false);
    // let showPickupConfirm = $state(false); // Replaced by Wizard
    let showDeleteConfirm = $state(false);
    let showStartWorkConfirm = $state(false);
    let isProcessingAction = $state(false);

    let showPickupWizard = $state(false); // Added for Wizard

    let showPrintPreview = $state(false);

    async function loadData() {
        loading = true;
        try {
            serviceOrder = await ServiceService.getById(serviceId);
            if (serviceOrder.device) serviceOrder.phone = serviceOrder.device;
            if (!serviceOrder.parts) serviceOrder.parts = [];
            if (!serviceOrder.timeline) serviceOrder.timeline = [];

            // Pre-fill inputs if data exists
            if (serviceOrder.diagnosis) {
                try {
                    const d = JSON.parse(serviceOrder.diagnosis);
                    if (d.initial) diagnosisInput.initial = d.initial;
                    if (d.possibleCauses)
                        diagnosisInput.possibleCauses = d.possibleCauses;
                    if (d.costEstimate)
                        diagnosisInput.costEstimate = d.costEstimate;
                } catch {}
            }
            if (serviceOrder.costEstimate)
                diagnosisInput.costEstimate = serviceOrder.costEstimate;
            if (serviceOrder.estimatedCompletionDate) {
                try {
                    const date = new Date(serviceOrder.estimatedCompletionDate);
                    diagnosisInput.estimatedCompletion = date
                        .toISOString()
                        .slice(0, 16);
                } catch {}
            }
            if (serviceOrder.actualCost)
                completionInput.actualCost = serviceOrder.actualCost;
            if (serviceOrder.costEstimate && !serviceOrder.actualCost)
                completionInput.actualCost = serviceOrder.costEstimate; // Default completion cost to estimate
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat detail service");
        } finally {
            loading = false;
        }
    }

    let serviceSettings = $state<any>(null);
    let showLiquidateConfirm = $state(false);
    let liquidationType = $state<"resell" | "cannibalize">("resell");

    async function loadSettings() {
        try {
            serviceSettings = await SettingsService.getServiceSettings();
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    }

    async function loadTechnicians() {
        try {
            technicians = await ServiceService.getTechnicians();
        } catch (e) {
            console.error("Failed to load technicians", e);
        }
    }

    async function updateStatus(newStatus: string, extraData: any = {}) {
        try {
            const userId =
                JSON.parse(localStorage.getItem("user") || "{}").id ||
                "USR-ADMIN";
            await ServiceService.updateStatus(serviceId, {
                status: newStatus,
                userId,
                ...extraData,
            });
            toast.success(`Status updated: ${newStatus}`);
            // Trigger refresh for sidebar notification counts
            refreshServiceList.update((n) => n + 1);
            await loadData();
        } catch (e) {
            console.error(e);
            toast.error("Gagal update status");
        }
    }

    async function handleAssignTechnician() {
        if (!selectedTechnicianId) return;
        try {
            await ServiceService.assignTechnician(
                serviceId,
                selectedTechnicianId,
            );
            toast.success("Teknisi berhasil ditugaskan");
            showAssignModal = false;
            // If status is still 'antrian', auto-move to 'dicek' ? Or just let admin/tech do it?
            // User requested: "Antrian -> Assign -> Tech starts" (status update is manual usually)
            // But usually assigning implies work starts or is ready to start.
            // For now just refresh data.
            await loadData();
        } catch (e) {
            toast.error("Gagal menugaskan teknisi");
        }
    }

    async function handleSelfAssign() {
        if (!currentUser?.id) return;
        try {
            await ServiceService.assignTechnician(serviceId, currentUser.id);
            toast.success("Anda berhasil mengambil job ini");
            await loadData();
        } catch (e) {
            toast.error("Gagal mengambil job");
        }
    }

    async function submitDiagnosis() {
        if (!diagnosisInput.initial || !diagnosisInput.possibleCauses) {
            toast.error("Mohon isi diagnosa awal dan kemungkinan kerusakan");
            return;
        }
        if (diagnosisInput.costEstimate <= 0) {
            toast.error("Estimasi biaya tidak boleh 0");
            return;
        }
        try {
            const userId =
                JSON.parse(localStorage.getItem("user") || "{}").id ||
                "USR-ADMIN";
            // Update details first
            const payload = {
                diagnosis: {
                    initial: diagnosisInput.initial,
                    possibleCauses: diagnosisInput.possibleCauses,
                },
                costEstimate: diagnosisInput.costEstimate,
                estimatedCompletionDate: diagnosisInput.estimatedCompletion
                    ? new Date(diagnosisInput.estimatedCompletion)
                    : undefined,
            };

            await ServiceService.patchService(serviceId, payload);

            // Then update status
            await updateStatus("konfirmasi");
            showDiagnosisModal = false;
        } catch (e) {
            toast.error("Gagal menyimpan diagnosa");
        }
    }

    async function submitCompletion() {
        await updateStatus("selesai", {
            actualCost: parseInt(String(completionInput.actualCost)),
            notes: completionInput.notes,
        });
        showCompletionModal = false;
    }

    async function submitReconfirm() {
        const cost = parseInt(String(reconfirmInput.cost));
        if (isNaN(cost)) {
            toast.error("Format harga salah");
            return;
        }
        if (cost <= 0) {
            toast.error("Biaya re-konfirmasi tidak boleh 0");
            return;
        }

        try {
            const userId =
                JSON.parse(localStorage.getItem("user") || "{}").id ||
                "USR-ADMIN";

            // Update details (diagnosis = notes, cost = estimate/actual)
            // Strategy: We update 'diagnosis.initial' or 'notes' with the actual diagnosis info
            // and update 'estimatedCost' or 'actualCost'.
            // Re-confirmation usually means "New estimate". So update costEstimate.
            // And append notes to diagnosis or replace it?
            // The user asked for "Actual Diagnosis". Let's put it in `description` or `notes` of status change?
            // Or update the main diagnosis field?
            // Let's safe update `notes` (which maps to Diagnosa Aktual) and `actualCost` (as new agreed price).

            const finalNotes = reconfirmInput.replacedComponent
                ? `${reconfirmInput.notes}\n\nSparepart Perlu Diganti: ${reconfirmInput.replacedComponent}`
                : reconfirmInput.notes;

            // Smart Re-confirmation:
            // If new cost is <= initial estimate, auto-approve and move to 'dikerjakan'
            const initialEstimate = serviceOrder.costEstimate || 0;
            if (cost <= initialEstimate) {
                await updateStatus("dikerjakan", {
                    notes: finalNotes,
                    actualCost: cost,
                });
                toast.success(
                    "Biaya tidak naik, status langsung lanjut dikerjakan",
                );
            } else {
                await updateStatus("re-konfirmasi", {
                    notes: finalNotes,
                    actualCost: cost,
                });
                toast.success("Re-konfirmasi terkirim ke customer");
            }
            showReconfirmModal = false;
        } catch (e) {
            toast.error("Gagal mengirim re-konfirmasi");
        }
    }

    async function addPart() {
        if (!newPart.name || newPart.qty <= 0) {
            toast.error("Nama dan qty harus diisi");
            return;
        }
        try {
            const part = {
                name: newPart.name,
                source: newPart.source,
                qty: newPart.qty,
                price: newPart.price,
                subtotal: newPart.qty * newPart.price,
            };
            const updatedParts = [...(serviceOrder.parts || []), part];
            await api.patch(`/service/${serviceId}`, { parts: updatedParts });
            toast.success("Part ditambahkan");
            newPart = { name: "", source: "stok", qty: 1, price: 0 };
            showPartsModal = false;
            await loadData();
        } catch (e) {
            toast.error("Gagal menambah part");
        }
    }

    onMount(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                currentUser = JSON.parse(userStr);
            } catch {}
        }
        loadData();
        loadTechnicians();
        loadSettings();
    });

    // Computed properties
    let canViewFinancials = $derived(
        currentUser?.role === "admin" || currentUser?.role === "kasir",
    );
    let canViewContact = $derived(
        currentUser?.role === "admin" || currentUser?.role === "kasir",
    );
    let canEditWorkflow = $derived(
        currentUser?.role === "admin" || currentUser?.role === "teknisi",
    );
    let canAssignTechnician = $derived(currentUser?.role === "admin");
    let canProcessPayment = $derived(
        currentUser?.role === "admin" || currentUser?.role === "kasir",
    );

    let totalParts = $derived(
        serviceOrder?.parts?.reduce(
            (sum: number, p: any) => sum + (p.subtotal || p.price * p.qty),
            0,
        ) || 0,
    );

    // Grand total is the actual cost (agreed total) or the estimate
    let grandTotal = $derived(
        serviceOrder?.actualCost || serviceOrder?.costEstimate || 0,
    );

    // Service fee is the remaining amount after deducting parts
    let derivedServiceFee = $derived(Math.max(0, grandTotal - totalParts));

    // Status colors and labels with premium gradients
    const STATUS_CONFIG: Record<
        string,
        {
            color: string;
            bg: string;
            gradient: string;
            shadow: string;
            label: string;
            icon: any;
        }
    > = {
        antrian: {
            color: "text-slate-700",
            bg: "bg-slate-100",
            gradient: "from-slate-500/10 to-slate-500/5",
            shadow: "shadow-slate-200",
            label: "Antrian",
            icon: Clock,
        },
        dicek: {
            color: "text-blue-700",
            bg: "bg-blue-100",
            gradient: "from-blue-500/10 to-blue-500/5",
            shadow: "shadow-blue-200",
            label: "Sedang Dicek",
            icon: Search,
        },
        konfirmasi: {
            color: "text-amber-700",
            bg: "bg-amber-100",
            gradient: "from-amber-500/10 to-amber-500/5",
            shadow: "shadow-amber-200",
            label: "Konfirmasi",
            icon: AlertCircle,
        },
        dikerjakan: {
            color: "text-purple-700",
            bg: "bg-purple-100",
            gradient: "from-purple-500/10 to-purple-500/5",
            shadow: "shadow-purple-200",
            label: "Dikerjakan",
            icon: Wrench,
        },
        selesai: {
            color: "text-green-700",
            bg: "bg-green-100",
            gradient: "from-green-500/10 to-green-500/5",
            shadow: "shadow-green-200",
            label: "Selesai",
            icon: CheckCircle,
        },
        diambil: {
            color: "text-teal-700",
            bg: "bg-teal-100",
            gradient: "from-teal-500/10 to-teal-500/5",
            shadow: "shadow-teal-200",
            label: "Sudah Diambil",
            icon: Smartphone,
        },
        "re-konfirmasi": {
            color: "text-orange-700",
            bg: "bg-orange-100",
            gradient: "from-orange-500/10 to-orange-500/5",
            shadow: "shadow-orange-200",
            label: "Re-konfirmasi",
            icon: RefreshCw,
        },
        batal: {
            color: "text-red-700",
            bg: "bg-red-100",
            gradient: "from-red-500/10 to-red-500/5",
            shadow: "shadow-red-200",
            label: "Dibatalkan",
            icon: XCircle,
        },
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
        "re-konfirmasi",
        "selesai",
        "diambil",
    ];

    function getStatusIndex(status: string) {
        const idx = STATUS_ORDER.indexOf(status);
        return idx >= 0 ? idx : 0;
    }

    // Action handlers
    async function handleComplete() {
        showCompleteConfirm = true;
    }

    async function processComplete() {
        isProcessingAction = true;
        try {
            const userId =
                JSON.parse(localStorage.getItem("user") || "{}").id ||
                "USR-ADMIN";
            await ServiceService.updateStatus(serviceId, {
                status: "selesai",
                userId,
            });
            toast.success("Service selesai!");
            refreshServiceList.update((n) => n + 1);
            loadData();
        } catch (e) {
            toast.error("Gagal update status");
        } finally {
            isProcessingAction = false;
            showCompleteConfirm = false;
        }
    }

    function openCancelModal() {
        cancelReason = "";
        showCancelModal = true;
    }

    async function handleCancel() {
        if (!cancelReason.trim()) {
            toast.error("Mohon isi alasan pembatalan");
            return;
        }
        try {
            const userId =
                JSON.parse(localStorage.getItem("user") || "{}").id ||
                "USR-ADMIN";
            await ServiceService.updateStatus(serviceId, {
                status: "batal",
                userId,
                notes: cancelReason,
            });
            toast.success("Service dibatalkan");
            showCancelModal = false;
            refreshServiceList.update((n) => n + 1);
            loadData();
        } catch (e) {
            toast.error("Gagal membatalkan");
        }
    }

    async function handlePickup() {
        // Old logic: showPickupConfirm = true;
        // New logic: Open Wizard
        showPickupWizard = true;
    }

    // processPickup is now handled by the Wizard's onComplete callback
    /*
    async function processPickup() { ... } 
    */

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

    let printMode = $state<"receipt" | "sticker">("receipt");

    function handlePrint(mode: "receipt" | "sticker" = "receipt") {
        printMode = mode;
        showPrintPreview = true;
    }

    async function handleDelete() {
        showDeleteConfirm = true;
    }

    async function processDelete() {
        isProcessingAction = true;
        try {
            await api.delete(`/service/${serviceId}`);
            toast.success("Service dihapus");
            refreshServiceList.update((n) => n + 1);
            goto("/service");
        } catch (e) {
            toast.error("Gagal hapus");
        } finally {
            isProcessingAction = false;
            showDeleteConfirm = false;
        }
    }

    async function handleStartWork() {
        showStartWorkConfirm = true;
    }

    async function processStartWork() {
        isProcessingAction = true;
        try {
            await updateStatus("dikerjakan");
        } catch (e) {
            toast.error("Gagal memulai pengerjaan");
        } finally {
            isProcessingAction = false;
            showStartWorkConfirm = false;
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

    let isArchived = $derived.by(() => {
        if (!serviceOrder || !serviceSettings?.enableVirtualArchive)
            return false;
        const ARCHIVE_STATUSES = ["selesai", "diambil", "batal"];
        if (!ARCHIVE_STATUSES.includes(serviceOrder.status)) return false;

        const exclusions = serviceSettings.archiveExclusions || [];
        if (exclusions.includes(serviceOrder.status)) return false;

        const date = serviceOrder.updatedAt
            ? new Date(serviceOrder.updatedAt)
            : new Date(serviceOrder.dateIn);
        const diffTime = Math.abs(new Date().getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > (serviceSettings.autoCloseAfterDays || 60);
    });

    let canLiquidate = $derived(
        serviceSettings?.enableLiquidation &&
            isArchived &&
            currentUser?.role === "admin",
    );

    async function handleLiquidate(type: "resell" | "cannibalize") {
        liquidationType = type;
        showLiquidateConfirm = true;
    }

    async function processLiquidation() {
        isProcessingAction = true;
        try {
            const userId =
                JSON.parse(localStorage.getItem("user") || "{}").id ||
                "USR-ADMIN";

            let note = "";
            let newStatus = "diambil";

            if (liquidationType === "resell") {
                note = `[LIQUIDATION] Unit dijual kembali (Resell). Diproses oleh ${currentUser?.name || "Admin"}.`;
            } else {
                note = `[LIQUIDATION] Unit dikanibalisasi untuk sparepart. Diproses oleh ${currentUser?.name || "Admin"}.`;
            }

            const currentNotes = serviceOrder.notes || "";
            const finalNotes = currentNotes
                ? `${currentNotes}\n\n${note}`
                : note;

            await ServiceService.updateStatus(serviceId, {
                status: newStatus as any,
                userId,
                notes: finalNotes,
            });

            toast.success(
                `Unit berhasil dilikuidasi: ${liquidationType === "resell" ? "Jual Unit" : "Kanibalisasi"}`,
            );
            loadData();
        } catch (e) {
            toast.error("Gagal memproses likuidasi");
        } finally {
            isProcessingAction = false;
            showLiquidateConfirm = false;
        }
    }

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
        <!-- Hero Header with Status-driven Theme -->
        <div
            class="relative overflow-hidden bg-card rounded-[2rem] shadow-xl border-2 transition-all duration-500 {statusConfig.shadow} mb-8"
        >
            <div
                class="absolute inset-0 bg-gradient-to-br {statusConfig.gradient} opacity-50"
            ></div>

            <div class="relative p-6 md:p-8">
                <div
                    class="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                    <div class="flex items-start gap-5">
                        <Button
                            variant="secondary"
                            size="icon"
                            onclick={() => goto("/service")}
                            class="shrink-0 rounded-2xl bg-white/50 backdrop-blur-sm border shadow-sm hover:scale-105 transition-transform"
                        >
                            <ArrowLeft class="h-5 w-5" />
                        </Button>
                        <div>
                            <div class="flex items-center gap-3 flex-wrap">
                                <h1
                                    class="text-3xl font-black tracking-tight font-heading"
                                >
                                    {serviceOrder.no}
                                </h1>
                                <Badge
                                    class="{statusConfig.bg} {statusConfig.color} px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ring-2 ring-white"
                                >
                                    <statusConfig.icon
                                        class="h-3.5 w-3.5 mr-1.5"
                                    />
                                    {statusConfig.label}
                                </Badge>
                                {#if serviceOrder.isWalkin}
                                    <Badge
                                        class="bg-emerald-500 text-white rounded-full px-3 py-1 font-bold shadow-sm shadow-emerald-200"
                                    >
                                        <Clock class="h-3.5 w-3.5 mr-1.5" /> Walk-in
                                    </Badge>
                                {:else}
                                    <Badge
                                        variant="outline"
                                        class="rounded-full px-3 py-1 font-bold bg-white/50 backdrop-blur-sm"
                                    >
                                        <Calendar class="h-3.5 w-3.5 mr-1.5" /> Regular
                                    </Badge>
                                {/if}
                            </div>
                            <div class="flex items-center gap-6 mt-4">
                                <div class="flex flex-col">
                                    <span
                                        class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none"
                                        >Customer</span
                                    >
                                    <span
                                        class="font-black text-xl tracking-tight text-slate-800 leading-none"
                                    >
                                        {serviceOrder.customer?.name ||
                                            "Unknown"}
                                    </span>
                                </div>
                                <div class="w-px h-8 bg-slate-200"></div>
                                <div class="flex flex-col">
                                    <span
                                        class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none"
                                        >Penerima</span
                                    >
                                    <div class="flex items-center gap-2">
                                        <div
                                            class="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center border shadow-sm"
                                        >
                                            <User
                                                class="h-3 w-3 text-slate-400"
                                            />
                                        </div>
                                        <span
                                            class="text-sm font-bold text-slate-600 tracking-tight uppercase"
                                        >
                                            {serviceOrder.creator?.name ||
                                                "Admin"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        class="flex flex-wrap items-center gap-3 bg-white/60 backdrop-blur-xl p-2.5 rounded-[2rem] border-2 border-white shadow-xl"
                    >
                        <Button
                            variant="secondary"
                            size="sm"
                            onclick={() => handlePrint("sticker")}
                            class="rounded-full font-black text-[10px] uppercase tracking-widest bg-white hover:bg-slate-50 border shadow-sm px-6 h-10 transition-all hover:scale-105 active:scale-95"
                        >
                            <Printer class="h-4 w-4 mr-2 text-slate-400" /> Cetak
                            Label
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onclick={() => handlePrint("receipt")}
                            class="rounded-full font-black text-[10px] uppercase tracking-widest bg-white hover:bg-slate-50 border shadow-sm px-6 h-10 transition-all hover:scale-105 active:scale-95"
                        >
                            <Printer class="h-4 w-4 mr-2 text-slate-400" /> Cetak
                            Nota
                        </Button>

                        <div
                            class="w-px h-6 bg-slate-200 mx-1 hidden sm:block"
                        ></div>

                        {#if canViewContact}
                            <Button
                                variant="secondary"
                                size="sm"
                                class="rounded-full font-black text-[10px] uppercase tracking-widest bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200 px-6 h-10 transition-all hover:scale-105 active:scale-95 border-none"
                                onclick={handleChatCustomer}
                            >
                                <MessageCircle class="h-4 w-4 mr-2" /> WhatsApp
                            </Button>
                        {/if}
                        {#if canLiquidate}
                            <div
                                class="ml-2 pl-2 border-l border-slate-200 hidden sm:block"
                            >
                                <DropdownMenu.Root>
                                    <DropdownMenu.Trigger
                                        class={cn(
                                            buttonVariants({
                                                variant: "secondary",
                                                size: "sm",
                                            }),
                                            "rounded-full font-black text-[10px] uppercase tracking-widest bg-red-100 text-red-600 hover:bg-red-200 shadow-sm border-none px-4 h-10 transition-all hover:scale-105 active:scale-95",
                                        )}
                                    >
                                        <Gavel class="h-4 w-4 mr-2" /> Likuidasi
                                    </DropdownMenu.Trigger>
                                    <DropdownMenu.Content>
                                        <DropdownMenu.Label
                                            >Opsi Likuidasi</DropdownMenu.Label
                                        >
                                        <DropdownMenu.Separator />
                                        <DropdownMenu.Item
                                            onclick={() =>
                                                handleLiquidate("resell")}
                                        >
                                            Jual Unit (Resell)
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Item
                                            onclick={() =>
                                                handleLiquidate("cannibalize")}
                                        >
                                            Kanibalisasi (Sparepart)
                                        </DropdownMenu.Item>
                                    </DropdownMenu.Content>
                                </DropdownMenu.Root>
                            </div>
                        {/if}
                        {#if canAssignTechnician}
                            <Button
                                variant="secondary"
                                size="sm"
                                class="rounded-full font-black text-[10px] uppercase tracking-widest bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-200 px-6 h-10 transition-all hover:scale-105 active:scale-95 border-none"
                                onclick={() => (showAssignModal = true)}
                            >
                                <UserPlus class="h-4 w-4 mr-2" /> Tunjuk Teknisi
                            </Button>
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
            <!-- Left Sidebar: Timeline & Quick Info -->
            <aside class="space-y-6">
                <!-- Status & Progress Card -->
                <div
                    class="relative overflow-hidden bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-6"
                >
                    <div class="absolute top-0 right-0 p-4 opacity-5">
                        <Activity class="h-16 w-16" />
                    </div>

                    <h3
                        class="font-bold text-sm uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2"
                    >
                        <Activity class="h-4 w-4" /> Progres Service
                    </h3>

                    <!-- Status Progress -->
                    <div
                        class="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100"
                    >
                        <div
                            class="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3"
                        >
                            <span>Check-in</span>
                            <span>Target</span>
                        </div>
                        <div
                            class="h-3 bg-slate-200 rounded-full overflow-hidden p-0.5 border shadow-inner"
                        >
                            <div
                                class="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-1000 ease-out shadow-sm"
                                style="width: {Math.max(
                                    5,
                                    Math.min(progress, 100),
                                )}%"
                            ></div>
                        </div>
                        <p
                            class="text-[10px] font-bold text-center mt-2 text-primary uppercase tracking-tighter"
                        >
                            {Math.round(progress)}% Selesai
                        </p>
                    </div>

                    <!-- Dates Section -->
                    <div class="space-y-4 mb-8">
                        <div
                            class="flex items-center gap-3 p-3 bg-white rounded-2xl border shadow-sm group hover:border-primary/30 transition-colors"
                        >
                            <div
                                class="p-2 bg-slate-100 rounded-xl group-hover:bg-primary/10 transition-colors"
                            >
                                <Calendar
                                    class="h-4 w-4 text-slate-500 group-hover:text-primary"
                                />
                            </div>
                            <div class="flex flex-col">
                                <span
                                    class="text-[10px] font-black uppercase tracking-tighter text-slate-400"
                                    >Tgl Masuk</span
                                >
                                <span class="text-xs font-bold"
                                    >{formatDate(serviceOrder.dateIn)}</span
                                >
                            </div>
                        </div>

                        {#if serviceOrder.estimatedCompletionDate}
                            <div
                                class="flex items-center gap-3 p-3 bg-white rounded-2xl border shadow-sm group hover:border-amber-500/30 transition-colors"
                            >
                                <div
                                    class="p-2 bg-slate-100 rounded-xl group-hover:bg-amber-500/10 transition-colors"
                                >
                                    <Clock
                                        class="h-4 w-4 text-slate-500 group-hover:text-amber-600"
                                    />
                                </div>
                                <div class="flex flex-col">
                                    <span
                                        class="text-[10px] font-black uppercase tracking-tighter text-slate-400"
                                        >Estimasi Selesai</span
                                    >
                                    <span
                                        class="text-xs font-bold text-amber-600"
                                        >{formatDate(
                                            serviceOrder.estimatedCompletionDate,
                                        )}</span
                                    >
                                </div>
                            </div>
                        {/if}

                        {#if serviceOrder.dateOut}
                            <div
                                class="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm group"
                            >
                                <div class="p-2 bg-emerald-500/10 rounded-xl">
                                    <CheckCircle
                                        class="h-4 w-4 text-emerald-600"
                                    />
                                </div>
                                <div class="flex flex-col">
                                    <span
                                        class="text-[10px] font-black uppercase tracking-tighter text-emerald-400"
                                        >Selesai/Keluar</span
                                    >
                                    <span
                                        class="text-xs font-black text-emerald-700"
                                        >{formatDate(
                                            serviceOrder.dateOut,
                                        )}</span
                                    >
                                </div>
                            </div>
                        {/if}
                    </div>

                    <!-- Warranty Badge -->
                    {#if serviceOrder.warranty && serviceOrder.warranty !== "Tanpa Garansi" && serviceOrder.warranty !== "none"}
                        <div
                            class="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.5rem] text-white shadow-lg shadow-indigo-100 mb-6"
                        >
                            <div class="flex items-center gap-2 mb-3">
                                <ShieldCheck class="h-5 w-5" />
                                <span
                                    class="text-xs font-black uppercase tracking-widest"
                                    >Garansi Aktif</span
                                >
                            </div>
                            <div class="flex items-end justify-between">
                                <span class="text-2xl font-black"
                                    >{serviceOrder.warranty}</span
                                >
                                <div
                                    class="text-[10px] font-bold opacity-80 text-right"
                                >
                                    Sampai<br />{formatDate(
                                        serviceOrder.warrantyExpiryDate,
                                    ).split(",")[0]}
                                </div>
                            </div>
                        </div>
                    {/if}

                    <Separator class="mb-6" />

                    <!-- Activity View -->
                    <h3
                        class="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2"
                    >
                        Aktivitas Terkini
                    </h3>

                    <div
                        class="space-y-6 relative before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-slate-100"
                    >
                        {#each (serviceOrder.timeline || [])
                            .slice(-3)
                            .reverse() as item, i}
                            <div class="relative pl-8 group">
                                <div
                                    class="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-slate-200 group-hover:border-primary transition-colors flex items-center justify-center z-10"
                                >
                                    <div
                                        class="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-primary transition-colors"
                                    ></div>
                                </div>
                                <div class="flex flex-col">
                                    <span
                                        class="text-xs font-black tracking-tight"
                                        >{item.event}</span
                                    >
                                    <span
                                        class="text-[10px] text-slate-400 font-bold uppercase tracking-tighter"
                                        >{item.time}</span
                                    >
                                    {#if item.details?.technician}
                                        <div
                                            class="mt-1 px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 inline-block w-fit uppercase"
                                        >
                                            {item.details.technician}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                        {#if !serviceOrder.timeline?.length}
                            <p
                                class="text-[10px] text-slate-400 italic font-bold text-center py-4"
                            >
                                Belum ada aktivitas
                            </p>
                        {/if}
                    </div>
                </div>

                <!-- Technician Card -->
                <div
                    class="group relative overflow-hidden bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-6 hover:border-primary/20 transition-all duration-300"
                >
                    <div class="flex items-center justify-between mb-4">
                        <h3
                            class="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2"
                        >
                            <Wrench class="h-4 w-4" /> Teknisi Pengerjaan
                        </h3>
                    </div>

                    <div class="flex items-center gap-4">
                        <div class="relative">
                            <div
                                class="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden"
                            >
                                <User class="h-8 w-8 text-slate-400" />
                            </div>
                            <div
                                class="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-emerald-500 border-2 border-white flex items-center justify-center"
                            >
                                <CheckCircle class="h-3 w-3 text-white" />
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <p
                                class="font-black text-lg tracking-tight leading-none mb-1 text-slate-800"
                            >
                                {serviceOrder.technician?.name ||
                                    "Belum Ditentukan"}
                            </p>
                            <span
                                class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter"
                            >
                                {serviceOrder.technician?.id
                                    ? "Teknisi Utama"
                                    : "Hubungi Admin"}
                            </span>
                        </div>
                    </div>
                </div>
            </aside>

            <!-- Main Content -->
            <main class="space-y-6">
                <!-- Customer & Device Info -->
                <div class="grid gap-6 md:grid-cols-2">
                    <!-- Customer Card -->
                    <div
                        class="group relative overflow-hidden bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8 hover:border-primary/20 transition-all duration-300"
                    >
                        <div
                            class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"
                        >
                            <User class="h-24 w-24" />
                        </div>
                        <h3
                            class="font-bold text-xl mb-6 flex items-center gap-3"
                        >
                            <div class="p-2 bg-primary/10 rounded-xl">
                                <User class="h-6 w-6 text-primary" />
                            </div>
                            Data Pelanggan
                        </h3>
                        <div class="space-y-4 text-sm relative z-10">
                            <div class="flex flex-col gap-1">
                                <span
                                    class="text-slate-400 font-bold uppercase text-[10px] tracking-widest"
                                    >Nama Lengkap</span
                                >
                                <span class="text-lg font-black"
                                    >{serviceOrder.customer?.name || "-"}</span
                                >
                            </div>
                            <div class="flex flex-col gap-1">
                                <span
                                    class="text-slate-400 font-bold uppercase text-[10px] tracking-widest"
                                    >Nomor Telepon</span
                                >
                                <span class="text-lg font-mono font-bold">
                                    {#if canViewContact}
                                        {serviceOrder.customer?.phone || "-"}
                                    {:else}
                                        {serviceOrder.customer?.phone
                                            ? serviceOrder.customer.phone.slice(
                                                  0,
                                                  4,
                                              ) +
                                              "****" +
                                              serviceOrder.customer.phone.slice(
                                                  -3,
                                              )
                                            : "-"}
                                    {/if}
                                </span>
                            </div>
                            {#if serviceOrder.customer?.address}
                                <div class="flex flex-col gap-1">
                                    <span
                                        class="text-slate-400 font-bold uppercase text-[10px] tracking-widest"
                                        >Alamat</span
                                    >
                                    <span
                                        class="font-medium text-slate-600 italic"
                                    >
                                        {#if canViewContact}
                                            {serviceOrder.customer.address}
                                        {:else}
                                            Hidden
                                        {/if}
                                    </span>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <!-- Device Card -->
                    <div
                        class="group relative overflow-hidden bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8 hover:border-blue-500/20 transition-all duration-300"
                    >
                        <div
                            class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"
                        >
                            <Smartphone class="h-24 w-24" />
                        </div>
                        <h3
                            class="font-bold text-xl mb-6 flex items-center gap-3"
                        >
                            <div class="p-2 bg-blue-500/10 rounded-xl">
                                <Smartphone class="h-6 w-6 text-blue-500" />
                            </div>
                            Spesifikasi Unit
                        </h3>
                        <div class="space-y-4 text-sm relative z-10">
                            <div class="flex flex-col gap-1">
                                <span
                                    class="text-slate-400 font-bold uppercase text-[10px] tracking-widest"
                                    >Merk & Model</span
                                >
                                <span class="text-lg font-black uppercase"
                                    >{serviceOrder.phone?.brand || "-"}
                                    {serviceOrder.phone?.model || ""}</span
                                >
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                {#if serviceOrder.phone?.imei}
                                    <div class="flex flex-col gap-1">
                                        <span
                                            class="text-slate-400 font-bold uppercase text-[10px] tracking-widest"
                                            >IMEI / SN</span
                                        >
                                        <span class="font-mono font-bold"
                                            >{serviceOrder.phone.imei}</span
                                        >
                                    </div>
                                {/if}
                                {#if serviceOrder.phone?.status}
                                    <div class="flex flex-col gap-1">
                                        <span
                                            class="text-slate-400 font-bold uppercase text-[10px] tracking-widest"
                                            >Status Unit</span
                                        >
                                        <div>
                                            <Badge
                                                variant="secondary"
                                                class="font-bold uppercase tracking-tighter bg-slate-100"
                                            >
                                                {serviceOrder.phone.status}
                                            </Badge>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Physical Condition & Completeness -->
                {#if serviceOrder.phone?.physical?.length || serviceOrder.phone?.completeness?.length}
                    <div
                        class="bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8"
                    >
                        <h3
                            class="font-bold text-xl mb-6 flex items-center gap-3"
                        >
                            <div class="p-2 bg-slate-100 rounded-xl">
                                <FileText class="h-6 w-6 text-slate-500" />
                            </div>
                            Kondisi & Kelengkapan
                        </h3>
                        <div class="grid gap-8 md:grid-cols-2">
                            {#if serviceOrder.phone?.physical?.length}
                                <div class="space-y-3">
                                    <p
                                        class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full w-fit border"
                                    >
                                        Fisik Perangkat
                                    </p>
                                    <div class="flex flex-wrap gap-2">
                                        {#each serviceOrder.phone.physical as p}
                                            <Badge
                                                variant="secondary"
                                                class="rounded-xl px-4 py-1.5 font-bold uppercase tracking-tighter bg-slate-100 text-slate-600 border-none"
                                            >
                                                {getPhysicalLabel(p)}
                                            </Badge>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                            {#if serviceOrder.phone?.completeness?.length}
                                <div class="space-y-3">
                                    <p
                                        class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full w-fit border"
                                    >
                                        Aksesoris / Kelengkapan
                                    </p>
                                    <div class="flex flex-wrap gap-2">
                                        {#each serviceOrder.phone.completeness as c}
                                            <Badge
                                                variant="outline"
                                                class="rounded-xl px-4 py-1.5 font-bold uppercase tracking-tighter border-slate-200 text-slate-500 bg-white shadow-sm"
                                            >
                                                {getCompletenessLabel(c)}
                                            </Badge>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}

                <!-- PIN/Pattern Display -->
                {#if serviceOrder.phone?.pin || serviceOrder.phone?.pattern}
                    <div
                        class="bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8"
                    >
                        <h3
                            class="font-bold text-xl mb-6 flex items-center gap-3"
                        >
                            <div class="p-2 bg-slate-100 rounded-xl">
                                <Shield class="h-6 w-6 text-slate-500" />
                            </div>
                            Keamanan Perangkat
                        </h3>
                        <div class="flex flex-wrap items-center gap-12">
                            {#if serviceOrder.phone?.pin}
                                <div class="space-y-2">
                                    <p
                                        class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full w-fit border"
                                    >
                                        PIN Access
                                    </p>
                                    <p
                                        class="font-mono text-4xl font-black tracking-[0.2em] text-primary"
                                    >
                                        {serviceOrder.phone.pin}
                                    </p>
                                </div>
                            {/if}
                            {#if serviceOrder.phone?.pattern && Array.isArray(serviceOrder.phone.pattern)}
                                <div class="space-y-4">
                                    <p
                                        class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full w-fit border"
                                    >
                                        Pattern Lock
                                    </p>
                                    <div
                                        class="p-4 bg-slate-50 rounded-3xl border shadow-inner"
                                    >
                                        <PatternLock
                                            value={serviceOrder.phone.pattern}
                                            readonly
                                            size={140}
                                        />
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}

                <!-- Photos -->
                {#if serviceOrder.photos?.length}
                    <div
                        class="bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8"
                    >
                        <h3
                            class="font-bold text-xl mb-6 flex items-center gap-3"
                        >
                            <div class="p-2 bg-slate-100 rounded-xl">
                                <Camera class="h-6 w-6 text-slate-500" />
                            </div>
                            Dokumentasi Fisik Unit
                        </h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {#each serviceOrder.photos as photo, i}
                                <button
                                    class="group aspect-square rounded-[1.5rem] overflow-hidden border-2 border-slate-100 hover:border-primary transition-all shadow-sm"
                                    onclick={() => window.open(photo, "_blank")}
                                >
                                    <img
                                        src={photo}
                                        alt="Kondisi {i + 1}"
                                        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </button>
                            {/each}
                        </div>
                    </div>
                {/if}

                <!-- Complaint & Diagnosis -->
                <div class="grid gap-6 md:grid-cols-2">
                    <div
                        class="bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8 border-l-[6px] border-l-amber-400"
                    >
                        <h3
                            class="font-bold text-xl mb-4 flex items-center gap-3"
                        >
                            <AlertTriangle class="h-6 w-6 text-amber-500" /> Keluhan
                            Utama
                        </h3>
                        <div
                            class="p-4 bg-amber-50 rounded-2xl font-medium text-slate-700 leading-relaxed border border-amber-100"
                        >
                            "{serviceOrder.complaint || "-"}"
                        </div>
                    </div>

                    {#if serviceOrder.diagnosis && serviceOrder.diagnosis !== "null" && serviceOrder.diagnosis !== "{}"}
                        <div
                            class="bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8 border-l-[6px] border-l-blue-400"
                        >
                            <h3
                                class="font-bold text-xl mb-4 flex items-center gap-3"
                            >
                                <Wrench class="h-6 w-6 text-blue-500" /> Analisa
                                Teknisi
                            </h3>

                            {#if serviceOrder.diagnosis}
                                {@const diag =
                                    typeof serviceOrder.diagnosis === "string"
                                        ? serviceOrder.diagnosis.startsWith("{")
                                            ? JSON.parse(serviceOrder.diagnosis)
                                            : null
                                        : serviceOrder.diagnosis}

                                {#if diag && typeof diag === "object"}
                                    <div class="space-y-4">
                                        {#if diag.initial}
                                            <div
                                                class="p-4 bg-blue-50 rounded-2xl border border-blue-100"
                                            >
                                                <p
                                                    class="font-bold text-slate-700"
                                                >
                                                    {diag.initial}
                                                </p>
                                            </div>
                                        {/if}
                                        {#if diag.possibleCauses}
                                            <div class="px-4">
                                                <h4
                                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"
                                                >
                                                    Kemungkinan Penyebab
                                                </h4>
                                                <p
                                                    class="text-sm font-medium text-slate-600 border-l-2 border-blue-200 pl-4"
                                                >
                                                    {diag.possibleCauses}
                                                </p>
                                            </div>
                                        {/if}
                                    </div>
                                {:else}
                                    <div
                                        class="p-4 bg-blue-50 rounded-2xl border border-blue-100"
                                    >
                                        <p class="font-bold text-slate-700">
                                            {serviceOrder.diagnosis}
                                        </p>
                                    </div>
                                {/if}
                            {:else}
                                <p class="text-sm text-muted-foreground italic">
                                    Belum ada diagnosa
                                </p>
                            {/if}

                            {#if serviceOrder.notes}
                                {@const noteParts = serviceOrder.notes.split(
                                    "\n\nSparepart Perlu Diganti: ",
                                )}
                                <div
                                    class="mt-6 pt-6 border-t border-dashed border-slate-200"
                                >
                                    <h4
                                        class="font-black text-xs uppercase tracking-[0.2em] text-emerald-600 mb-4 flex items-center gap-2"
                                    >
                                        <CheckCircle class="h-4 w-4" /> Solusi &
                                        Pengerjaan
                                    </h4>

                                    <div class="space-y-4">
                                        {#if noteParts[0]}
                                            <div
                                                class="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 font-bold"
                                            >
                                                {noteParts[0].trim()}
                                            </div>
                                        {/if}
                                        {#if noteParts[1]}
                                            <div
                                                class="p-4 bg-slate-50 rounded-2xl border border-slate-100"
                                            >
                                                <span
                                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1"
                                                    >Parts Diganti:</span
                                                >
                                                <p
                                                    class="font-black text-slate-700"
                                                >
                                                    {noteParts[1].trim()}
                                                </p>
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {:else}
                        <div
                            class="bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center"
                        >
                            <div
                                class="p-3 bg-white rounded-2xl mb-4 shadow-sm"
                            >
                                <Search class="h-8 w-8 text-slate-300" />
                            </div>
                            <p
                                class="text-sm font-bold text-slate-400 max-w-[200px]"
                            >
                                Menunggu diagnosa teknisi untuk informasi lebih
                                detail.
                            </p>
                        </div>
                    {/if}
                </div>

                <!-- QC Section -->
                {#if serviceOrder.phone?.initialQC || serviceOrder.phone?.qc || (serviceOrder.phone?.status && ["mati_total", "blank", "restart", "bootloop"].includes(serviceOrder.phone.status))}
                    <div
                        class="bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8"
                    >
                        <h3
                            class="font-bold text-xl mb-6 flex items-center gap-3"
                        >
                            <div class="p-2 bg-blue-500/10 rounded-xl">
                                <CheckCircle class="h-6 w-6 text-blue-500" />
                            </div>
                            Quality Control Perangkat
                        </h3>
                        <div class="grid gap-8 md:grid-cols-2">
                            <!-- QC Awal -->
                            <div class="space-y-4">
                                <p
                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full w-fit border"
                                >
                                    Pengecekan Awal
                                </p>
                                {#if serviceOrder.phone?.initialQC && Object.keys(serviceOrder.phone.initialQC).length > 0}
                                    <div
                                        class="grid grid-cols-1 gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100"
                                    >
                                        {#each Object.entries(serviceOrder.phone.initialQC) as [key, value]}
                                            <div
                                                class="flex items-center justify-between text-sm group"
                                            >
                                                <span
                                                    class="text-slate-500 font-medium group-hover:text-slate-800 transition-colors"
                                                >
                                                    {key
                                                        .replace(
                                                            /([A-Z])/g,
                                                            " $1",
                                                        )
                                                        .trim()}
                                                </span>
                                                {#if value}
                                                    <div
                                                        class="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase"
                                                    >
                                                        <span>OK</span>
                                                        <CheckCircle
                                                            class="h-4 w-4"
                                                        />
                                                    </div>
                                                {:else}
                                                    <div
                                                        class="flex items-center gap-1.5 text-rose-500 font-black text-[10px] uppercase"
                                                    >
                                                        <span>FAIL</span>
                                                        <XCircle
                                                            class="h-4 w-4"
                                                        />
                                                    </div>
                                                {/if}
                                            </div>
                                        {/each}
                                    </div>
                                {:else if serviceOrder.phone?.status && ["mati_total", "blank", "restart", "bootloop"].includes(serviceOrder.phone.status)}
                                    <div
                                        class="flex flex-col items-center justify-center p-8 bg-amber-50 rounded-2xl border-2 border-dashed border-amber-200 text-center"
                                    >
                                        <AlertCircle
                                            class="h-8 w-8 text-amber-500 mb-2"
                                        />
                                        <p
                                            class="text-xs font-black text-amber-700 uppercase tracking-tighter"
                                        >
                                            QC Dileveri Lewati
                                        </p>
                                        <span
                                            class="text-[10px] text-amber-600 font-bold uppercase"
                                            >Unit {serviceOrder.phone?.status?.replace(
                                                /_/g,
                                                " ",
                                            )}</span
                                        >
                                    </div>
                                {:else}
                                    <div
                                        class="p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center"
                                    >
                                        <p
                                            class="text-xs font-bold text-slate-400 uppercase"
                                        >
                                            Tidak ada data QC awal
                                        </p>
                                    </div>
                                {/if}
                            </div>

                            <!-- QC Akhir -->
                            <div class="space-y-4">
                                <p
                                    class="text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full w-fit border border-emerald-100 text-emerald-600"
                                >
                                    Hasil Pengerjaan
                                </p>
                                {#if serviceOrder.phone?.qc?.after}
                                    <div
                                        class="grid grid-cols-1 gap-2 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100"
                                    >
                                        {#each Object.entries(serviceOrder.phone.qc.after) as [key, value]}
                                            <div
                                                class="flex items-center justify-between text-sm group"
                                            >
                                                <span
                                                    class="text-emerald-900/70 font-bold group-hover:text-emerald-900 transition-colors lowercase"
                                                >
                                                    {key}
                                                </span>
                                                {#if value}
                                                    <div
                                                        class="p-1 bg-emerald-500 rounded-lg"
                                                    >
                                                        <CheckCircle
                                                            class="h-3 w-3 text-white"
                                                        />
                                                    </div>
                                                {:else}
                                                    <div
                                                        class="p-1 bg-rose-500 rounded-lg"
                                                    >
                                                        <XCircle
                                                            class="h-3 w-3 text-white"
                                                        />
                                                    </div>
                                                {/if}
                                            </div>
                                        {/each}
                                    </div>
                                {:else}
                                    <div
                                        class="p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center"
                                    >
                                        <Loader2
                                            class="h-8 w-8 text-slate-300 animate-spin mb-2"
                                        />
                                        <p
                                            class="text-xs font-bold text-slate-400 uppercase"
                                        >
                                            Menunggu QC Akhir
                                        </p>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        {#if serviceOrder.phone?.qc?.notes}
                            <div
                                class="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 italic font-medium text-slate-600 text-sm"
                            >
                                <span
                                    class="not-italic text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2"
                                    >Catatan QC Lapangan:</span
                                >
                                "{serviceOrder.phone.qc.notes}"
                            </div>
                        {/if}
                    </div>
                {/if}

                <!-- Payment Section -->
                {#if serviceOrder.isWalkin && (serviceOrder.payments || serviceOrder.paymentMethod)}
                    <div
                        class="bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8 border-l-[6px] border-l-emerald-500"
                    >
                        <div class="flex items-center justify-between mb-8">
                            <h3
                                class="font-bold text-xl flex items-center gap-3"
                            >
                                <div class="p-2 bg-emerald-500/10 rounded-xl">
                                    <CreditCard
                                        class="h-6 w-6 text-emerald-600"
                                    />
                                </div>
                                Informasi Pembayaran
                            </h3>
                            <div class="flex flex-col items-end">
                                <span
                                    class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none"
                                    >Status</span
                                >
                                <Badge
                                    class="bg-emerald-500 text-white font-black uppercase tracking-widest px-4 border-none shadow-sm shadow-emerald-200"
                                    >LUNAS</Badge
                                >
                            </div>
                        </div>

                        <div class="grid gap-8 md:grid-cols-2">
                            <div class="space-y-4">
                                <div
                                    class="p-6 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 hover:bg-white transition-colors"
                                >
                                    <span
                                        class="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2"
                                        >Metode</span
                                    >
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="p-2.5 bg-white rounded-xl shadow-sm border text-slate-400"
                                        >
                                            {#if serviceOrder.paymentMethod === "transfer"}
                                                <RefreshCw class="h-5 w-5" />
                                            {:else}
                                                <CreditCard class="h-5 w-5" />
                                            {/if}
                                        </div>
                                        <span
                                            class="text-2xl font-black text-slate-800 tracking-tight uppercase"
                                        >
                                            {serviceOrder.paymentMethod ||
                                                "CASH"}
                                        </span>
                                    </div>
                                </div>

                                {#if serviceOrder.transferDetails}
                                    <div
                                        class="p-6 bg-blue-50/50 rounded-[1.5rem] border border-blue-100 relative overflow-hidden group hover:bg-blue-50 transition-colors"
                                    >
                                        <div
                                            class="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity"
                                        >
                                            <RefreshCw
                                                class="h-24 w-24 text-blue-500"
                                            />
                                        </div>
                                        <span
                                            class="text-[10px] font-black uppercase tracking-widest text-blue-400 block mb-3 relative z-10"
                                            >Konfirmasi Transfer</span
                                        >
                                        <div class="space-y-1 relative z-10">
                                            <p
                                                class="text-[10px] font-black text-blue-900/40 uppercase tracking-widest"
                                            >
                                                Bank {serviceOrder
                                                    .transferDetails.bankName}
                                            </p>
                                            <p
                                                class="text-2xl font-black text-blue-900 tracking-tighter leading-none"
                                            >
                                                {serviceOrder.transferDetails
                                                    .accountNumber}
                                            </p>
                                            <p
                                                class="text-xs font-bold text-blue-700/60 border-t border-blue-200/50 pt-2 mt-2 uppercase tracking-widest"
                                            >
                                                A.N. {serviceOrder
                                                    .transferDetails
                                                    .accountHolder}
                                            </p>
                                        </div>
                                    </div>
                                {/if}
                            </div>

                            <div class="space-y-6">
                                <div
                                    class="flex flex-col gap-1 p-6 bg-slate-50/50 rounded-[1.5rem] border border-slate-100"
                                >
                                    <span
                                        class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                                        >Total Nominal</span
                                    >
                                    <div class="flex items-baseline gap-1">
                                        <span
                                            class="text-sm font-bold text-slate-400 uppercase"
                                            >Rp</span
                                        >
                                        <span
                                            class="text-4xl font-black text-slate-800 tracking-tighter"
                                        >
                                            {(
                                                serviceOrder.actualCost || 0
                                            ).toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                </div>

                                {#if serviceOrder.warranty && serviceOrder.warranty !== "none"}
                                    <div
                                        class="p-6 bg-indigo-50/50 rounded-[1.5rem] border border-indigo-100 group hover:bg-indigo-50 transition-colors"
                                    >
                                        <div
                                            class="flex items-center gap-3 mb-2"
                                        >
                                            <Shield
                                                class="h-5 w-5 text-indigo-500"
                                            />
                                            <span
                                                class="text-[10px] font-black uppercase tracking-widest text-indigo-400"
                                                >Garansi Toko</span
                                            >
                                        </div>
                                        <p
                                            class="text-xl font-black text-indigo-900 leading-tight"
                                        >
                                            {serviceOrder.warranty}
                                            {#if serviceOrder.warrantyExpiryDate}
                                                <span
                                                    class="block text-[10px] font-bold text-indigo-400/60 uppercase mt-1"
                                                    >Berlaku s/d {formatDate(
                                                        serviceOrder.warrantyExpiryDate,
                                                    ).split(",")[0]}</span
                                                >
                                            {/if}
                                        </p>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- Parts Used -->
                {#if serviceOrder.parts?.length}
                    <div
                        class="bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8"
                    >
                        <h3
                            class="font-bold text-xl mb-6 flex items-center gap-3"
                        >
                            <div class="p-2 bg-slate-100 rounded-xl">
                                <Wrench class="h-6 w-6 text-slate-500" />
                            </div>
                            Suku Cadang / Spareparts
                        </h3>
                        <div
                            class="overflow-hidden bg-slate-50/50 rounded-2xl border border-slate-100"
                        >
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="border-b bg-slate-100/50">
                                        <th
                                            class="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400"
                                            >Nama Part</th
                                        >
                                        <th
                                            class="text-center py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400"
                                            >Sumber</th
                                        >
                                        <th
                                            class="text-center py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400"
                                            >Qty</th
                                        >
                                        <th
                                            class="text-right py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400"
                                            >Harga</th
                                        >
                                        <th
                                            class="text-right py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400"
                                            >Total</th
                                        >
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each serviceOrder.parts as part}
                                        <tr
                                            class="border-b border-slate-100 last:border-none group hover:bg-white transition-colors"
                                        >
                                            <td
                                                class="py-4 px-6 font-bold text-slate-700"
                                                >{part.name}</td
                                            >
                                            <td class="py-4 px-6 text-center">
                                                <Badge
                                                    variant="outline"
                                                    class="rounded-lg text-[10px] font-black uppercase tracking-tighter {part.source ===
                                                    'stok'
                                                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                        : 'bg-amber-50 text-amber-600 border-amber-100'}"
                                                >
                                                    {part.source === "stok"
                                                        ? "STOK UNIT"
                                                        : "ORDER BARU"}
                                                </Badge>
                                            </td>
                                            <td
                                                class="py-4 px-6 text-center font-mono font-bold text-slate-400"
                                                >{part.qty}x</td
                                            >
                                            <td
                                                class="py-4 px-6 text-right text-slate-500 font-medium"
                                                >Rp {part.price?.toLocaleString(
                                                    "id-ID",
                                                )}</td
                                            >
                                            <td
                                                class="py-4 px-6 text-right font-black text-slate-800"
                                            >
                                                Rp {part.subtotal?.toLocaleString(
                                                    "id-ID",
                                                )}
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>
                {/if}

                <!-- Cost Summary -->
                {#if canViewFinancials && serviceOrder.status !== "antrian" && serviceOrder.status !== "dicek"}
                    <div
                        class="bg-slate-900 rounded-[2rem] shadow-2xl p-8 text-white relative overflow-hidden"
                    >
                        <!-- Abstract background flare -->
                        <div
                            class="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px]"
                        ></div>
                        <div
                            class="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]"
                        ></div>

                        <h3
                            class="font-black text-xs uppercase tracking-[0.3em] text-white/40 mb-8 flex items-center gap-3 relative z-10"
                        >
                            <div class="h-px w-8 bg-white/20"></div>
                            Final Financial Summary
                        </h3>

                        <div class="space-y-6 relative z-10">
                            <div
                                class="flex justify-between items-center group"
                            >
                                <div class="flex flex-col">
                                    <span
                                        class="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white/50 transition-colors"
                                        >Service Fee</span
                                    >
                                    <span class="text-xs text-white/50"
                                        >Biaya Jasa & Pengerjaan</span
                                    >
                                </div>
                                <span class="text-xl font-bold tracking-tight"
                                    >Rp {derivedServiceFee.toLocaleString(
                                        "id-ID",
                                    )}</span
                                >
                            </div>

                            <div
                                class="flex justify-between items-center group"
                            >
                                <div class="flex flex-col">
                                    <span
                                        class="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white/50 transition-colors"
                                        >Replacement Parts</span
                                    >
                                    <span class="text-xs text-white/50"
                                        >Total Biaya Suku Cadang</span
                                    >
                                </div>
                                <span class="text-xl font-bold tracking-tight"
                                    >Rp {totalParts.toLocaleString(
                                        "id-ID",
                                    )}</span
                                >
                            </div>

                            <div
                                class="pt-6 mt-6 border-t border-white/10 relative"
                            >
                                <div class="flex justify-between items-end">
                                    <div class="flex flex-col">
                                        <span
                                            class="text-[10px] font-black uppercase tracking-[0.2em] text-primary"
                                            >Grand Total Revenue</span
                                        >
                                        <span
                                            class="text-[10px] text-white/30 italic"
                                            >Total tagihan ke customer</span
                                        >
                                    </div>
                                    <div class="flex flex-col items-end">
                                        <div class="flex items-baseline gap-1">
                                            <span
                                                class="text-sm font-black text-white/40"
                                                >IDR</span
                                            >
                                            <span
                                                class="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50"
                                            >
                                                {grandTotal.toLocaleString(
                                                    "id-ID",
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- Action Buttons -->
                <!-- Action Buttons -->
                {#if !isReadOnly}
                    <div
                        class="flex flex-col-reverse md:flex-row gap-3 justify-end bg-card rounded-2xl shadow-sm border p-4 sticky bottom-4 z-10"
                    >
                        <!-- Common Cancel Button -->
                        <Button
                            variant="outline"
                            onclick={openCancelModal}
                            class="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <XCircle class="mr-2 h-4 w-4" /> Batalkan
                        </Button>

                        <!-- Workflow Buttons -->
                        {#if serviceOrder.status === "antrian"}
                            {#if currentUser?.role === "teknisi" && !serviceOrder.technicianId}
                                <Button
                                    onclick={handleSelfAssign}
                                    class="bg-green-600 hover:bg-green-700"
                                >
                                    <User class="mr-2 h-4 w-4" /> Ambil Job Ini
                                </Button>
                            {/if}
                            {#if serviceOrder.technicianId}
                                <Button
                                    onclick={() => updateStatus("dicek")}
                                    class="bg-blue-600 hover:bg-blue-700"
                                >
                                    <CheckCircle class="mr-2 h-4 w-4" /> Mulai Pengecekan
                                </Button>
                            {:else if currentUser?.role === "admin"}
                                <p class="text-sm text-amber-600 italic">
                                    Assign teknisi terlebih dahulu
                                </p>
                            {/if}
                        {/if}

                        {#if serviceOrder.status === "dicek"}
                            {#if canEditWorkflow}
                                <Button
                                    onclick={() => (showDiagnosisModal = true)}
                                    class="bg-blue-600 hover:bg-blue-700"
                                >
                                    <FileText class="mr-2 h-4 w-4" /> Simpan Diagnosa
                                    & Konfirmasi
                                </Button>
                            {/if}
                        {:else if serviceOrder.status === "konfirmasi"}
                            {#if canEditWorkflow}
                                <Button
                                    onclick={handleStartWork}
                                    class="bg-purple-600 hover:bg-purple-700"
                                >
                                    <Wrench class="mr-2 h-4 w-4" /> Mulai Pengerjaan
                                    (Customer Setuju)
                                </Button>
                            {/if}
                        {:else if serviceOrder.status === "dikerjakan"}
                            {#if canEditWorkflow}
                                <Button
                                    onclick={() => (showCompletionModal = true)}
                                    class="bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle class="mr-2 h-4 w-4" /> Selesai
                                    Pengerjaan
                                </Button>
                                <!-- Only show if reconfirmation hasn't happened yet -->
                                {#if (serviceOrder.reconfirmationCount || 0) === 0}
                                    <Button
                                        variant="outline"
                                        onclick={() => {
                                            reconfirmInput.cost =
                                                serviceOrder.costEstimate || 0;
                                            reconfirmInput.notes =
                                                serviceOrder.notes || "";
                                            showReconfirmModal = true;
                                        }}
                                        class="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    >
                                        <RefreshCw class="mr-2 h-4 w-4" /> Minta
                                        Re-konfirmasi
                                    </Button>
                                {/if}
                            {/if}
                        {:else if serviceOrder.status === "re-konfirmasi"}
                            {#if canProcessPayment}
                                <Button
                                    onclick={() => updateStatus("dikerjakan")}
                                    class="bg-purple-600 hover:bg-purple-700"
                                >
                                    <CheckCircle class="mr-2 h-4 w-4" /> Setuju &
                                    Lanjutkan
                                </Button>
                            {/if}
                        {:else if serviceOrder.status === "selesai"}
                            {#if canProcessPayment}
                                <Button
                                    onclick={handlePickup}
                                    class="bg-teal-600 hover:bg-teal-700"
                                >
                                    <CheckCircle class="mr-2 h-4 w-4" /> Konfirmasi
                                    Diambil
                                </Button>
                            {/if}
                        {/if}
                    </div>
                {:else}
                    <div class="bg-muted/50 rounded-2xl p-4 text-center">
                        <p class="text-muted-foreground italic mb-4">
                            Service status <span class="font-medium"
                                >{serviceOrder.status}</span
                            > - Data terkunci
                        </p>
                        {#if canAssignTechnician}
                            <Button
                                variant="outline"
                                class="text-red-500 border-red-200 hover:bg-red-50"
                                onclick={handleDelete}
                            >
                                <Trash2 class="mr-2 h-4 w-4" /> Hapus Data
                            </Button>
                        {/if}
                    </div>
                {/if}
            </main>
        </div>
    {/if}

    <!-- Assign Technician Modal -->
    <Dialog bind:open={showAssignModal}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Pilih Teknisi</DialogTitle>
                <DialogDescription>
                    Pilih teknisi yang akan menangani service ini.
                </DialogDescription>
            </DialogHeader>
            <div class="py-4 space-y-4">
                <div class="space-y-2">
                    <Label>Daftar Teknisi</Label>
                    <div class="grid gap-2 max-h-[300px] overflow-y-auto">
                        {#each technicians as tech}
                            <button
                                class="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted text-left transition-colors {selectedTechnicianId ===
                                tech.id
                                    ? 'border-primary ring-1 ring-primary bg-primary/5'
                                    : ''}"
                                onclick={() => (selectedTechnicianId = tech.id)}
                            >
                                <div
                                    class="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                                >
                                    <User class="h-4 w-4" />
                                </div>
                                <div class="flex-1">
                                    <p class="font-medium text-sm">
                                        {tech.name}
                                    </p>
                                    <p
                                        class="text-xs text-muted-foreground capitalize"
                                    >
                                        Teknisi
                                    </p>
                                </div>
                                {#if selectedTechnicianId === tech.id}
                                    <CheckCircle class="h-4 w-4 text-primary" />
                                {/if}
                            </button>
                        {/each}
                        {#if technicians.length === 0}
                            <p
                                class="text-sm text-muted-foreground text-center py-4"
                            >
                                Belum ada data teknisi.
                            </p>
                        {/if}
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button
                    variant="outline"
                    onclick={() => (showAssignModal = false)}>Batal</Button
                >
                <Button
                    onclick={handleAssignTechnician}
                    disabled={!selectedTechnicianId}>Simpan Perubahan</Button
                >
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <!-- Diagnosis Modal -->
    <Dialog bind:open={showDiagnosisModal}>
        <DialogContent class="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>Simpan Diagnosa & Konfirmasi</DialogTitle>
                <DialogDescription>
                    Input hasil diagnosa dan estimasi biaya untuk dikonfirmasi
                    ke customer.
                </DialogDescription>
            </DialogHeader>
            <div class="py-4 space-y-4">
                <div class="space-y-2">
                    <Label for="initial"
                        >Kondisi Fisik / Teknis (Ampere Meter, dll)</Label
                    >
                    <Textarea
                        id="initial"
                        placeholder="Contoh: Konsumsi arus 1A, tidak ada arus, fisik mulus..."
                        bind:value={diagnosisInput.initial}
                    />
                </div>
                <div class="space-y-2">
                    <Label for="causes">Kemungkinan Kerusakan</Label>
                    <Textarea
                        id="causes"
                        placeholder="Contoh: IC Power, CPU, Baterai..."
                        bind:value={diagnosisInput.possibleCauses}
                    />
                </div>
                <div class="space-y-2">
                    <Label for="cost">Estimasi Biaya (Rp)</Label>
                    <CurrencyInput
                        bind:value={diagnosisInput.costEstimate}
                        class="w-full"
                    />
                </div>
                <div class="space-y-2">
                    <Label for="time">Estimasi Waktu Pengerjaan Selesai</Label>
                    <DateTimePicker
                        bind:value={diagnosisInput.estimatedCompletion}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button
                    variant="outline"
                    onclick={() => (showDiagnosisModal = false)}>Batal</Button
                >
                <Button
                    onclick={submitDiagnosis}
                    class="bg-blue-600 hover:bg-blue-700"
                >
                    Simpan & Konfirmasi
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <!-- Completion Wizard -->
    <!-- Completion Wizard -->
    <ServiceCompletionWizard
        bind:open={showCompletionModal}
        {serviceId}
        serviceNo={serviceOrder?.no || ""}
        initialQC={serviceOrder?.phone?.initialQC}
        costEstimate={serviceOrder?.actualCost || serviceOrder?.costEstimate}
        customer={serviceOrder?.customer}
        device={serviceOrder?.device}
        complaint={serviceOrder?.complaint}
        diagnosis={serviceOrder?.diagnosis}
        onComplete={() => {
            loadData();
        }}
        onClose={() => {
            showCompletionModal = false;
        }}
    />

    <!-- Parts Modal -->
    <Dialog bind:open={showPartsModal}>
        <DialogContent class="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>Tambah Sparepart</DialogTitle>
                <DialogDescription>
                    Input sparepart yang digunakan untuk perbaikan.
                </DialogDescription>
            </DialogHeader>
            <div class="py-4 space-y-4">
                <div class="space-y-2">
                    <Label for="partName">Nama Sparepart</Label>
                    <Input
                        id="partName"
                        placeholder="Contoh: LCD iPhone 12"
                        bind:value={newPart.name}
                    />
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <Label for="partSource">Sumber</Label>
                        <select
                            id="partSource"
                            bind:value={newPart.source}
                            class="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                            <option value="stok">Dari Stok</option>
                            <option value="beli">Beli Baru</option>
                            <option value="customer">Customer</option>
                        </select>
                    </div>
                    <div class="space-y-2">
                        <Label for="partQty">Qty</Label>
                        <Input
                            id="partQty"
                            type="number"
                            min="1"
                            bind:value={newPart.qty}
                        />
                    </div>
                </div>
                <div class="space-y-2">
                    <Label for="partPrice">Harga Satuan (Rp)</Label>
                    <Input
                        id="partPrice"
                        type="number"
                        placeholder="0"
                        bind:value={newPart.price}
                    />
                </div>
                {#if newPart.qty > 0 && newPart.price > 0}
                    <div class="p-3 bg-muted rounded-lg">
                        <p class="text-sm text-muted-foreground">Subtotal</p>
                        <p class="text-lg font-bold text-primary">
                            Rp {(newPart.qty * newPart.price).toLocaleString(
                                "id-ID",
                            )}
                        </p>
                    </div>
                {/if}
            </div>
            <DialogFooter>
                <Button
                    variant="outline"
                    onclick={() => (showPartsModal = false)}>Batal</Button
                >
                <Button onclick={addPart} class="bg-blue-600 hover:bg-blue-700">
                    Tambah Part
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</div>

<!-- Re-confirm Modal -->
<Dialog
    open={showReconfirmModal}
    onOpenChange={(v) => (showReconfirmModal = v)}
>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Re-konfirmasi ke Customer</DialogTitle>
            <DialogDescription>
                Masukkan diagnosa aktual dan perubahan harga yang perlu
                disetujui customer.
            </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
            <div class="space-y-2">
                <Label>Diagnosa Aktual / Penjelasan</Label>
                <Textarea
                    placeholder="Jelaskan kerusakan yang ditemukan..."
                    bind:value={reconfirmInput.notes}
                />
            </div>
            <div class="space-y-2">
                <Label>Sparepart Perlu Diganti (Jika ada)</Label>
                <Input
                    placeholder="Contoh: LCD, Baterai, IC Power..."
                    bind:value={reconfirmInput.replacedComponent}
                />
            </div>
            <div class="space-y-2">
                <Label>Biaya Baru (Total)</Label>
                <CurrencyInput
                    bind:value={reconfirmInput.cost}
                    class="w-full"
                />
            </div>
        </div>
        <DialogFooter>
            <Button
                variant="outline"
                onclick={() => (showReconfirmModal = false)}>Batal</Button
            >
            <Button onclick={submitReconfirm}>Kirim Re-konfirmasi</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>

<!-- Cancel Service Modal -->
<Dialog open={showCancelModal} onOpenChange={(v) => (showCancelModal = v)}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Batalkan Service</DialogTitle>
            <DialogDescription>
                Mohon berikan alasan pembatalan service ini.
            </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
            <div class="space-y-2">
                <Label
                    >Alasan Pembatalan <span class="text-red-500">*</span
                    ></Label
                >
                <Textarea
                    placeholder="Contoh: Customer tidak setuju dengan biaya, unit sudah diperbaiki di tempat lain, dll..."
                    bind:value={cancelReason}
                    rows={4}
                />
            </div>
            <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p class="text-sm text-amber-700">
                    <AlertTriangle class="inline h-4 w-4 mr-1" />
                    Pembatalan tidak dapat dibatalkan. Pastikan alasan sudah benar.
                </p>
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onclick={() => (showCancelModal = false)}
                >Kembali</Button
            >
            <Button onclick={handleCancel} class="bg-red-600 hover:bg-red-700">
                <XCircle class="mr-2 h-4 w-4" />
                Konfirmasi Batalkan
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>

<!-- Confirmation Dialogs -->

<!-- Complete Confirm -->
<AlertDialog.Root bind:open={showCompleteConfirm}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Konfirmasi Selesai</AlertDialog.Title>
            <AlertDialog.Description>
                Apakah Anda yakin ingin menandai service ini sebagai <strong
                    >Selesai</strong
                >? Pastikan semua proses perbaikan dan checking sudah tuntas.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Batal</AlertDialog.Cancel>
            <AlertDialog.Action
                onclick={processComplete}
                disabled={isProcessingAction}
                class="bg-green-600 hover:bg-green-700"
            >
                {#if isProcessingAction}Memproses...{:else}Ya, Selesai{/if}
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

<!-- Pickup Confirm -->
<!-- Pickup/Payment Wizard (selesai -> diambil) -->
<ServicePickupWizard
    bind:open={showPickupWizard}
    {serviceId}
    serviceNo={serviceOrder?.no || ""}
    customer={serviceOrder?.customer}
    device={serviceOrder?.device}
    cost={serviceOrder?.actualCost || serviceOrder?.costEstimate || 0}
    serviceStatus={serviceOrder?.status || ""}
    onComplete={() => {
        refreshServiceList.update((n) => n + 1);
        loadData();
    }}
    onClose={() => {
        showPickupWizard = false;
    }}
/>

<!-- Delete Confirm -->
<AlertDialog.Root bind:open={showDeleteConfirm}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Hapus Permanen?</AlertDialog.Title>
            <AlertDialog.Description>
                Tindakan ini tidak bisa dibatalkan. Riwayat service ini akan
                hilang selamanya.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Batal</AlertDialog.Cancel>
            <AlertDialog.Action
                onclick={processDelete}
                disabled={isProcessingAction}
                class="bg-red-600 hover:bg-red-700"
            >
                {#if isProcessingAction}Menghapus...{:else}Ya, Hapus{/if}
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

<!-- Start Work Confirm -->
<AlertDialog.Root bind:open={showStartWorkConfirm}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Mulai Pengerjaan?</AlertDialog.Title>
            <AlertDialog.Description>
                Pastikan customer sudah menyetujui diagnosa dan estimasi biaya.
                Status akan berubah menjadi <strong>Dikerjakan</strong>.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Batal</AlertDialog.Cancel>
            <AlertDialog.Action
                onclick={processStartWork}
                disabled={isProcessingAction}
                class="bg-purple-600 hover:bg-purple-700"
            >
                {#if isProcessingAction}Memproses...{:else}Ya, Mulai Pengerjaan{/if}
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

<!-- Liquidation Confirm -->
<AlertDialog.Root bind:open={showLiquidateConfirm}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Konfirmasi Likuidasi</AlertDialog.Title>
            <AlertDialog.Description>
                Anda akan melakukan likuidasi unit ini dengan metode
                <span class="font-bold text-foreground"
                    >{liquidationType === "resell"
                        ? "Jual Unit (Resell)"
                        : "Kanibalisasi"}</span
                >.
                <br /><br />
                Tindakan ini akan mengubah status menjadi 'Sudah Diambil' dan menambahkan
                catatan likuidasi. Pastikan Anda sudah memproses fisik unit sesuai
                prosedur.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Batal</AlertDialog.Cancel>
            <AlertDialog.Action
                onclick={processLiquidation}
                disabled={isProcessingAction}
                class="bg-red-600 hover:bg-red-700 text-white"
            >
                {isProcessingAction ? "Memproses..." : "Ya, Likuidasi"}
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

<ServiceNotePrint
    bind:open={showPrintPreview}
    {serviceId}
    {serviceOrder}
    mode={printMode}
    onClose={() => (showPrintPreview = false)}
/>
