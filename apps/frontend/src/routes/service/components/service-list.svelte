<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { api } from "$lib/api";
    import { ServiceService } from "$lib/services/service.service";
    import { Button } from "$lib/components/ui/button";
    import {
        Card,
        CardContent,
        CardDescription,
        CardHeader,
        CardTitle,
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
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";
    import { Badge } from "$lib/components/ui/badge";
    import {
        Search,
        Eye,
        Play,
        UserPlus,
        CheckCircle,
        Package,
        ChevronRight,
        MessageSquare,
        Trash2,
        ScanBarcode,
        Camera, // Keep if used, though not seen in use in logic, maybe in modal
        Upload, // Keep if used
    } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { Separator } from "$lib/components/ui/separator";
    import { page } from "$app/stores";
    import { refreshServiceList } from "$lib/stores/events";
    import { toast } from "svelte-sonner";

    // Modals
    import ReassignTechnicianModal from "./reassign-technician-modal.svelte";
    import BarcodeScannerModal from "./barcode-scanner-modal.svelte";
    import ServiceCompletionWizard from "./service-completion-wizard.svelte";
    import ServicePickupWizard from "./service-pickup-wizard.svelte";
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
        DialogFooter,
    } from "$lib/components/ui/dialog";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
    import CurrencyInput from "$lib/components/custom/currency-input.svelte";

    // Data State
    let serviceOrders = $state<any[]>([]);
    let loading = $state(false);

    // User State for RBAC
    let userRole = $state("admin");
    let userId = $state("");

    // Filters
    let searchQuery = $state("");
    let filterStatus = $state("all");
    let filterTechnician = $state("all");
    let technicians = $state<{ id: string; name: string }[]>([]);

    // Component States
    let showReassignModal = $state(false);
    let showScanner = $state(false);
    let selectedServiceForReassign = $state<any>(null);
    let searchInput = $state<HTMLInputElement | null>(null);

    // Quick Action Modal States
    let showAssignModal = $state(false);
    let showPickupModal = $state(false);
    let showDiagnosisModal = $state(false);
    let showCompletionModal = $state(false);
    let selectedOrderForAction = $state<any>(null);
    let selectedTechnicianId = $state("");

    // Diagnosis Modal Data
    let diagnosisNotes = $state("");
    let diagnosisPossibleCauses = $state("");
    let diagnosisCostEstimate = $state(0);

    // Completion Modal Data
    let completionNotes = $state("");
    let completionActualCost = $state(0);

    // Rekonfirmasi Modal Data
    let showReconfirmModal = $state(false);
    let reconfirmInput = $state({
        notes: "",
        replacedComponent: "",
        cost: 0,
    });

    // Confirmation Dialog
    let showConfirmDialog = $state(false);
    let confirmDialogConfig = $state({
        title: "",
        description: "",
        action: async () => {},
        actionLabel: "",
        variant: "default" as "default" | "destructive" | undefined,
    });
    let isProcessingAction = $state(false);

    // Check if we're viewing "Semua Data" (no status filter from URL)
    let isAllDataView = $derived(!$page.url.searchParams.get("status"));
    let urlStatus = $derived($page.url.searchParams.get("status"));

    async function loadData() {
        loading = true;
        try {
            const params: any = {};
            if (filterStatus && filterStatus !== "all") {
                params.status = filterStatus;
            }

            // Enforce Technician Isolation
            if (userRole === "teknisi" && userId) {
                params.technicianId = userId;
            } else if (filterTechnician && filterTechnician !== "all") {
                // Allow admin filtering
                params.technicianId = filterTechnician;
            }

            serviceOrders = await ServiceService.getAll(params);
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat data service");
        } finally {
            loading = false;
        }
    }

    async function loadTechnicians() {
        try {
            technicians = await ServiceService.getTechnicians();
        } catch (e) {
            console.error("Failed to load technicians", e);
        }
    }

    onMount(() => {
        try {
            const u = JSON.parse(localStorage.getItem("user") || "{}");
            userRole = u.role || "guest";
            userId = u.id || "";
            if (userRole === "teknisi") {
                filterTechnician = userId;
            }
        } catch {}

        if (urlStatus) {
            filterStatus = urlStatus;
        }
        loadTechnicians();
        loadData();
    });

    $effect(() => {
        if (urlStatus) {
            filterStatus = urlStatus;
        }
    });

    $effect(() => {
        if (filterStatus) loadData();
    });

    $effect(() => {
        const _ = $refreshServiceList;
        loadData();
    });

    // Filtering logic (Client-side fallback)
    let filteredOrders = $derived(
        serviceOrders.filter((order) => {
            const term = searchQuery.toLowerCase();
            const matchesSearch =
                order.no.toLowerCase().includes(term) ||
                order.customer.name.toLowerCase().includes(term) ||
                order.device.brand.toLowerCase().includes(term) ||
                (order.technician?.name || "").toLowerCase().includes(term);

            // Technician isolation
            let matchesTechnician = true;
            if (userRole === "teknisi") {
                if (order.technician?.id !== userId) matchesTechnician = false;
            } else if (isAllDataView && filterTechnician !== "all") {
                if (filterTechnician === "unassigned") {
                    matchesTechnician = !order.technician;
                } else {
                    matchesTechnician =
                        order.technician?.id === filterTechnician;
                }
            }

            return matchesSearch && matchesTechnician;
        }),
    );

    function getStatusBadge(status: string) {
        switch (status) {
            case "antrian":
                return {
                    label: "Antrian",
                    variant: "outline",
                    className: "",
                    icon: "🕒",
                };
            case "dicek":
                return {
                    label: "Sedang Dicek",
                    variant: "secondary",
                    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
                    icon: "🔍",
                };
            case "konfirmasi":
                return {
                    label: "Tunggu Konfirmasi",
                    variant: "secondary",
                    className:
                        "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
                    icon: "💬",
                };
            case "dikerjakan":
                return {
                    label: "Sedang Dikerjakan",
                    variant: "default",
                    className: "",
                    icon: "🔧",
                };
            case "selesai":
                return {
                    label: "Selesai",
                    variant: "outline",
                    className:
                        "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
                    icon: "✅",
                };
            case "diambil":
                return {
                    label: "Sudah Diambil",
                    variant: "outline",
                    className: "text-muted-foreground",
                    icon: "👋",
                };
            case "batal":
                return {
                    label: "Dibatalkan",
                    variant: "destructive",
                    className: "",
                    icon: "❌",
                };
            default:
                return {
                    label: status,
                    variant: "outline",
                    className: "",
                    icon: "",
                };
        }
    }

    function viewServiceDetail(id: number) {
        goto(`/service/${id}`);
    }

    function getNextAction(status: string, hasTechnician: boolean) {
        // RBAC: Technicians cannot Pickup (Diambil)
        if (
            userRole === "teknisi" &&
            (status === "selesai" || status === "batal")
        ) {
            return null;
        }

        switch (status) {
            case "antrian":
                return {
                    label: hasTechnician ? "Mulai Cek" : "Assign & Cek",
                    icon: hasTechnician ? Play : UserPlus,
                    color: "bg-blue-600 hover:bg-blue-700 text-white",
                    needsModal: !hasTechnician,
                };
            case "dicek":
                return {
                    label: "Konfirmasi",
                    icon: ChevronRight,
                    color: "bg-yellow-600 hover:bg-yellow-700 text-white",
                    needsModal: false,
                };
            case "konfirmasi":
                return {
                    label: "Kerjakan",
                    icon: Play,
                    color: "bg-purple-600 hover:bg-purple-700 text-white",
                    needsModal: false,
                };
            case "dikerjakan":
                return {
                    label: "Selesai",
                    icon: CheckCircle,
                    color: "bg-green-600 hover:bg-green-700 text-white",
                    needsModal: false,
                };
            case "selesai":
            case "batal":
                return {
                    label: "Diambil",
                    icon: Package,
                    color: "bg-teal-600 hover:bg-teal-700 text-white",
                    needsModal: true,
                };
            default:
                return null;
        }
    }

    async function handleQuickAction(order: any) {
        const hasTechnician = !!order.technician;
        selectedOrderForAction = order;

        switch (order.status) {
            case "antrian":
                if (hasTechnician) {
                    confirmDialogConfig = {
                        title: "Mulai Pengecekan?",
                        description:
                            "Pastikan unit sudah siap dimeja service untuk dilakukan analisa awal.",
                        action: async () =>
                            await updateOrderStatus(order.id, "dicek"),
                        actionLabel: "Mulai Cek",
                        variant: "default",
                    };
                    showConfirmDialog = true;
                } else {
                    selectedTechnicianId = "";
                    showAssignModal = true;
                }
                break;
            case "dicek":
                diagnosisNotes = "";
                diagnosisPossibleCauses = "";
                diagnosisCostEstimate = order.costEstimate || 0;
                showDiagnosisModal = true;
                break;
            case "konfirmasi":
                confirmDialogConfig = {
                    title: "Mulai Pengerjaan?",
                    description:
                        "Pastikan customer sudah konfirmasi dan setuju dengan biaya/estimasi.",
                    action: async () =>
                        await updateOrderStatus(order.id, "dikerjakan"),
                    actionLabel: "Mulai Pengerjaan",
                    variant: "default",
                };
                showConfirmDialog = true;
                break;
            case "dikerjakan":
                completionNotes = "";
                completionActualCost =
                    order.costEstimate || order.actualCost || 0;
                showCompletionModal = true;
                break;
            case "selesai":
            case "batal":
                showPickupModal = true;
                break;
        }
    }

    async function updateOrderStatus(
        id: number,
        newStatus: string,
        extraData?: any,
    ) {
        try {
            const uId =
                JSON.parse(localStorage.getItem("user") || "{}").id ||
                "USR-ADMIN";
            await ServiceService.updateStatus(id, {
                status: newStatus as any,
                userId: uId,
                notes: extraData?.notes,
                actualCost: extraData?.actualCost,
            });
            toast.success(`Status berhasil diubah ke ${newStatus}`);
            refreshServiceList.update((n) => n + 1);
            loadData();
        } catch (e) {
            console.error(e);
            toast.error("Gagal mengubah status");
        }
    }

    async function handleAssignAndStart() {
        if (!selectedTechnicianId || !selectedOrderForAction) {
            toast.error("Pilih teknisi terlebih dahulu");
            return;
        }
        try {
            await ServiceService.assignTechnician(
                selectedOrderForAction.id,
                selectedTechnicianId,
            );
            await updateOrderStatus(selectedOrderForAction.id, "dicek");
            showAssignModal = false;
            selectedOrderForAction = null;
        } catch (e) {
            toast.error("Gagal assign teknisi");
        }
    }

    async function handleSubmitDiagnosis() {
        if (!selectedOrderForAction) return;
        if (!diagnosisNotes.trim()) {
            toast.error("Mohon isi catatan diagnosa");
            return;
        }
        if (diagnosisCostEstimate <= 0) {
            toast.error("Mohon isi estimasi biaya");
            return;
        }
        try {
            await ServiceService.patchService(selectedOrderForAction.id, {
                diagnosis: {
                    initial: diagnosisNotes,
                    possibleCauses: diagnosisPossibleCauses,
                },
                costEstimate: diagnosisCostEstimate,
            });
            await updateOrderStatus(selectedOrderForAction.id, "konfirmasi", {
                notes: diagnosisNotes,
            });
            showDiagnosisModal = false;
            selectedOrderForAction = null;
        } catch (e) {
            toast.error("Gagal menyimpan diagnosa");
        }
    }

    async function handleSubmitCompletion() {
        if (!selectedOrderForAction) return;
        if (completionActualCost <= 0) {
            toast.error("Mohon isi biaya aktual");
            return;
        }
        try {
            await updateOrderStatus(selectedOrderForAction.id, "selesai", {
                notes: completionNotes,
                actualCost: completionActualCost,
            });
            showCompletionModal = false;
            selectedOrderForAction = null;
        } catch (e) {
            toast.error("Gagal menyelesaikan service");
        }
    }

    function openReconfirmModal(order: any) {
        selectedOrderForAction = order;
        reconfirmInput = {
            notes: "",
            replacedComponent: "",
            cost: order.actualCost || order.costEstimate || 0,
        };
        showReconfirmModal = true;
    }

    async function handleSubmitReconfirm() {
        if (!selectedOrderForAction) return;
        if (!reconfirmInput.notes.trim()) {
            toast.error("Mohon isi catatan rekonfirmasi");
            return;
        }
        try {
            await ServiceService.patchService(selectedOrderForAction.id, {
                reconfirmation: {
                    notes: reconfirmInput.notes,
                    replacedComponent: reconfirmInput.replacedComponent,
                    newCost: reconfirmInput.cost,
                },
            });
            await updateOrderStatus(selectedOrderForAction.id, "rekonfirmasi", {
                notes: reconfirmInput.notes,
            });
            showReconfirmModal = false;
            selectedOrderForAction = null;
        } catch (e) {
            toast.error("Gagal mengirim rekonfirmasi");
        }
    }

    async function handleDelete(id: number) {
        confirmDialogConfig = {
            title: "Hapus Permanen?",
            description:
                "Apakah anda yakin ingin menghapus data service ini? Data tidak dapat dikembalikan.",
            action: async () => {
                await api.delete(`/service/${id}`);
                serviceOrders = serviceOrders.filter((o) => o.id !== id);
                toast.success("Data service berhasil dihapus");
                loadData();
            },
            actionLabel: "Hapus Data",
            variant: "destructive",
        };
        showConfirmDialog = true;
    }

    function handleReassignConfirm() {
        showReassignModal = false;
        selectedServiceForReassign = null;
        loadData();
    }
</script>

<Card>
    <CardHeader class="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Daftar Service Order</CardTitle>
            <CardDescription>
                Kelola semua service handphone customer.
            </CardDescription>
        </div>
    </CardHeader>
    <CardContent class="space-y-4">
        <!-- Filters -->
        <div class="flex flex-col sm:flex-row gap-4">
            <div class="relative flex-1 md:max-w-sm flex gap-2">
                <div class="relative flex-1">
                    <Search
                        class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                        type="search"
                        placeholder="Cari Service No, Customer, Device..."
                        class="pl-8"
                        bind:ref={searchInput}
                        bind:value={searchQuery}
                        onkeydown={(e) => {
                            if (e.key === "Enter") {
                                if (filteredOrders.length === 1) {
                                    viewServiceDetail(filteredOrders[0].id);
                                    searchQuery = "";
                                }
                            }
                        }}
                    />
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    title="Mode Scan Barcode"
                    class="md:hidden"
                    onclick={() => {
                        showScanner = true;
                    }}
                >
                    <ScanBarcode class="h-4 w-4" />
                </Button>
            </div>
            {#if isAllDataView}
                <Select type="single" name="status" bind:value={filterStatus}>
                    <SelectTrigger class="w-full sm:w-[180px]">
                        {filterStatus === "all" ? "Semua Status" : filterStatus}
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="antrian">Antrian</SelectItem>
                        <SelectItem value="dicek">Sedang Dicek</SelectItem>
                        <SelectItem value="konfirmasi">Konfirmasi</SelectItem>
                        <SelectItem value="dikerjakan">Dikerjakan</SelectItem>
                        <SelectItem value="re-konfirmasi"
                            >Re-konfirmasi</SelectItem
                        >
                        <SelectItem value="selesai">Selesai</SelectItem>
                        <SelectItem value="diambil">Sudah Diambil</SelectItem>
                        <SelectItem value="batal">Dibatalkan</SelectItem>
                    </SelectContent>
                </Select>
                {#if userRole !== "teknisi"}
                    <Select
                        type="single"
                        name="technician"
                        bind:value={filterTechnician}
                    >
                        <SelectTrigger class="w-full sm:w-[180px]">
                            {filterTechnician === "all"
                                ? "Semua Teknisi"
                                : filterTechnician === "unassigned"
                                  ? "Belum Assign"
                                  : technicians.find(
                                        (t) => t.id === filterTechnician,
                                    )?.name || filterTechnician}
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Teknisi</SelectItem>
                            <SelectItem value="unassigned"
                                >Belum Assign</SelectItem
                            >
                            {#each technicians as tech}
                                <SelectItem value={tech.id}
                                    >{tech.name}</SelectItem
                                >
                            {/each}
                        </SelectContent>
                    </Select>
                {/if}
            {/if}
        </div>

        <!-- Mobile Card List -->
        <div class="grid gap-4 md:hidden">
            {#if loading}
                <div class="text-center p-4">Loading...</div>
            {:else if filteredOrders.length === 0}
                <div class="text-center p-4 text-muted-foreground">
                    Tidak ada data service.
                </div>
            {:else}
                {#each filteredOrders as order}
                    {@const statusInfo = getStatusBadge(order.status)}
                    <div
                        class="rounded-lg border p-4 space-y-3 bg-card text-card-foreground shadow-sm"
                    >
                        <div class="flex justify-between items-start">
                            <div>
                                <div class="font-medium text-primary">
                                    {order.no}
                                </div>
                                <div class="text-xs text-muted-foreground">
                                    {new Date(
                                        order.dateIn,
                                    ).toLocaleDateString()}
                                </div>
                            </div>
                            <Badge
                                variant={statusInfo.variant as any}
                                class={statusInfo.className}
                            >
                                {statusInfo.icon}
                                {statusInfo.label}
                            </Badge>
                        </div>
                        <Separator />
                        <div class="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <div class="text-muted-foreground text-xs">
                                    Customer
                                </div>
                                <div class="font-medium">
                                    {order.customer.name}
                                </div>
                                <div class="text-xs text-muted-foreground">
                                    {order.customer.phone}
                                </div>
                            </div>
                            <div>
                                <div class="text-muted-foreground text-xs">
                                    Handphone
                                </div>
                                <div class="font-medium">
                                    {order.device.brand}
                                    {order.device.model}
                                </div>
                                <div
                                    class="text-xs text-muted-foreground truncate"
                                    title={order.device.imei}
                                >
                                    {order.device.imei || "-"}
                                </div>
                            </div>
                        </div>
                        <div class="flex justify-between items-center pt-2">
                            <div class="text-sm">
                                <span
                                    class="text-muted-foreground text-xs block"
                                    >Teknisi</span
                                >
                                {#if order.technician}
                                    <span class="font-medium"
                                        >{order.technician.name}</span
                                    >
                                {:else}
                                    <span class="text-muted-foreground italic"
                                        >Unassigned</span
                                    >
                                {/if}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onclick={() => viewServiceDetail(order.id)}
                            >
                                <Eye class="mr-2 h-3 w-3" /> Detail
                            </Button>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>

        <!-- Desktop Table -->
        <div class="hidden md:block rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>No. Service</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Handphone</TableHead>
                        <TableHead>Teknisi</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead class="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {#if loading}
                        <TableRow>
                            <TableCell colspan={7} class="text-center h-24"
                                >Loading...</TableCell
                            >
                        </TableRow>
                    {:else if filteredOrders.length === 0}
                        <TableRow>
                            <TableCell
                                colspan={7}
                                class="text-center h-24 text-muted-foreground"
                                >Tidak ada data service.</TableCell
                            >
                        </TableRow>
                    {:else}
                        {#each filteredOrders as order}
                            <TableRow>
                                <TableCell class="font-medium text-primary"
                                    >{order.no}</TableCell
                                >
                                <TableCell
                                    >{new Date(
                                        order.dateIn,
                                    ).toLocaleDateString()}</TableCell
                                >
                                <TableCell>
                                    <div class="flex flex-col">
                                        <span class="font-medium"
                                            >{order.customer.name}</span
                                        >
                                        <span
                                            class="text-xs text-muted-foreground"
                                            >{order.customer.phone}</span
                                        >
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div class="flex flex-col">
                                        <span
                                            >{order.device.brand}
                                            {order.device.model}</span
                                        >
                                        <span
                                            class="text-xs text-muted-foreground"
                                            >IMEI: {order.device.imei ||
                                                "-"}</span
                                        >
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div class="flex items-center gap-2">
                                        {#if order.technician}
                                            <Badge variant="outline"
                                                >{order.technician.name}</Badge
                                            >
                                        {:else}
                                            <span
                                                class="text-sm text-muted-foreground italic"
                                                >Belum assign</span
                                            >
                                        {/if}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {@const statusInfo = getStatusBadge(
                                        order.status,
                                    )}
                                    <Badge
                                        variant={statusInfo.variant as any}
                                        class={statusInfo.className}
                                    >
                                        {statusInfo.icon}
                                        {statusInfo.label}
                                    </Badge>
                                </TableCell>
                                <TableCell class="text-right">
                                    {@const nextAction = getNextAction(
                                        order.status,
                                        !!order.technician,
                                    )}
                                    {#if nextAction}
                                        <Button
                                            size="sm"
                                            class="{nextAction.color} h-7 px-2 text-xs"
                                            onclick={() =>
                                                handleQuickAction(order)}
                                            title={nextAction.label}
                                        >
                                            {@const IconComponent =
                                                nextAction.icon}
                                            <IconComponent
                                                class="h-3 w-3 mr-1"
                                            />
                                            {nextAction.label}
                                        </Button>
                                    {/if}
                                    {#if order.status === "dikerjakan"}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            class="h-7 px-2 text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
                                            onclick={() =>
                                                openReconfirmModal(order)}
                                            title="Rekonfirmasi ke Customer"
                                        >
                                            <MessageSquare
                                                class="h-3 w-3 mr-1"
                                            /> Rekon
                                        </Button>
                                    {/if}
                                    {#if userRole !== "teknisi"}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            class="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onclick={() =>
                                                handleDelete(order.id)}
                                            title="Hapus"
                                        >
                                            <Trash2 class="h-4 w-4" />
                                        </Button>
                                    {/if}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        class="h-8 w-8"
                                        onclick={() =>
                                            viewServiceDetail(order.id)}
                                    >
                                        <Eye class="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        {/each}
                    {/if}
                </TableBody>
            </Table>
        </div>
    </CardContent>
</Card>

{#if selectedServiceForReassign}
    <ReassignTechnicianModal
        bind:open={showReassignModal}
        serviceId={selectedServiceForReassign.id}
        serviceNo={selectedServiceForReassign.no}
        currentTechnician={selectedServiceForReassign.technician}
        onConfirm={handleReassignConfirm}
    />
{/if}

<BarcodeScannerModal
    open={showScanner}
    onClose={() => (showScanner = false)}
    onScan={(code) => {
        searchQuery = code;
        showScanner = false;
        setTimeout(() => {
            if (filteredOrders.length === 1) {
                viewServiceDetail(filteredOrders[0].id);
            }
        }, 100);
    }}
/>

<Dialog open={showAssignModal} onOpenChange={(v) => (showAssignModal = v)}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Assign Teknisi & Mulai Pengecekan</DialogTitle>
            <DialogDescription>
                {#if selectedOrderForAction}
                    Pilih teknisi untuk service <strong
                        >{selectedOrderForAction.no}</strong
                    >
                {:else}
                    Pilih teknisi yang akan mengerjakan service ini
                {/if}
            </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
            <div class="space-y-2">
                <Label>Teknisi <span class="text-red-500">*</span></Label>
                <Select type="single" bind:value={selectedTechnicianId}>
                    <SelectTrigger class="w-full">
                        {technicians.find((t) => t.id === selectedTechnicianId)
                            ?.name || "Pilih Teknisi"}
                    </SelectTrigger>
                    <SelectContent>
                        {#each technicians as tech}
                            <SelectItem value={tech.id}>{tech.name}</SelectItem>
                        {/each}
                    </SelectContent>
                </Select>
            </div>
            {#if selectedOrderForAction}
                <div class="p-3 bg-muted rounded-lg text-sm">
                    <p class="text-muted-foreground">
                        Customer: <strong
                            >{selectedOrderForAction.customer?.name}</strong
                        >
                    </p>
                    <p class="text-muted-foreground">
                        Device: <strong
                            >{selectedOrderForAction.device?.brand}
                            {selectedOrderForAction.device?.model}</strong
                        >
                    </p>
                </div>
            {/if}
        </div>
        <DialogFooter>
            <Button
                variant="outline"
                onclick={() => {
                    showAssignModal = false;
                    selectedOrderForAction = null;
                }}>Batal</Button
            >
            <Button
                onclick={handleAssignAndStart}
                class="bg-blue-600 hover:bg-blue-700"
            >
                <Play class="mr-2 h-4 w-4" /> Assign & Mulai Cek
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>

{#if selectedOrderForAction}
    <ServicePickupWizard
        bind:open={showPickupModal}
        serviceId={selectedOrderForAction.id}
        serviceNo={selectedOrderForAction.no || ""}
        customer={selectedOrderForAction.customer}
        device={selectedOrderForAction.device}
        cost={selectedOrderForAction.actualCost ||
            selectedOrderForAction.costEstimate ||
            0}
        serviceStatus={selectedOrderForAction.status}
        onComplete={() => {
            refreshServiceList.update((n) => n + 1);
            loadData();
            selectedOrderForAction = null;
        }}
        onClose={() => {
            showPickupModal = false;
            selectedOrderForAction = null;
        }}
    />
{/if}

<Dialog
    open={showDiagnosisModal}
    onOpenChange={(v) => (showDiagnosisModal = v)}
>
    <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
            <DialogTitle>Input Hasil Diagnosa</DialogTitle>
            <DialogDescription
                >Input hasil pengecekan dan estimasi biaya untuk dikonfirmasi ke
                customer.</DialogDescription
            >
        </DialogHeader>
        <div class="space-y-4 py-4">
            {#if selectedOrderForAction}
                <div
                    class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-1"
                >
                    <div class="flex justify-between">
                        <span class="font-semibold text-blue-800"
                            >Service #{selectedOrderForAction.no}</span
                        >
                        <Badge variant="outline"
                            >{selectedOrderForAction.status}</Badge
                        >
                    </div>
                    <div class="text-blue-700">
                        <p>
                            <strong>Device:</strong>
                            {selectedOrderForAction.device?.brand}
                            {selectedOrderForAction.device?.model}
                        </p>
                        <p>
                            <strong>IMEI:</strong>
                            {selectedOrderForAction.device?.imei || "-"}
                        </p>
                        <p>
                            <strong>Keluhan:</strong>
                            {selectedOrderForAction.complaint}
                        </p>
                        <p>
                            <strong>Customer:</strong>
                            {selectedOrderForAction.customer?.name}
                        </p>
                    </div>
                </div>
            {/if}
            <div class="space-y-2">
                <Label
                    >Kondisi Fisik / Teknis (Ampere Meter, dll) <span
                        class="text-red-500">*</span
                    ></Label
                >
                <Textarea
                    bind:value={diagnosisNotes}
                    placeholder="Contoh: Konsumsi arus 1A, tidak ada arus, fisik mulus..."
                    rows={2}
                />
            </div>
            <div class="space-y-2">
                <Label>Kemungkinan Kerusakan</Label>
                <Textarea
                    bind:value={diagnosisPossibleCauses}
                    placeholder="Contoh: IC Power, CPU, Baterai..."
                    rows={2}
                />
            </div>
            <div class="space-y-2">
                <Label
                    >Estimasi Biaya (Rp) <span class="text-red-500">*</span
                    ></Label
                >
                <CurrencyInput
                    bind:value={diagnosisCostEstimate}
                    class="w-full"
                />
            </div>
        </div>
        <DialogFooter>
            <Button
                variant="outline"
                onclick={() => {
                    showDiagnosisModal = false;
                    selectedOrderForAction = null;
                }}>Batal</Button
            >
            <Button
                onclick={handleSubmitDiagnosis}
                class="bg-yellow-600 hover:bg-yellow-700"
            >
                <ChevronRight class="mr-2 h-4 w-4" /> Simpan & Konfirmasi
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>

{#if selectedOrderForAction}
    <ServiceCompletionWizard
        bind:open={showCompletionModal}
        serviceId={selectedOrderForAction.id}
        serviceNo={selectedOrderForAction.no || ""}
        initialQC={selectedOrderForAction.phone?.initialQC}
        costEstimate={selectedOrderForAction.actualCost ||
            selectedOrderForAction.costEstimate}
        customer={selectedOrderForAction.customer}
        device={selectedOrderForAction.device}
        complaint={selectedOrderForAction.complaint}
        diagnosis={selectedOrderForAction.diagnosis}
        onComplete={() => {
            refreshServiceList.update((n) => n + 1);
            loadData();
            selectedOrderForAction = null;
        }}
        onClose={() => {
            showCompletionModal = false;
            selectedOrderForAction = null;
        }}
    />
{/if}

<Dialog
    open={showReconfirmModal}
    onOpenChange={(v) => (showReconfirmModal = v)}
>
    <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
            <DialogTitle>Rekonfirmasi ke Customer</DialogTitle>
            <DialogDescription
                >Kirim ulang konfirmasi ke customer jika ada perubahan atau
                masalah baru.</DialogDescription
            >
        </DialogHeader>
        <div class="space-y-4 py-4">
            {#if selectedOrderForAction}
                <div
                    class="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm space-y-1"
                >
                    <div class="flex justify-between">
                        <span class="font-semibold text-orange-800"
                            >Service #{selectedOrderForAction.no}</span
                        >
                        <Badge variant="outline"
                            >{selectedOrderForAction.status}</Badge
                        >
                    </div>
                    <div class="text-orange-700">
                        <p>
                            <strong>Device:</strong>
                            {selectedOrderForAction.device?.brand}
                            {selectedOrderForAction.device?.model}
                        </p>
                        <p>
                            <strong>IMEI:</strong>
                            {selectedOrderForAction.device?.imei || "-"}
                        </p>
                        <p>
                            <strong>Keluhan:</strong>
                            {selectedOrderForAction.complaint}
                        </p>
                        <p>
                            <strong>Customer:</strong>
                            {selectedOrderForAction.customer?.name}
                        </p>
                    </div>
                </div>
            {/if}
            <div class="space-y-2">
                <Label
                    >Alasan Rekonfirmasi <span class="text-red-500">*</span
                    ></Label
                >
                <Textarea
                    bind:value={reconfirmInput.notes}
                    placeholder="Jelaskan alasan perlu rekonfirmasi ulang ke customer..."
                    rows={2}
                />
            </div>
            <div class="space-y-2">
                <Label>Komponen yang Diganti (Opsional)</Label>
                <Input
                    bind:value={reconfirmInput.replacedComponent}
                    placeholder="Contoh: IC Power, Baterai, dll"
                />
            </div>
            <div class="space-y-2">
                <Label>Estimasi Biaya Baru</Label>
                <CurrencyInput
                    bind:value={reconfirmInput.cost}
                    class="w-full"
                />
            </div>
        </div>
        <DialogFooter>
            <Button
                variant="outline"
                onclick={() => {
                    showReconfirmModal = false;
                    selectedOrderForAction = null;
                }}>Batal</Button
            >
            <Button
                onclick={handleSubmitReconfirm}
                class="bg-orange-600 hover:bg-orange-700"
            >
                <MessageSquare class="mr-2 h-4 w-4" /> Kirim Rekonfirmasi
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>

<AlertDialog.Root bind:open={showConfirmDialog}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>{confirmDialogConfig.title}</AlertDialog.Title>
            <AlertDialog.Description
                >{confirmDialogConfig.description}</AlertDialog.Description
            >
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Batal</AlertDialog.Cancel>
            <AlertDialog.Action
                class={confirmDialogConfig.variant === "destructive"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-primary hover:bg-primary/90"}
                onclick={async () => {
                    isProcessingAction = true;
                    try {
                        await confirmDialogConfig.action();
                    } finally {
                        isProcessingAction = false;
                        showConfirmDialog = false;
                    }
                }}
                disabled={isProcessingAction}
            >
                {#if isProcessingAction}Processing...{:else}{confirmDialogConfig.actionLabel}{/if}
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

<style>
    /* Styling for the component */
</style>
