<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
    import { Button } from "$lib/components/ui/button";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";
    import { Separator } from "$lib/components/ui/separator";
    import { Badge } from "$lib/components/ui/badge";
    import {
        Wrench,
        Package,
        Search,
        Trash2,
        Calendar as CalendarIcon,
        AlertCircle,
        ChevronRight,
        X,
        CheckCircle,
    } from "lucide-svelte";
    import { Switch } from "$lib/components/ui/switch";
    import { createQuery } from "@tanstack/svelte-query";
    import { InventoryService } from "$lib/services/inventory.service";
    import { SPAREPART_SOURCES } from "@repo/shared";
    import { cn } from "$lib/utils";

    // The original file used: import CurrencyInput from "$lib/components/custom/currency-input.svelte";
    import CurrencyInput from "$lib/components/custom/currency-input.svelte";
    import type { ServiceFormStore } from "../form.svelte";
    import { toast } from "svelte-sonner";

    let {
        form,
        technicians = [],
        inventoryItems = [],
        services = [],
    }: {
        form: ServiceFormStore;
        technicians: any[];
        inventoryItems: any[];
        services: any[];
    } = $props();

    // Local UI State
    let showInventoryModal = $state(false);
    let searchTerm = $state("");
    let showCalendar = $state(false);
    let calendarDate = $state(new Date());

    // Derived
    // Filter Logic
    let filterCompatible = $state(false);

    // Auto-enable filter when modal opens if device selected
    $effect(() => {
        if (showInventoryModal && form.selectedDeviceId) {
            filterCompatible = true;
        }
    });

    const inventorySearchQuery = createQuery(() => ({
        queryKey: [
            "inventory-search",
            searchTerm,
            filterCompatible ? form.selectedDeviceId : null,
        ],
        queryFn: async () => {
            const params: any = {};
            // If API supports search query param? The repo findAll didn't seem to explicitly handle "name" search in findAll args?
            // Actually repo findAll only takes deviceId.
            // But controller likely handles search?
            // I'll assume client side filtering of the "Compatible" batch or Server Side if I updated controller.
            // Let's check repository again. Only deviceId.
            // So I will fetch by deviceId (if filterCompatible) OR all (if not).
            // THEN filter by searchTerm client side reducers if the API doesn't support ?search or ?q.
            // Wait, standard CRUD usually supports it.
            // Assuming I'll fetch and filter client side for now to be safe, but minimal fetch.
            // If I filter by deviceId, the result list is small.
            // If I fetch ALL, it's large.

            // Re-reading repository: findAll(deviceId?: string).
            // It filters by device compatibility if deviceId is passed.
            // It does NOT filter by name.

            const res = await InventoryService.getProducts(
                filterCompatible && form.selectedDeviceId
                    ? form.selectedDeviceId
                    : undefined,
            );
            return res;
        },
        enabled: showInventoryModal,
    }));

    let filteredInventory = $derived(
        (inventorySearchQuery.data || []).filter(
            (item: any) =>
                searchTerm === "" ||
                item.name?.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    );

    let calendarDays = $derived(getMonthDays(calendarDate));

    // Calendar Helpers
    function getMonthDays(date: Date): Date[] {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days: Date[] = [];
        const startDay = firstDay.getDay() || 7;
        for (let i = startDay - 1; i > 0; i--) {
            const d = new Date(firstDay);
            d.setDate(d.getDate() - i);
            days.push(d);
        }
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            const d = new Date(lastDay);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    }

    function isPastDate(date: Date): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today;
    }

    function isToday(date: Date): boolean {
        return date.toDateString() === new Date().toDateString();
    }

    function isCurrentMonth(date: Date): boolean {
        return date.getMonth() === calendarDate.getMonth();
    }

    function getServicesForDate(date: Date): number {
        return services.filter((s) => {
            if (!s.estimatedCompletionDate) return false;
            const sDate = new Date(s.estimatedCompletionDate);
            return sDate.toDateString() === date.toDateString();
        }).length;
    }

    function selectDate(date: Date) {
        if (isPastDate(date)) {
            toast.error("Tidak dapat memilih tanggal yang sudah lewat");
            return;
        }
        if (!form.isWalkin && !form.technician) {
            toast.error("Teknisi harus ditugaskan terlebih dahulu");
            return;
        }
        // Validation: Must ensure price is entered
        if (!form.isWalkin && !form.isPriceRange && !form.estimatedCost) {
            toast.error("Estimasi biaya harus diisi terlebih dahulu");
            return;
        }
        if (
            !form.isWalkin &&
            form.isPriceRange &&
            !form.minPrice &&
            !form.maxPrice
        ) {
            toast.error("Range biaya harus diisi terlebih dahulu");
            return;
        }

        // Fix: Use local date string construction to avoid UTC shift
        // date is already a Date object at 00:00 local time (from getMonthDays)
        // We just need YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        form.estimatedCompletionDate = `${year}-${month}-${day}`;

        showCalendar = false;
    }

    function navigateMonth(dir: number) {
        const newDate = new Date(calendarDate);
        newDate.setMonth(newDate.getMonth() + dir);
        calendarDate = newDate;
    }

    // Helper for Modal
    function handleAddPart(item: any) {
        form.addInventoryPart(item);
        showInventoryModal = false;
    }
</script>

<div class="grid gap-6 animate-in slide-in-from-right-4 duration-500">
    <div class="space-y-4">
        <h3
            class="text-xl font-bold flex items-center gap-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
        >
            {form.isWalkin ? "Service & Sparepart (Walk-in)" : "Detail Service"}
        </h3>
        <p class="text-sm text-muted-foreground">
            {form.isWalkin
                ? "Input layanan dan sparepart untuk service ditunggu."
                : "Diagnosa awal dan estimasi pengerjaan untuk service ditinggal."}
        </p>
    </div>

    <div
        class="space-y-6 p-6 sm:p-8 border border-muted/60 rounded-3xl bg-card/50 shadow-sm relative overflow-hidden group"
    >
        <!-- Glow Effect -->
        <div
            class="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 transition-opacity opacity-0 group-hover:opacity-100"
        ></div>
        <!-- Complaint -->
        <!-- Complaint -->
        <div class="space-y-3">
            <Label
                for="complaint"
                class="text-sm font-semibold text-foreground/80"
            >
                {form.isWalkin
                    ? "Kerusakan yang Diperbaiki"
                    : "Keluhan Customer"}
                <span class="text-red-500">*</span>
            </Label>
            <div class="relative group/input">
                <div
                    class="absolute top-3.5 left-3 flex items-start pointer-events-none"
                >
                    <AlertCircle
                        class="h-4 w-4 text-muted-foreground transition-colors group-focus-within/input:text-primary"
                    />
                </div>
                <Textarea
                    id="complaint"
                    bind:value={form.complaint}
                    placeholder={form.isWalkin
                        ? "Contoh: Ganti LCD, Ganti Baterai"
                        : "Contoh: HP sering restart sendiri saat panas..."}
                    rows={3}
                    class="pl-10 min-h-[100px] rounded-2xl bg-background/50 border-muted-foreground/20 focus:bg-background transition-all focus:ring-4 focus:ring-primary/10 resize-none"
                />
            </div>
        </div>

        <!-- Technician (Hidden for Intake Mode based on user request to simplify) -->
        {#if form.isWalkin}
            <div class="space-y-2">
                <Label class="flex justify-between">
                    <span>Teknisi <span class="text-red-500">*</span></span>
                </Label>
                <Select type="single" bind:value={form.technician}>
                    <SelectTrigger>
                        {technicians.find((t) => t.id === form.technician)
                            ?.name || "Pilih Teknisi"}
                    </SelectTrigger>
                    <SelectContent>
                        {#each technicians as tech}
                            <SelectItem value={tech.id}>{tech.name}</SelectItem>
                        {/each}
                    </SelectContent>
                </Select>
            </div>
        {/if}

        {#if form.isWalkin}
            <!-- Walk-in Specific UI -->
            <div
                class="p-6 bg-blue-50/30 border border-blue-100/50 rounded-3xl space-y-6"
            >
                <div class="flex items-center gap-3 text-blue-800">
                    <div class="p-2 bg-blue-100 rounded-lg">
                        <Package class="h-5 w-5" />
                    </div>
                    <h4 class="font-bold text-base">Biaya & Sparepart</h4>
                </div>

                <div class="grid md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <Label for="serviceFee"
                            >Total Biaya Service (Jasa + Part) <span
                                class="text-red-500">*</span
                            ></Label
                        >
                        <CurrencyInput
                            bind:value={form.serviceFee}
                            placeholder="Contoh: 150000"
                            class="bg-white"
                        />
                    </div>
                </div>

                <div class="space-y-4">
                    <Label class="text-sm font-semibold text-foreground/80"
                        >Sumber Sparepart</Label
                    >
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {#each SPAREPART_SOURCES as src}
                            <label
                                class={cn(
                                    "relative overflow-hidden flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 text-sm font-bold gap-3 group/card",
                                    form.sparepartSource === src.v
                                        ? "bg-primary/5 text-primary border-primary shadow-lg shadow-primary/10 scale-[1.02]"
                                        : "bg-card hover:bg-muted/50 border-muted hover:border-primary/50 hover:shadow-md",
                                )}
                            >
                                <input
                                    type="radio"
                                    bind:group={form.sparepartSource}
                                    value={src.v}
                                    class="sr-only"
                                    onchange={() => {
                                        if (src.v === "customer") {
                                            form.warranty = "none";
                                            toast.info(
                                                "Mode 'Bawa Sendiri' aktif. Estimasi biaya hanya mencakup jasa pasang/labor.",
                                            );
                                        }
                                    }}
                                />
                                <div
                                    class={cn(
                                        "p-2 rounded-full transition-colors",
                                        form.sparepartSource === src.v
                                            ? "bg-white shadow-sm"
                                            : "bg-muted group-hover/card:bg-white",
                                    )}
                                >
                                    {#if src.v === "none"}
                                        <X class="h-5 w-5" />
                                    {:else if src.v === "inventory"}
                                        <Package class="h-5 w-5" />
                                    {:else if src.v === "external"}
                                        <Search class="h-5 w-5" />
                                    {:else if src.v === "customer"}
                                        <Wrench class="h-5 w-5" />
                                    {/if}
                                </div>
                                <span>{src.l}</span>

                                {#if form.sparepartSource === src.v}
                                    <div
                                        class="absolute inset-0 border-2 border-primary rounded-2xl pointer-events-none"
                                    ></div>
                                {/if}
                            </label>
                        {/each}
                    </div>
                </div>

                {#if form.sparepartSource === "inventory"}
                    <div class="space-y-2 animate-in slide-in-from-top-2">
                        <Button
                            variant="outline"
                            class="w-full justify-between h-11 rounded-xl border-dashed hover:border-primary hover:bg-primary/5"
                            onclick={() => (showInventoryModal = true)}
                        >
                            <span class="flex items-center">
                                <Search class="h-4 w-4 mr-2 text-primary" />
                                Cari dari Inventory
                            </span>
                            <span
                                class="text-[10px] uppercase font-bold text-muted-foreground"
                                >Klik untuk buka katalog</span
                            >
                        </Button>
                        {#if form.selectedParts.length > 0}
                            <div
                                class="border rounded-xl overflow-hidden bg-white shadow-sm"
                            >
                                {#each form.selectedParts as part, index}
                                    <div
                                        class="flex items-center justify-between p-3 border-b last:border-0 hover:bg-muted/30 transition-colors"
                                    >
                                        <div>
                                            <p class="text-sm font-bold">
                                                {part.name}
                                            </p>
                                            <p
                                                class="text-xs text-muted-foreground flex items-center gap-1"
                                            >
                                                <Package class="h-3 w-3" /> Stok:
                                                {part.stock}
                                            </p>
                                        </div>
                                        <div class="flex items-center gap-3">
                                            <Badge
                                                variant="outline"
                                                class="bg-primary/5 text-primary border-primary/10"
                                            >
                                                Rp {parseInt(
                                                    part.sellPrice || 0,
                                                ).toLocaleString("id-ID")}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                class="h-8 w-8 text-destructive hover:text-white hover:bg-destructive transition-all rounded-lg"
                                                onclick={() =>
                                                    form.removePart(index)}
                                            >
                                                <X class="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {:else if form.sparepartSource === "external"}
                    <div
                        class="grid md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 p-4 bg-white border rounded-xl shadow-sm"
                    >
                        <div class="space-y-2 text-left">
                            <Label
                                class="text-xs font-bold uppercase text-muted-foreground"
                                >Nama Sparepart</Label
                            >
                            <Input
                                bind:value={form.extPartName}
                                placeholder="Contoh: LCD KW Super"
                                class="h-11 rounded-lg"
                            />
                        </div>
                        <div class="space-y-2 text-left">
                            <Label
                                class="text-xs font-bold uppercase text-muted-foreground"
                                >Harga Beli (Modal)</Label
                            >
                            <CurrencyInput
                                bind:value={form.extPartBuyPrice}
                                class="h-11 rounded-lg"
                            />
                        </div>
                    </div>
                {:else if form.sparepartSource === "customer"}
                    <div
                        class="space-y-3 animate-in slide-in-from-top-2 p-4 bg-orange-50/50 border border-orange-200 border-dashed rounded-xl"
                    >
                        <div class="flex items-start gap-3">
                            <div class="p-2 bg-orange-100 rounded-lg">
                                <AlertCircle class="h-5 w-5 text-orange-600" />
                            </div>
                            <div class="space-y-1">
                                <h5 class="text-sm font-bold text-orange-800">
                                    Part Disediakan Pelanggan
                                </h5>
                                <p
                                    class="text-xs text-orange-700 leading-relaxed"
                                >
                                    Customer membawa sparepart sendiri. Pastikan
                                    "Total Biaya" di atas <b
                                        >hanya jasa pasang/labor</b
                                    >. <br />
                                    Sesuai kebijakan: <b>Tanpa Garansi</b> untuk
                                    sparepart yang dibawa sendiri.
                                </p>
                            </div>
                        </div>
                    </div>
                {:else}
                    <div class="space-y-2 animate-in slide-in-from-top-2">
                        <Label
                            class="text-xs font-bold uppercase text-muted-foreground"
                            >Keterangan Pengerjaan</Label
                        >
                        <Textarea
                            bind:value={form.serviceDescription}
                            placeholder="Jumper, Cleaning, Software, Re-flek, dll..."
                            rows={2}
                            class="bg-white rounded-xl"
                        />
                    </div>
                {/if}

                <!-- Calculation Summary -->
                <div class="bg-white p-4 rounded-lg border space-y-4 text-sm">
                    <!-- Warranty Selection -->
                    <div class="space-y-2">
                        <Label
                            class="text-xs font-bold uppercase text-muted-foreground flex justify-between"
                        >
                            Garansi Service
                            <span
                                class="text-[10px] normal-case font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                            >
                                Opsional untuk dicetak
                            </span>
                        </Label>
                        <Select
                            type="single"
                            bind:value={form.warranty}
                            disabled={form.sparepartSource === "customer"}
                            onValueChange={(v) => {
                                if (form.sparepartSource === "customer") {
                                    form.warranty = "none";
                                    toast.error(
                                        "Garansi tidak tersedia untuk sparepart bawaan customer",
                                    );
                                }
                            }}
                        >
                            <SelectTrigger
                                class={cn(
                                    "h-9",
                                    form.sparepartSource === "customer" &&
                                        "bg-muted text-muted-foreground opacity-70",
                                )}
                            >
                                {form.sparepartSource === "customer"
                                    ? "Tanpa Garansi (Bawa Sendiri)"
                                    : form.warranty || "Pilih Garansi"}
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none"
                                    >Tanpa Garansi</SelectItem
                                >
                                <SelectItem value="1 Minggu"
                                    >1 Minggu</SelectItem
                                >
                                <SelectItem value="1 Bulan">1 Bulan</SelectItem>
                                <SelectItem value="3 Bulan">3 Bulan</SelectItem>
                                <SelectItem value="6 Bulan">6 Bulan</SelectItem>
                                <SelectItem value="1 Tahun">1 Tahun</SelectItem>
                            </SelectContent>
                        </Select>
                        {#if form.sparepartSource === "customer"}
                            <p
                                class="text-[10px] text-destructive font-medium animate-in slide-in-from-top-1"
                            >
                                * Sparepart bawa sendiri otomatis <b
                                    >Tanpa Garansi</b
                                >
                            </p>
                        {/if}
                    </div>

                    <Separator class="my-2" />

                    <div class="flex justify-between">
                        <span class="text-muted-foreground"
                            >Estimasi Jasa (Profit)</span
                        >
                        <span class="font-medium text-blue-600"
                            >Rp {form.walkinServiceFee.toLocaleString(
                                "id-ID",
                            )}</span
                        >
                    </div>
                    <div class="flex justify-between">
                        <span class="text-muted-foreground"
                            >Total Modal Part</span
                        >
                        <span class="font-medium"
                            >Rp {form.totalPartPrice.toLocaleString(
                                "id-ID",
                            )}</span
                        >
                    </div>
                    <Separator class="my-2" />
                    <div class="flex justify-between text-base font-bold">
                        <span>Grand Total</span>
                        <span class="text-green-600"
                            >Rp {form.grandTotal.toLocaleString("id-ID")}</span
                        >
                    </div>
                </div>
            </div>
        {:else if !form.isWalkin && false}
            <!-- Hiding Diagnosis/Cost for Intake as per request. "Remove Diagnosis/Cost fields from initial creation" -->
            <!-- Regular Service UI (Diagnosis/Cost) - NOW HIDDEN/REMOVED for Intake Phase -->
            <!-- Use 'false' to effectively comment it out but keep code for reference if needed later or delete -->
            <div class="space-y-4">
                <Separator />
                <h4
                    class="font-medium flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider"
                >
                    Diagnosa Awal (Opsional)
                </h4>
                <!-- ... Content hidden ... -->
            </div>
        {/if}
    </div>
</div>

<!-- Global Inventory Modal -->
{#if showInventoryModal}
    <div
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
        <div
            class="bg-background w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
        >
            <div class="p-4 border-b flex items-center justify-between">
                <h3 class="font-semibold text-lg">Pilih Sparepart</h3>
                <Button
                    variant="ghost"
                    size="icon"
                    onclick={() => (showInventoryModal = false)}
                >
                    <X class="h-5 w-5" />
                </Button>
            </div>

            <!-- Search & Filter bar -->
            <div class="p-4 border-b bg-muted/30 space-y-3">
                <div class="relative">
                    <Search
                        class="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                        bind:value={searchTerm}
                        placeholder="Cari nama barang..."
                        class="pl-9"
                    />
                </div>

                {#if form.selectedDeviceId}
                    <div class="flex items-center space-x-2">
                        <Switch
                            id="filter-compatible"
                            bind:checked={filterCompatible}
                        />
                        <Label
                            for="filter-compatible"
                            class="cursor-pointer flex items-center gap-2"
                        >
                            Filter Kompatibel: <span class="font-bold"
                                >{form.phoneBrand} {form.phoneModel}</span
                            >
                        </Label>
                    </div>
                {/if}
            </div>

            <div class="flex-1 overflow-y-auto p-2 space-y-1">
                {#if inventorySearchQuery.isLoading}
                    <div class="text-center py-8">Loading...</div>
                {:else if filteredInventory.length === 0}
                    <div class="text-center py-12 text-muted-foreground">
                        <p>Tidak ada barang ditemukan</p>
                        {#if filterCompatible}
                            <p class="text-xs mt-2">
                                Coba matikan filter kompatibilitas
                            </p>
                        {/if}
                    </div>
                {:else}
                    {#each filteredInventory as item}
                        <button
                            class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                            onclick={() => handleAddPart(item)}
                        >
                            <div>
                                <p
                                    class="font-medium group-hover:text-primary transition-colors"
                                >
                                    {item.name}
                                </p>
                                <div
                                    class="flex gap-2 text-xs text-muted-foreground"
                                >
                                    <Badge
                                        variant="outline"
                                        class="text-[10px] px-1 h-5"
                                        >Stok: {item.stock}</Badge
                                    >
                                    <span>#{item.id.substring(0, 6)}</span>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="font-medium text-sm">
                                    Rp {parseInt(
                                        (item as any).batches?.[0]?.sellPrice ||
                                            0,
                                    ).toLocaleString("id-ID")}
                                </p>
                                <span
                                    class="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Pilih
                                </span>
                            </div>
                        </button>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
{/if}
