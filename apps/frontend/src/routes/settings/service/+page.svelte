<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import {
        Card,
        CardContent,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Separator } from "$lib/components/ui/separator";
    import { Switch } from "$lib/components/ui/switch";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";
    import { toast } from "svelte-sonner";
    import {
        Loader2,
        Save,
        Wrench,
        Plus,
        Trash2,
        Hash,
        ShieldCheck,
        Workflow,
        Clock,
        AlertCircle,
        CalendarClock,
        Coins,
        Archive,
        ShieldAlert,
    } from "lucide-svelte";
    import { onMount } from "svelte";
    import {
        SettingsService,
        type ServiceSettings,
    } from "$lib/services/settings.service";
    import { settingsStore } from "$lib/stores/settings-store.svelte";
    import { cn } from "$lib/utils";

    let settings = $state<ServiceSettings>({
        numberFormat: "SRV-{YYYY}-{XXX}",
        resetCounterYearly: true,
        defaultStatus: "antrian",
        autoNotifyOnStatusChange: false,
        commissionModel: "completion",
        warrantyPresets: [],
        defaultWarrantyDays: 7,
        gracePeriodDays: 3,
        autoCloseAfterDays: 30,
        enableVirtualArchive: true,
        archiveExclusions: ["dikerjakan"],
        enableLiquidation: false,
        reminderBeforePickup: true,
        reminderDays: 7,
    });

    let newPresetLabel = $state("");
    let newPresetDays = $state(0);

    let loading = $state(true);
    let saving = $state(false);

    // Derived: Preview Service Number
    let previewNumber = $derived.by(() => {
        const date = new Date();
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");

        let fmt = settings.numberFormat || "SRV-{XXX}";
        fmt = fmt.replace(/{YYYY}/g, year);
        fmt = fmt.replace(/{YY}/g, year.slice(-2));
        fmt = fmt.replace(/{MM}/g, month);
        fmt = fmt.replace(/{DD}/g, day);
        fmt = fmt.replace(/{XXX+}/g, (m) => "0".repeat(m.length - 2) + "1");
        // Simple fallback for standard {XXX}
        fmt = fmt.replace(/{XXX}/g, "001");

        return fmt;
    });

    onMount(async () => {
        try {
            const data = await SettingsService.getServiceSettings();
            if (data) {
                // Merge data with defaults to avoid undefined on new fields
                settings = {
                    ...settings,
                    ...data,
                    // Explicit safeguards for new fields if DB returns undefined
                    enableVirtualArchive: data.enableVirtualArchive ?? true,
                    archiveExclusions: data.archiveExclusions ?? ["dikerjakan"],
                    enableLiquidation: data.enableLiquidation ?? false,
                    commissionModel: data.commissionModel ?? "completion",
                };
            }
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat pengaturan service");
        } finally {
            loading = false;
        }
    });

    async function save() {
        saving = true;
        try {
            await SettingsService.setServiceSettings(settings);
            await settingsStore.refresh();
            toast.success("Pengaturan service berhasil disimpan");
        } catch (e) {
            toast.error("Gagal menyimpan pengaturan");
        } finally {
            saving = false;
        }
    }

    function addPreset() {
        if (!newPresetLabel || newPresetDays < 0) return;
        settings.warrantyPresets = [
            ...settings.warrantyPresets,
            { label: newPresetLabel, days: newPresetDays },
        ];
        newPresetLabel = "";
        newPresetDays = 0;
    }

    function removePreset(index: number) {
        settings.warrantyPresets = settings.warrantyPresets.filter(
            (_, i) => i !== index,
        );
    }
</script>

<div class="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm"
    >
        <div class="flex items-center gap-4">
            <div
                class="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl text-white shadow-lg shadow-cyan-500/20"
            >
                <Wrench class="h-8 w-8" />
            </div>
            <div>
                <h1
                    class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400"
                >
                    Konfigurasi Service
                </h1>
                <p class="text-muted-foreground text-sm font-medium">
                    Atur format nomor, garansi, dan alur pengerjaan.
                </p>
            </div>
        </div>
        <div class="flex gap-3">
            <Button
                onclick={save}
                disabled={saving || loading}
                size="lg"
                class="rounded-xl shadow-lg shadow-cyan-500/20 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 transition-all hover:scale-[1.02]"
            >
                {#if saving}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                {:else}
                    <Save class="mr-2 h-4 w-4" />
                    Simpan Perubahan
                {/if}
            </Button>
        </div>
    </div>

    {#if loading}
        <div class="flex justify-center py-20">
            <Loader2 class="h-10 w-10 animate-spin text-cyan-500" />
        </div>
    {:else}
        <div class="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
            <!-- LEFT COLUMN: SETTINGS -->
            <div class="space-y-6">
                <!-- 1. Numbering Format -->
                <div
                    class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20 shadow-sm p-6 space-y-6"
                >
                    <div class="flex items-center gap-3 mb-2">
                        <div class="p-2 bg-cyan-50 text-cyan-600 rounded-lg">
                            <Hash class="h-5 w-5" />
                        </div>
                        <div>
                            <h3 class="font-bold text-lg">Format Penomoran</h3>
                            <p class="text-xs text-muted-foreground">
                                Pola untuk No. Service otomatis.
                            </p>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="space-y-2">
                            <Label>Pola Format</Label>
                            <Input
                                bind:value={settings.numberFormat}
                                placeholder="SRV-{'{'}YYYY{'}'}-{'{'}XXX{'}'}"
                                class="font-mono bg-white/50"
                            />
                            <div
                                class="flex gap-2 text-[10px] text-muted-foreground mt-1"
                            >
                                <span
                                    class="bg-slate-100 px-1.5 py-0.5 rounded cursor-help"
                                    title="Tahun 4 digit">{"{"}YYYY{"}"}</span
                                >
                                <span
                                    class="bg-slate-100 px-1.5 py-0.5 rounded cursor-help"
                                    title="Tahun 2 digit">{"{"}YY{"}"}</span
                                >
                                <span
                                    class="bg-slate-100 px-1.5 py-0.5 rounded cursor-help"
                                    title="Bulan">{"{"}MM{"}"}</span
                                >
                                <span
                                    class="bg-slate-100 px-1.5 py-0.5 rounded cursor-help"
                                    title="Counter Urut">{"{"}XXX{"}"}</span
                                >
                            </div>
                        </div>

                        <div
                            class="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-slate-100"
                        >
                            <div>
                                <Label
                                    class="cursor-pointer"
                                    for="reset-counter"
                                    >Reset Counter Tahunan</Label
                                >
                                <p class="text-[10px] text-muted-foreground">
                                    Nomor urut kembali ke 001 setiap awal tahun.
                                </p>
                            </div>
                            <Switch
                                id="reset-counter"
                                bind:checked={settings.resetCounterYearly}
                            />
                        </div>
                    </div>
                </div>

                <!-- 2. Workflow & Automation -->
                <div
                    class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20 shadow-sm p-6 space-y-6"
                >
                    <div class="flex items-center gap-3 mb-2">
                        <div class="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <Workflow class="h-5 w-5" />
                        </div>
                        <h3 class="font-bold text-lg">Alur & Otomatisasi</h3>
                    </div>

                    <div class="grid sm:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <Label>Status Awal</Label>
                            <Select
                                type="single"
                                bind:value={settings.defaultStatus}
                            >
                                <SelectTrigger class="bg-white/50">
                                    {settings.defaultStatus === "antrian"
                                        ? "Masuk Antrian"
                                        : settings.defaultStatus}
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="antrian"
                                        >Masuk Antrian</SelectItem
                                    >
                                    <SelectItem value="dicek"
                                        >Sedang Dicek</SelectItem
                                    >
                                    <SelectItem value="dikerjakan"
                                        >Langsung Dikerjakan</SelectItem
                                    >
                                </SelectContent>
                            </Select>
                        </div>
                        <div class="space-y-2">
                            <Label>Model Komisi</Label>
                            <Select
                                type="single"
                                bind:value={settings.commissionModel}
                            >
                                <SelectTrigger class="bg-white/50">
                                    {settings.commissionModel === "completion"
                                        ? "Berdasarkan Selesai"
                                        : "Berdasarkan Diambil"}
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="completion"
                                        >Berdasarkan Selesai (Owner Risk)</SelectItem
                                    >
                                    <SelectItem value="collection"
                                        >Berdasarkan Diambil (Tech Risk)</SelectItem
                                    >
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div class="grid sm:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <Label>Auto Close (Hari)</Label>
                            <div class="relative">
                                <Input
                                    type="number"
                                    bind:value={settings.autoCloseAfterDays}
                                    class="pl-3 pr-12 bg-white/50"
                                    min={0}
                                />
                                <div
                                    class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
                                >
                                    Hari
                                </div>
                            </div>
                        </div>
                        <div class="flex items-end pb-1">
                            <div
                                class="flex items-center justify-between w-full p-3 bg-white/50 rounded-xl border border-slate-100 h-10"
                            >
                                <Label
                                    class="cursor-pointer text-xs"
                                    for="reminder">Ingatkan Pickup</Label
                                >
                                <Switch
                                    id="reminder"
                                    bind:checked={settings.reminderBeforePickup}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 3. Warranty Config -->
                <div
                    class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20 shadow-sm p-6 space-y-6"
                >
                    <div class="flex items-center gap-3 mb-2">
                        <div
                            class="p-2 bg-emerald-50 text-emerald-600 rounded-lg"
                        >
                            <ShieldCheck class="h-5 w-5" />
                        </div>
                        <h3 class="font-bold text-lg">Garansi & Komplain</h3>
                    </div>

                    <div class="grid sm:grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <Label>Durasi Garansi Default</Label>
                            <div class="relative">
                                <ShieldCheck
                                    class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500"
                                />
                                <Input
                                    type="number"
                                    bind:value={settings.defaultWarrantyDays}
                                    class="pl-10 pr-12 bg-white/50"
                                    min={0}
                                />
                                <div
                                    class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
                                >
                                    Hari
                                </div>
                            </div>
                            <p class="text-[10px] text-muted-foreground">
                                Applied saat service ditandai selesai.
                            </p>
                        </div>
                        <div class="space-y-2">
                            <Label>Tenggang Komplain</Label>
                            <div class="relative">
                                <Clock
                                    class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500"
                                />
                                <Input
                                    type="number"
                                    bind:value={settings.gracePeriodDays}
                                    class="pl-10 pr-12 bg-white/50"
                                    min={0}
                                />
                                <div
                                    class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
                                >
                                    Hari
                                </div>
                            </div>
                            <p class="text-[10px] text-muted-foreground">
                                Waktu toleransi sebelum garansi aktif.
                            </p>
                        </div>
                    </div>

                    <Separator class="opacity-30" />

                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <Label
                                class="text-sm font-bold uppercase tracking-wider text-muted-foreground"
                                >Preset Garansi Cepat</Label
                            >
                            <span
                                class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold"
                                >Shortcut Wizard</span
                            >
                        </div>

                        <div class="grid gap-3">
                            {#if settings.warrantyPresets.length === 0}
                                <div
                                    class="text-center py-6 border-2 border-dashed rounded-2xl bg-slate-50/50 dark:bg-slate-800/50"
                                >
                                    <p class="text-xs text-muted-foreground">
                                        Belum ada preset. Tambahkan untuk
                                        mempercepat input service.
                                    </p>
                                </div>
                            {/if}

                            {#each settings.warrantyPresets as preset, i}
                                <div
                                    class="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-slate-100 group/preset hover:border-emerald-200 transition-colors"
                                >
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs"
                                        >
                                            {preset.days}d
                                        </div>
                                        <span class="font-medium text-sm"
                                            >{preset.label}</span
                                        >
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        class="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover/preset:opacity-100 transition-all"
                                        onclick={() => removePreset(i)}
                                    >
                                        <Trash2 class="h-4 w-4" />
                                    </Button>
                                </div>
                            {/each}

                            <!-- Add New Preset Input -->
                            <div
                                class="grid grid-cols-[1fr_80px_auto] gap-2 mt-2"
                            >
                                <Input
                                    placeholder="Nama Preset (Misal: LCD 3bln)"
                                    bind:value={newPresetLabel}
                                    class="bg-white/50 h-10 text-sm"
                                />
                                <div class="relative">
                                    <Input
                                        type="number"
                                        placeholder="Hari"
                                        bind:value={newPresetDays}
                                        class="bg-white/50 h-10 text-sm pr-1"
                                        min={0}
                                    />
                                </div>
                                <Button
                                    onclick={addPreset}
                                    disabled={!newPresetLabel}
                                    class="h-10 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                                >
                                    <Plus class="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 4. Virtual Archive & Liquidation -->
                <div
                    class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20 shadow-sm p-6 space-y-6"
                >
                    <div class="flex items-center gap-3 mb-2">
                        <div
                            class="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg"
                        >
                            <Archive class="h-5 w-5" />
                        </div>
                        <h3 class="font-bold text-lg">Arsip & Likuidasi</h3>
                    </div>

                    <div class="space-y-4">
                        <div
                            class="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-slate-100"
                        >
                            <div>
                                <Label
                                    class="cursor-pointer"
                                    for="enable-archive"
                                    >Aktifkan Arsip Virtual</Label
                                >
                                <p class="text-[10px] text-muted-foreground">
                                    Sembunyikan otomatis service lama dari list
                                    aktif.
                                </p>
                            </div>
                            <Switch
                                id="enable-archive"
                                bind:checked={settings.enableVirtualArchive}
                            />
                        </div>

                        {#if settings.enableVirtualArchive}
                            <div
                                class="p-4 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-4 animate-in slide-in-from-top-2 duration-300"
                            >
                                <div class="space-y-2">
                                    <Label>Pengecualian Status</Label>
                                    <div class="flex flex-wrap gap-2">
                                        {#each ["dicek", "menunggu_sparepart", "konfirmasi", "dikerjakan", "re-konfirmasi"] as status}
                                            <button
                                                type="button"
                                                class={cn(
                                                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                                                    settings.archiveExclusions.includes(
                                                        status,
                                                    )
                                                        ? "bg-slate-800 dark:bg-cyan-600 text-white border-slate-800 dark:border-cyan-600 shadow-sm"
                                                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300",
                                                )}
                                                onclick={() => {
                                                    if (
                                                        settings.archiveExclusions.includes(
                                                            status,
                                                        )
                                                    ) {
                                                        settings.archiveExclusions =
                                                            settings.archiveExclusions.filter(
                                                                (s) =>
                                                                    s !==
                                                                    status,
                                                            );
                                                    } else {
                                                        settings.archiveExclusions =
                                                            [
                                                                ...settings.archiveExclusions,
                                                                status,
                                                            ];
                                                    }
                                                }}
                                            >
                                                {status
                                                    .replace("_", " ")
                                                    .toUpperCase()}
                                            </button>
                                        {/each}
                                    </div>
                                    <p
                                        class="text-[10px] text-muted-foreground italic"
                                    >
                                        Pilih status yang TIDAK BOLEH diarsipkan
                                        otomatis meskipun sudah lama.
                                    </p>
                                </div>
                            </div>
                        {/if}

                        <Separator class="opacity-30" />

                        <div
                            class="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20"
                        >
                            <div class="flex gap-3">
                                <div
                                    class="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-lg shrink-0"
                                >
                                    <ShieldAlert class="h-5 w-5" />
                                </div>
                                <div>
                                    <Label
                                        class="cursor-pointer text-amber-900 dark:text-amber-300"
                                        for="enable-liquidation"
                                        >Otoritas Likuidasi</Label
                                    >
                                    <p
                                        class="text-[10px] text-amber-700/80 dark:text-amber-400/60"
                                    >
                                        Izinkan kanibal/jual barang yang sudah
                                        diarsip > 60 hari.
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="enable-liquidation"
                                bind:checked={settings.enableLiquidation}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN: PREVIEW & INFO -->
            <div class="lg:sticky lg:top-8 space-y-6">
                <!-- Format Preview Card -->
                <div
                    class="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden"
                >
                    <div
                        class="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
                    ></div>

                    <h4 class="font-bold text-lg mb-4 flex items-center gap-2">
                        <Hash class="h-5 w-5 text-cyan-400" /> Preview ID
                    </h4>

                    <div
                        class="bg-black/30 rounded-xl p-4 text-center border border-white/10 mb-4"
                    >
                        <div class="text-xs text-slate-400 mb-1">
                            HASIL GENERATE HARI INI
                        </div>
                        <div
                            class="text-3xl font-mono font-black tracking-wider text-cyan-400 animate-pulse duration-1000"
                            style:animation-duration="3s"
                        >
                            {previewNumber}
                        </div>
                    </div>

                    <p class="text-xs text-slate-400 leading-relaxed">
                        Format ini akan digunakan untuk semua faktur baru.
                        Pastikan format unik untuk menghindari duplikasi data.
                    </p>
                </div>

                <!-- Workflow Timeline Visualizer -->
                <div
                    class="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-sm"
                >
                    <h4 class="font-bold text-lg mb-4 flex items-center gap-2">
                        <CalendarClock class="h-5 w-5 text-emerald-600" /> Timeline
                        Lifecycle
                    </h4>

                    <div class="space-y-6 relative pl-2">
                        <!-- Vertical Line -->
                        <div
                            class="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-700"
                        ></div>

                        <!-- Step 1 -->
                        <div class="relative flex gap-4">
                            <div
                                class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold z-10 shrink-0 border-4 border-white dark:border-slate-800"
                            >
                                1
                            </div>
                            <div>
                                <h5 class="font-bold text-sm">
                                    Penerimaan & Pengerjaan
                                </h5>
                                <p
                                    class="text-xs text-muted-foreground leading-snug"
                                >
                                    Service masuk, status awal: <span
                                        class="font-semibold text-foreground uppercase"
                                        >{settings.defaultStatus}</span
                                    >.
                                </p>
                            </div>
                        </div>

                        <!-- Step 2 -->
                        <div class="relative flex gap-4">
                            <div
                                class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold z-10 shrink-0 border-4 border-white dark:border-slate-800"
                            >
                                2
                            </div>
                            <div>
                                <h5 class="font-bold text-sm">
                                    Selesai & Diambil
                                </h5>
                                <p
                                    class="text-xs text-muted-foreground leading-snug"
                                >
                                    Unit diambil customer. Garansi belum aktif
                                    selama <span
                                        class="font-semibold text-emerald-600"
                                        >{settings.gracePeriodDays} Hari</span
                                    > (Grace Period).
                                </p>
                            </div>
                        </div>

                        <!-- Step 3 -->
                        <div class="relative flex gap-4">
                            <div
                                class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold z-10 shrink-0 border-4 border-white dark:border-slate-800"
                            >
                                3
                            </div>
                            <div>
                                <h5 class="font-bold text-sm">
                                    Masa Garansi Aktif
                                </h5>
                                <p
                                    class="text-xs text-muted-foreground leading-snug"
                                >
                                    Proteksi aktif selama <span
                                        class="font-semibold text-indigo-600"
                                        >{settings.defaultWarrantyDays} Hari</span
                                    > ke depan.
                                </p>
                            </div>
                        </div>

                        <!-- Step 4 -->
                        <div class="relative flex gap-4">
                            <div
                                class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold z-10 shrink-0 border-4 border-white dark:border-slate-800"
                            >
                                4
                            </div>
                            <div>
                                <h5 class="font-bold text-sm">
                                    Auto Close (Arsip)
                                </h5>
                                <p
                                    class="text-xs text-muted-foreground leading-snug"
                                >
                                    Jika tidak ada aktivitas selama <span
                                        class="font-semibold"
                                        >{settings.autoCloseAfterDays} Hari</span
                                    >, tiket ditutup permanen.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>
