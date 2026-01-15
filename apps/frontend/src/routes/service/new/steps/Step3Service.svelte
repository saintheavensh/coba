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
        ChevronLeft,
        ChevronRight,
        X,
    } from "lucide-svelte";
    import createCurrencyInput from "$lib/components/custom/currency-input.svelte"; // Assuming this is how it's used or I need to import the component.
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
    let filteredInventory = $derived(
        inventoryItems.filter((item: any) =>
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
        <h3 class="text-lg font-semibold flex items-center gap-2">
            <Wrench class="h-5 w-5 text-primary" />
            {form.isWalkin ? "Service & Sparepart (Walk-in)" : "Detail Service"}
        </h3>
        <p class="text-sm text-muted-foreground">
            {form.isWalkin
                ? "Input layanan dan sparepart untuk service ditunggu."
                : "Diagnosa awal dan estimasi pengerjaan untuk service ditinggal."}
        </p>
    </div>

    <div class="space-y-6 p-4 border rounded-xl bg-card/50 shadow-sm">
        <!-- Complaint -->
        <div class="space-y-2">
            <Label for="complaint">
                {form.isWalkin
                    ? "Kerusakan yang Diperbaiki"
                    : "Keluhan Customer"}
                <span class="text-red-500">*</span>
            </Label>
            <Textarea
                id="complaint"
                bind:value={form.complaint}
                placeholder={form.isWalkin
                    ? "Contoh: Ganti LCD, Ganti Baterai"
                    : "Contoh: HP sering restart sendiri saat panas"}
                rows={3}
                class="resize-none"
            />
        </div>

        <!-- Technician -->
        <div class="space-y-2">
            <Label class="flex justify-between">
                <span
                    >Teknisi {#if form.isWalkin}<span class="text-red-500"
                            >*</span
                        >{/if}</span
                >
                {#if !form.isWalkin}<span
                        class="text-xs text-muted-foreground font-normal"
                        >(Dapat diisi nanti)</span
                    >{/if}
            </Label>
            <Select type="single" bind:value={form.technician}>
                <SelectTrigger>
                    {technicians.find((t) => t.id === form.technician)?.name ||
                        "Pilih Teknisi"}
                </SelectTrigger>
                <SelectContent>
                    {#if !form.isWalkin}
                        <SelectItem value="">Belum Ditentukan</SelectItem>
                    {/if}
                    {#each technicians as tech}
                        <SelectItem value={tech.id}>{tech.name}</SelectItem>
                    {/each}
                </SelectContent>
            </Select>
        </div>

        {#if form.isWalkin}
            <!-- Walk-in Specific UI -->
            <div
                class="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-4"
            >
                <div class="flex items-center gap-2 text-blue-800">
                    <Package class="h-4 w-4" />
                    <h4 class="font-semibold text-sm">Biaya & Sparepart</h4>
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

                <div class="space-y-3">
                    <Label>Sumber Sparepart</Label>
                    <div class="grid grid-cols-3 gap-2">
                        {#each [{ v: "none", l: "Tanpa Part" }, { v: "inventory", l: "Inventory" }, { v: "external", l: "Beli Luar" }] as src}
                            <label
                                class={`
                                flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all text-sm font-medium
                                ${form.sparepartSource === src.v ? "bg-primary text-primary-foreground border-primary" : "bg-white hover:bg-gray-50"}
                            `}
                            >
                                <input
                                    type="radio"
                                    bind:group={form.sparepartSource}
                                    value={src.v}
                                    class="sr-only"
                                />
                                {src.l}
                            </label>
                        {/each}
                    </div>
                </div>

                {#if form.sparepartSource === "inventory"}
                    <div class="space-y-2 animate-in slide-in-from-top-2">
                        <Button
                            variant="outline"
                            class="w-full justify-between"
                            onclick={() => (showInventoryModal = true)}
                        >
                            <span>
                                <Search class="h-4 w-4 inline mr-2" />
                                Cari dari Inventory
                            </span>
                            <span class="text-xs text-muted-foreground"
                                >Klik untuk cari</span
                            >
                        </Button>
                        {#if form.selectedParts.length > 0}
                            <div
                                class="border rounded-lg overflow-hidden bg-white"
                            >
                                {#each form.selectedParts as part, index}
                                    <div
                                        class="flex items-center justify-between p-3 border-b last:border-0"
                                    >
                                        <div>
                                            <p class="text-sm font-medium">
                                                {part.name}
                                            </p>
                                            <p
                                                class="text-xs text-muted-foreground"
                                            >
                                                Stok: {part.stock}
                                            </p>
                                        </div>
                                        <div class="flex items-center gap-3">
                                            <Badge variant="secondary">
                                                Rp {parseInt(
                                                    part.sellPrice || 0,
                                                ).toLocaleString("id-ID")}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                class="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onclick={() =>
                                                    form.removePart(index)}
                                            >
                                                <Trash2 class="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {:else if form.sparepartSource === "external"}
                    <div
                        class="grid md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 p-3 bg-white border rounded-lg"
                    >
                        <div class="space-y-2">
                            <Label>Nama Sparepart</Label>
                            <Input
                                bind:value={form.extPartName}
                                placeholder="Contoh: LCD KW Super"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label>Harga Beli (Modal)</Label>
                            <CurrencyInput bind:value={form.extPartBuyPrice} />
                        </div>
                    </div>
                {:else}
                    <div class="space-y-2 animate-in slide-in-from-top-2">
                        <Label>Keterangan Pengerjaan</Label>
                        <Textarea
                            bind:value={form.serviceDescription}
                            placeholder="Jumper, Cleaning, Software..."
                            rows={2}
                            class="bg-white"
                        />
                    </div>
                {/if}

                <!-- Calculation Summary -->
                <div class="bg-white p-4 rounded-lg border space-y-2 text-sm">
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
        {:else}
            <!-- Regular Service UI -->
            <div class="space-y-4">
                <Separator />
                <h4
                    class="font-medium flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider"
                >
                    Diagnosa Awal
                </h4>

                <div class="grid md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <Label>Pemeriksaan Awal</Label>
                        <Textarea
                            bind:value={form.initialDiagnosis}
                            placeholder="Cek arus ampere, tes fungsi..."
                            rows={3}
                        />
                    </div>
                    <div class="space-y-2">
                        <Label>Kemungkinan Kerusakan</Label>
                        <Textarea
                            bind:value={form.possibleCauses}
                            placeholder="IC Power, EMMC, Short kapasitor..."
                            rows={3}
                        />
                    </div>
                </div>

                <div class="grid md:grid-cols-2 gap-4">
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <Label>Estimasi Biaya</Label>
                            <label
                                class="flex items-center gap-2 text-xs cursor-pointer text-muted-foreground hover:text-foreground"
                            >
                                <input
                                    type="checkbox"
                                    bind:checked={form.isPriceRange}
                                    class="rounded border-primary text-primary focus:ring-primary"
                                />
                                Gunakan Range Harga
                            </label>
                        </div>
                        {#if form.isPriceRange}
                            <div class="flex gap-2 items-center">
                                <CurrencyInput
                                    bind:value={form.minPrice}
                                    placeholder="Min"
                                />
                                <span>-</span>
                                <CurrencyInput
                                    bind:value={form.maxPrice}
                                    placeholder="Max"
                                />
                            </div>
                        {:else}
                            <CurrencyInput
                                bind:value={form.estimatedCost}
                                placeholder="Rp 0"
                            />
                        {/if}
                    </div>
                    <div class="space-y-3">
                        <Label>Uang Muka / DP (Opsional)</Label>
                        <CurrencyInput
                            bind:value={form.downPayment}
                            placeholder="Rp 0"
                        />
                    </div>
                </div>

                <div class="pt-2">
                    <Label class="flex items-center gap-2 mb-2">
                        <CalendarIcon class="h-4 w-4" /> Estimasi Selesai
                    </Label>
                    {#if !form.technician || (!form.isPriceRange && !form.estimatedCost) || (form.isPriceRange && !form.minPrice && !form.maxPrice)}
                        <div
                            class="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm flex gap-2"
                        >
                            <AlertCircle class="h-4 w-4 shrink-0 mt-0.5" />
                            Pilih teknisi dan isi estimasi biaya untuk mengatur estimasi
                            tanggal selesai.
                        </div>
                    {:else}
                        <div class="relative">
                            <Button
                                variant="outline"
                                class={`w-full justify-start text-left font-normal ${!form.estimatedCompletionDate && "text-muted-foreground"}`}
                                onclick={() => (showCalendar = !showCalendar)}
                            >
                                <CalendarIcon class="mr-2 h-4 w-4" />
                                {form.estimatedCompletionDate
                                    ? new Date(
                                          form.estimatedCompletionDate,
                                      ).toLocaleDateString("id-ID", {
                                          weekday: "long",
                                          day: "numeric",
                                          month: "long",
                                          year: "numeric",
                                      })
                                    : "Pilih tanggal"}
                            </Button>

                            {#if showCalendar}
                                <div
                                    class="absolute bottom-full left-0 mb-2 p-4 bg-popover text-popover-foreground border rounded-lg shadow-xl w-72 z-50"
                                >
                                    <div
                                        class="flex items-center justify-between mb-4"
                                    >
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onclick={() => navigateMonth(-1)}
                                        >
                                            <ChevronLeft class="h-4 w-4" />
                                        </Button>
                                        <span class="font-semibold text-sm">
                                            {calendarDate.toLocaleDateString(
                                                "id-ID",
                                                {
                                                    month: "long",
                                                    year: "numeric",
                                                },
                                            )}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onclick={() => navigateMonth(1)}
                                        >
                                            <ChevronRight class="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div
                                        class="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground mb-2"
                                    >
                                        {#each ["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mn"] as d}<div
                                            >
                                                {d}
                                            </div>{/each}
                                    </div>
                                    <div class="grid grid-cols-7 gap-1">
                                        {#each calendarDays as day}
                                            <button
                                                class={`
                                                    h-8 w-8 rounded-full flex items-center justify-center text-xs relative
                                                    ${!isCurrentMonth(day) && "text-muted-foreground opacity-50"}
                                                    ${isToday(day) && "bg-accent text-accent-foreground font-bold"}
                                                    ${form.estimatedCompletionDate === day.toISOString().split("T")[0] && "bg-primary text-primary-foreground hover:bg-primary/90"}
                                                    ${isPastDate(day) ? "opacity-30 cursor-not-allowed" : "hover:bg-muted"}
                                                `}
                                                disabled={isPastDate(day)}
                                                onclick={() => selectDate(day)}
                                            >
                                                {day.getDate()}
                                                {#if getServicesForDate(day) > 0}
                                                    <span
                                                        class="absolute -bottom-1 -right-1 h-3 w-3 bg-orange-500 rounded-full text-[8px] flex items-center justify-center text-white"
                                                    >
                                                        {getServicesForDate(
                                                            day,
                                                        )}
                                                    </span>
                                                {/if}
                                            </button>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
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

            <div class="p-4 border-b bg-muted/30">
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
            </div>

            <div class="flex-1 overflow-y-auto p-2 space-y-1">
                {#if filteredInventory.length === 0}
                    <div class="text-center py-12 text-muted-foreground">
                        <p>Tidak ada barang ditemukan</p>
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
                                        item.batches?.[0]?.sellPrice || 0,
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
