<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Button } from "$lib/components/ui/button";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";
    import { Separator } from "$lib/components/ui/separator";

    import type { ServiceFormStore } from "../form.svelte";
    import { API_URL } from "$lib/api";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/components/ui/dialog";
    import PatternLock from "$lib/components/ui/pattern-lock.svelte";

    // New Imports for Device Search
    import { InventoryService } from "$lib/services/inventory.service";
    import { BrandsService } from "$lib/services/brands.service";
    import { createQuery } from "@tanstack/svelte-query";
    import { Badge } from "$lib/components/ui/badge";
    import Combobox from "$lib/components/ui/combobox.svelte";
    import {
        CheckCircle,
        Smartphone,
        Grid3X3,
        Camera,
        X,
        Upload,
        AlertCircle,
        Search,
        Loader2,
        Plus,
    } from "lucide-svelte";
    import { cn } from "$lib/utils";
    import { toast } from "svelte-sonner";

    let { form }: { form: ServiceFormStore } = $props();

    let deviceSearch = $state("");
    let debouncedSearch = $state("");
    let searchTimeout: any;

    $effect(() => {
        const term = deviceSearch; // Capture dependency synchronously
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            debouncedSearch = term;
        }, 300); // 300ms debounce
    });

    let manualMode = $state(false); // For Model Search
    let manualBrandMode = $state(false); // For Brand Selection
    let manualColorMode = $state(false); // For Color Selection

    $effect(() => {
        if (form.selectedDeviceId) {
            manualMode = false;
        }
    });

    const devicesQuery = createQuery(() => ({
        queryKey: ["devices", debouncedSearch, form.phoneBrand],
        queryFn: () =>
            InventoryService.getDevices(
                debouncedSearch,
                50,
                0,
                form.phoneBrand,
            ),
    }));

    $effect(() => {
        if (devicesQuery.isError) {
            toast.error(
                "Gagal mengambil data perangkat. Cek koneksi server atau restart ulang aplikasi.",
            );
        }
    });

    const brandsQuery = createQuery(() => ({
        queryKey: ["brands"],
        queryFn: BrandsService.getAll,
    }));

    import {
        DEVICE_STATUS_OPTIONS,
        PHYSICAL_CONDITIONS,
        COMPLETENESS_OPTIONS,
    } from "@repo/shared";

    const isErrorStatus = (status: string) =>
        ["mati_total", "restart", "blank_hitam"].includes(status);

    function handleSavePattern() {
        form.isPatternOpen = false;
    }

    function handleSearch(term: string) {
        deviceSearch = term;
    }
</script>

<div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <!-- Header Section -->
    <!-- Header Section -->
    <div class="flex items-start justify-between">
        <div class="space-y-1">
            <h3
                class="text-xl font-bold tracking-tight flex items-center gap-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
            >
                <Smartphone class="h-6 w-6 text-primary" />
                Identitas Perangkat
            </h3>
            <p class="text-sm text-muted-foreground">
                Rekam detail spesifikasi dan identitas unik perangkat pelanggan.
            </p>
        </div>
        {#if form.selectedDeviceId}
            <Badge
                variant="outline"
                class="bg-green-50 text-green-700 border-green-200 py-1"
            >
                <CheckCircle class="h-3 w-3 mr-1" /> Terverifikasi
            </Badge>
        {/if}
    </div>

    <!-- 1. Identitas Utama (Card & Search) -->
    <div class="relative group">
        <!-- Card Background & Glow Style Layer -->
        <div
            class="absolute inset-0 rounded-3xl border border-muted/60 bg-card/50 shadow-sm overflow-hidden -z-10"
        >
            <!-- Glow Effect -->
            <div
                class="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl transition-opacity opacity-0 group-hover:opacity-100"
            ></div>
        </div>

        <!-- Content Layer (Overflow Visible for Dropdown) -->
        <div class="grid gap-6 p-6 sm:p-8">
            <!-- A. Selected Device Card -->
            {#if form.selectedDeviceId || (manualMode && form.phoneModel)}
                <div
                    class="flex items-start gap-5 p-4 bg-muted/30 rounded-xl border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300"
                >
                    <!-- Device Image -->
                    <div
                        class="w-20 h-24 sm:w-24 sm:h-28 rounded-lg bg-white border flex items-center justify-center overflow-hidden shrink-0 shadow-sm"
                    >
                        {#if form.deviceImage}
                            <img
                                src={form.deviceImage}
                                alt={form.phoneModel}
                                class="w-full h-full object-cover"
                            />
                        {:else}
                            <Smartphone
                                class="h-8 w-8 text-muted-foreground/30"
                            />
                        {/if}
                    </div>

                    <!-- Details -->
                    <div class="flex-1 min-w-0 space-y-1">
                        <div class="flex items-start justify-between">
                            <div>
                                <p
                                    class="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                                >
                                    Device Terpilih
                                </p>
                                <h4
                                    class="text-lg font-bold text-primary truncate"
                                >
                                    {form.phoneBrand}
                                    {form.phoneModel}
                                </h4>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                class="h-7 text-xs text-muted-foreground hover:text-destructive"
                                onclick={() => {
                                    form.selectedDeviceId = null;
                                    form.phoneBrand = ""; // Reset brand to allow re-selection
                                    form.phoneModel = "";
                                    manualMode = false;
                                    manualBrandMode = false;
                                    manualColorMode = false;
                                    form.phoneColor = ""; // Reset color
                                    form.deviceImage = null; // Reset image
                                    form.deviceColors = []; // Reset colors
                                }}
                            >
                                <span class="mr-2">Ganti</span>
                                <X class="h-3 w-3" />
                            </Button>
                        </div>

                        <div class="flex items-center gap-2 mt-2">
                            {#if form.selectedDeviceId && devicesQuery.data?.find((d) => d.id === form.selectedDeviceId)?.code}
                                <Badge
                                    variant="secondary"
                                    class="font-mono text-[10px] h-5"
                                >
                                    {devicesQuery.data.find(
                                        (d) => d.id === form.selectedDeviceId,
                                    )?.code}
                                </Badge>
                            {/if}
                            {#if manualMode}
                                <Badge
                                    variant="outline"
                                    class="text-orange-600 border-orange-200 bg-orange-50 text-[10px] h-5"
                                >
                                    Input Manual
                                </Badge>
                            {/if}
                        </div>

                        <!-- Color Selection inside Card/Context -->
                        <div class="mt-4 max-w-xs">
                            <Label class="text-xs font-semibold mb-1.5 block"
                                >Warna Perangkat</Label
                            >
                            {#if form.deviceColors && form.deviceColors.length > 0}
                                <Select
                                    type="single"
                                    value={manualColorMode
                                        ? "Lainnya"
                                        : form.phoneColor}
                                    onValueChange={(v) => {
                                        if (v === "Lainnya") {
                                            manualColorMode = true;
                                            form.phoneColor = ""; // Clear for manual input
                                        } else {
                                            manualColorMode = false;
                                            form.phoneColor = v;
                                        }
                                    }}
                                >
                                    <SelectTrigger
                                        class="h-9 text-sm bg-background"
                                    >
                                        {form.phoneColor || "Pilih Warna"}
                                    </SelectTrigger>
                                    <SelectContent>
                                        {#each form.deviceColors as color}
                                            <SelectItem value={color}
                                                >{color}</SelectItem
                                            >
                                        {/each}
                                        <SelectItem value="Lainnya"
                                            >Lainnya...</SelectItem
                                        >
                                    </SelectContent>
                                </Select>
                                {#if form.phoneColor === "Lainnya" || manualColorMode}
                                    <input
                                        bind:value={form.phoneColor}
                                        placeholder="Ketik warna..."
                                        class="mt-2 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 animate-in fade-in slide-in-from-top-1"
                                    />
                                {/if}
                            {:else}
                                <input
                                    bind:value={form.phoneColor}
                                    placeholder="Warna (Hitam, Putih...)"
                                    class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            {/if}
                        </div>
                    </div>
                </div>
            {:else}
                <!-- B. Search Interface -->
                <div class="space-y-4 animate-in fade-in duration-300">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Brand Select -->
                        <div class="space-y-2">
                            <Label class="text-sm font-semibold"
                                >Merk Perangkat <span class="text-destructive"
                                    >*</span
                                ></Label
                            >
                            {#if manualBrandMode}
                                <div
                                    class="flex gap-2 animate-in fade-in slide-in-from-left-2"
                                >
                                    <input
                                        bind:value={form.phoneBrand}
                                        placeholder="Ketik Merk..."
                                        class="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onclick={() => {
                                            manualBrandMode = false;
                                            form.phoneBrand = "";
                                            manualMode = false; // Turn off manual model too if cancelling brand
                                        }}
                                        title="Batal"
                                    >
                                        <X class="h-4 w-4" />
                                    </Button>
                                </div>
                            {:else}
                                <Select
                                    type="single"
                                    value={form.phoneBrand}
                                    onValueChange={(v) => {
                                        if (v === "Lainnya") {
                                            manualBrandMode = true;
                                            form.phoneBrand = ""; // Clear for manual input
                                            manualMode = true; // Auto-enable manual model input per user request
                                        } else {
                                            manualBrandMode = false;
                                            form.phoneBrand = v;
                                        }
                                    }}
                                >
                                    <SelectTrigger class="h-11 rounded-xl">
                                        {form.phoneBrand || "Pilih Brand"}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value=""
                                            >Semua Brand</SelectItem
                                        >
                                        {#if brandsQuery.data}
                                            {#each brandsQuery.data as brand}
                                                <SelectItem value={brand.name}
                                                    >{brand.name}</SelectItem
                                                >
                                            {/each}
                                        {/if}
                                        <Separator class="my-1" />
                                        <SelectItem
                                            value="Lainnya"
                                            class="font-bold text-primary"
                                            >Lainnya (Input Manual)</SelectItem
                                        >
                                    </SelectContent>
                                </Select>
                            {/if}
                        </div>

                        <!-- Model Search -->
                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <Label class="text-sm font-semibold"
                                    >Cari Model / Tipe <span
                                        class="text-destructive">*</span
                                    ></Label
                                >
                                {#if !manualMode}
                                    <button
                                        onclick={() => (manualMode = true)}
                                        class="text-[10px] font-bold text-primary hover:underline uppercase tracking-wide"
                                    >
                                        Input Manual?
                                    </button>
                                {:else}
                                    <button
                                        onclick={() => (manualMode = false)}
                                        class="text-[10px] font-bold text-primary hover:underline uppercase tracking-wide"
                                    >
                                        Cari Database
                                    </button>
                                {/if}
                            </div>

                            {#if manualMode}
                                <input
                                    bind:value={form.phoneModel}
                                    placeholder="Ketik tipe lengkap..."
                                    class="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-orange-50/10 border-orange-200/50"
                                />
                            {:else}
                                <div class="relative group">
                                    <Search
                                        class="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"
                                    />
                                    <input
                                        bind:value={deviceSearch}
                                        placeholder={form.phoneBrand
                                            ? `Cari tipe ${form.phoneBrand}...`
                                            : "Cari model..."}
                                        class={cn(
                                            "flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9 transition-all duration-200",
                                            deviceSearch.length > 0 &&
                                                (devicesQuery.data?.length ||
                                                    0) > 0
                                                ? "rounded-b-none border-b-0"
                                                : "",
                                        )}
                                    />
                                    {#if devicesQuery.isLoading}
                                        <Loader2
                                            class="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground animate-spin"
                                        />
                                    {/if}

                                    {#if deviceSearch.length > 0 && devicesQuery.data}
                                        <div
                                            class="absolute top-11 left-0 right-0 z-50 bg-popover border border-t-0 rounded-b-xl shadow-lg max-h-[300px] overflow-y-auto animate-in slide-in-from-top-2 duration-150"
                                        >
                                            {#if devicesQuery.data.length === 0}
                                                <div
                                                    class="p-4 text-center text-sm text-muted-foreground"
                                                >
                                                    Tidak ditemukan.
                                                    <button
                                                        class="text-primary hover:underline font-semibold ml-1"
                                                        onclick={() => {
                                                            manualMode = true;
                                                            form.phoneModel =
                                                                deviceSearch;
                                                            deviceSearch = "";
                                                        }}
                                                    >
                                                        Pakai Manual?
                                                    </button>
                                                </div>
                                            {:else}
                                                {#each devicesQuery.data as device}
                                                    <button
                                                        class="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b last:border-0"
                                                        onclick={() => {
                                                            form.selectedDeviceId =
                                                                device.id;
                                                            form.phoneBrand =
                                                                device.brand;
                                                            form.phoneModel =
                                                                device.model;
                                                            form.deviceImage =
                                                                device.image ||
                                                                null; // Save Image
                                                            form.deviceColors =
                                                                device.colors ||
                                                                []; // Save Colors
                                                            deviceSearch = "";
                                                            toast.success(
                                                                `Terpilih: ${device.brand} ${device.model}`,
                                                            );
                                                        }}
                                                    >
                                                        <div
                                                            class="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 border"
                                                        >
                                                            {#if device.image}
                                                                <img
                                                                    src={device.image}
                                                                    alt={device.model}
                                                                    class="w-full h-full object-cover"
                                                                />
                                                            {:else}
                                                                <Smartphone
                                                                    class="h-5 w-5 text-muted-foreground/50"
                                                                />
                                                            {/if}
                                                        </div>
                                                        <div
                                                            class="flex-1 min-w-0"
                                                        >
                                                            <div
                                                                class="font-medium text-sm"
                                                            >
                                                                <span
                                                                    class="font-bold text-primary"
                                                                    >{device.brand}</span
                                                                >
                                                                {device.model}
                                                            </div>
                                                            {#if device.code}
                                                                <div
                                                                    class="text-[10px] text-muted-foreground font-mono"
                                                                >
                                                                    {device.code}
                                                                </div>
                                                            {/if}
                                                        </div>
                                                    </button>
                                                {/each}
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    </div>
                    <p class="text-[10px] text-muted-foreground ml-1">
                        * Pastikan memilih tipe yang sesuai agar data sparepart
                        sinkron.
                    </p>
                </div>
            {/if}
        </div>
    </div>

    <!-- 2. Status & Kondisi Awal -->
    <div class="space-y-4">
        <h4
            class="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
        >
            <Smartphone class="h-4 w-4" /> Kondisi & Status Awal
        </h4>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            {#each DEVICE_STATUS_OPTIONS as option}
                <label
                    class={cn(
                        "cursor-pointer group relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200",
                        form.phoneStatus === option.value
                            ? `${option.border} ${option.bg} shadow-sm ring-1 ring-current/10`
                            : "border-muted bg-card hover:border-primary/30 hover:bg-muted/50",
                    )}
                >
                    <input
                        type="radio"
                        bind:group={form.phoneStatus}
                        value={option.value}
                        class="sr-only"
                    />
                    <div
                        class={cn(
                            "p-2 rounded-full transition-colors",
                            form.phoneStatus === option.value
                                ? "bg-white dark:bg-black/20 shadow-sm"
                                : "bg-muted group-hover:bg-card",
                        )}
                    >
                        <Smartphone class={cn("h-5 w-5", option.color)} />
                    </div>
                    <span class="text-sm font-semibold">{option.label}</span>

                    {#if form.phoneStatus === option.value}
                        <CheckCircle
                            class="absolute top-2 right-2 h-4 w-4 text-primary animate-in zoom-in duration-300"
                        />
                    {/if}
                </label>
            {/each}
        </div>
    </div>

    <!-- 3. Keamanan & Identitas Unik -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="space-y-3">
            <Label for="imei" class="text-sm font-semibold"
                >IMEI Perangkat (15 digit)</Label
            >
            <div class="relative">
                <Input
                    id="imei"
                    bind:value={form.imei}
                    placeholder={isErrorStatus(form.phoneStatus)
                        ? "IMEI Tidak Wajib (HP Error)"
                        : "Cek di *#06#..."}
                    maxlength={15}
                    disabled={isErrorStatus(form.phoneStatus)}
                    class="h-11 rounded-xl font-mono tracking-wider focus:ring-2"
                />
                <Smartphone
                    class="absolute right-3 top-3 h-5 w-5 text-muted-foreground/30"
                />
            </div>
        </div>

        <div class="space-y-3">
            <Label for="pin" class="text-sm font-semibold"
                >PIN / Password / Pola</Label
            >
            <div class="flex gap-2">
                <Input
                    id="pin"
                    bind:value={form.pinPattern}
                    placeholder={isErrorStatus(form.phoneStatus)
                        ? "PIN Tidak Wajib"
                        : "Input PIN atau Pola..."}
                    class="h-11 rounded-xl font-mono"
                    disabled={isErrorStatus(form.phoneStatus)}
                />
                <Button
                    variant="outline"
                    size="icon"
                    class="h-11 w-11 rounded-xl shadow-sm hover:bg-primary hover:text-white transition-colors"
                    disabled={isErrorStatus(form.phoneStatus)}
                    onclick={() => (form.isPatternOpen = true)}
                >
                    <Grid3X3 class="h-5 w-5" />
                </Button>
            </div>
        </div>
    </div>

    <!-- 4. Kondisi Fisik & Kelengkapan -->
    <div
        class="grid md:grid-cols-2 gap-8 p-6 sm:p-8 border rounded-3xl bg-card/30 border-dashed"
    >
        <div class="space-y-4">
            <Label
                class="text-base font-bold text-primary flex items-center gap-2"
            >
                <div class="w-2 h-2 rounded-full bg-primary"></div>
                Kondisi Fisik
            </Label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {#each PHYSICAL_CONDITIONS as item}
                    <label
                        class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-white dark:hover:bg-card transition-all active:scale-[0.98]"
                    >
                        <input
                            type="checkbox"
                            bind:group={form.physicalConditions}
                            value={item.v}
                            class="w-4 h-4 rounded-md border-muted text-primary focus:ring-primary"
                        />
                        <span class="text-sm font-medium">{item.l}</span>
                    </label>
                {/each}
            </div>
        </div>

        <div class="space-y-4">
            <Label
                class="text-base font-bold text-primary flex items-center gap-2"
            >
                <div class="w-2 h-2 rounded-full bg-primary"></div>
                Kelengkapan Unit
            </Label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {#each COMPLETENESS_OPTIONS as item}
                    <label
                        class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-white dark:hover:bg-card transition-all active:scale-[0.98]"
                    >
                        <input
                            type="checkbox"
                            bind:group={form.completeness}
                            value={item.v}
                            class="w-4 h-4 rounded-md border-muted text-primary focus:ring-primary"
                        />
                        <span class="text-sm font-medium">{item.l}</span>
                    </label>
                {/each}
            </div>
        </div>

        <div class="md:col-span-2 space-y-3 pt-2">
            <Label for="notes" class="text-sm font-semibold"
                >Catatan Kondisi Tambahan</Label
            >
            <Input
                id="notes"
                bind:value={form.physicalNotes}
                placeholder="Misal: Tombol power mendem, layar ada shadow tipis..."
                class="h-11 rounded-xl"
            />
        </div>
    </div>

    <!-- 5. Foto Dokumentasi -->
    <div
        class="space-y-4 p-6 sm:p-8 border rounded-3xl bg-muted/30 border-dashed"
    >
        <div class="flex items-center justify-between">
            <Label
                class="flex items-center gap-2 text-base font-bold text-primary"
            >
                <Camera class="h-5 w-5" /> Dokumentasi Foto
            </Label>
            <span
                class="text-[10px] text-muted-foreground uppercase font-bold tracking-widest"
                >{form.photos.length} / 10 Foto</span
            >
        </div>

        <div class="flex flex-wrap gap-4">
            {#each form.photos as photo, index}
                <div
                    class="relative group w-24 h-24 sm:w-28 sm:h-28 animate-in zoom-in-50 duration-300"
                >
                    <img
                        src={`${API_URL}${photo}`}
                        alt="Preview"
                        class="w-full h-full object-cover rounded-2xl border-2 border-white shadow-md transition-transform group-hover:scale-105"
                    />
                    <button
                        type="button"
                        onclick={() => form.removePhoto(index)}
                        class="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                    >
                        <X class="h-3 w-3" />
                    </button>
                </div>
            {/each}

            <label
                class={cn(
                    "w-24 h-24 sm:w-28 sm:h-28 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 group shadow-sm",
                    form.isUploading
                        ? "bg-muted animate-pulse border-muted"
                        : "bg-card border-primary/20 hover:border-primary hover:bg-primary/5 hover:scale-[1.02]",
                )}
            >
                <div
                    class="p-2 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors"
                >
                    <Upload class="h-6 w-6 text-primary" />
                </div>
                <span
                    class="text-[10px] font-bold text-muted-foreground mt-2 group-hover:text-primary transition-colors text-center px-2"
                >
                    {form.isUploading ? "UPLOAD..." : "UNGGAH FOTO"}
                </span>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    class="sr-only"
                    onchange={form.handleFileUpload.bind(form)}
                    disabled={form.isUploading}
                />
            </label>
        </div>
        <p class="text-[11px] text-muted-foreground italic">
            Pastikan kondisi HP terlihat jelas. Foto akan tercetak di nota
            servis.
        </p>
    </div>
</div>

<!-- Pattern Lock Dialog -->
<Dialog bind:open={form.isPatternOpen}>
    <DialogContent class="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
            <DialogTitle class="text-xl">Input Pola Kunci</DialogTitle>
            <DialogDescription
                >Gambarkan pola kunci layar perangkat pelanggan di sini.</DialogDescription
            >
        </DialogHeader>
        <div
            class="flex flex-col items-center justify-center py-10 bg-muted/30 rounded-3xl border-2 border-dashed border-muted"
        >
            <PatternLock
                size={280}
                on:change={(e) => form.handlePatternChange(e.detail)}
                bind:value={form.patternPoints}
            />
            <div class="mt-8 px-6 py-2 bg-primary/10 rounded-full">
                <p
                    class="text-center font-mono tracking-[0.2em] text-lg font-black text-primary"
                >
                    {form.patternString || "MULAI GAMBAR"}
                </p>
            </div>
        </div>
        <DialogFooter class="flex gap-3 sm:gap-2">
            <Button
                variant="outline"
                class="flex-1 rounded-xl h-11"
                onclick={() => {
                    form.patternPoints = [];
                    form.pinPattern = "";
                }}>Reset Ulang</Button
            >
            <Button class="flex-1 rounded-xl h-11" onclick={handleSavePattern}
                >Simpan & Selesai</Button
            >
        </DialogFooter>
    </DialogContent>
</Dialog>
