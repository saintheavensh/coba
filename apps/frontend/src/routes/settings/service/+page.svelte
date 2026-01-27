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
    import { Loader2, Save, Wrench, Plus, Trash2 } from "lucide-svelte";
    import { onMount } from "svelte";
    import {
        SettingsService,
        type ServiceSettings,
    } from "$lib/services/settings.service";
    import { settingsStore } from "$lib/stores/settings-store.svelte";

    let settings = $state<ServiceSettings>({
        numberFormat: "SRV-{YYYY}-{XXX}",
        resetCounterYearly: true,
        defaultStatus: "antrian",
        autoNotifyOnStatusChange: false,
        warrantyPresets: [],
        defaultWarrantyDays: 7,
        gracePeriodDays: 3,
        autoCloseAfterDays: 30,
        reminderBeforePickup: true,
        reminderDays: 7,
    });

    let newPresetLabel = $state("");
    let newPresetDays = $state(0);

    let loading = $state(true);
    let saving = $state(false);

    onMount(async () => {
        try {
            const data = await SettingsService.getServiceSettings();
            if (data) settings = data;
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

<div class="space-y-6 max-w-4xl mx-auto py-6">
    <div>
        <h3 class="text-2xl font-bold tracking-tight">Pengaturan Service</h3>
        <p class="text-muted-foreground">
            Konfigurasi alur kerja service, garansi, dan penomoran nota.
        </p>
    </div>

    <Card>
        <CardHeader>
            <CardTitle>Format & Penomoran</CardTitle>
            <CardDescription
                >Format nomor service yang akan digenerate otomatis.</CardDescription
            >
        </CardHeader>
        <CardContent class="grid gap-6 md:grid-cols-2">
            <div class="space-y-2">
                <Label>Format Nomor Service</Label>
                <Input
                    bind:value={settings.numberFormat}
                    placeholder="SRV-{'{'}YYYY{'}'}-{'{'}XXX{'}'}"
                />
                <p class="text-xs text-muted-foreground">
                    Gunakan <code>&#123;YYYY&#125;</code> untuk tahun,
                    <code>&#123;MM&#125;</code>
                    untuk bulan, <code>&#123;XXX&#125;</code> untuk urutan.
                </p>
            </div>
            <div
                class="flex items-center justify-between p-3 border rounded-lg h-fit self-end"
            >
                <div>
                    <Label>Reset Counter Tiap Tahun</Label>
                    <p class="text-xs text-muted-foreground">
                        Nomor urut kembali ke 001 di tahun baru
                    </p>
                </div>
                <Switch bind:checked={settings.resetCounterYearly} />
            </div>
        </CardContent>
    </Card>

    <Card>
        <CardHeader>
            <CardTitle>Garansi Default</CardTitle>
            <CardDescription
                >Kelola pilihan garansi yang tersedia saat membuat service.</CardDescription
            >
        </CardHeader>
        <CardContent class="space-y-6">
            <div class="grid gap-4 md:grid-cols-3">
                <div class="space-y-2">
                    <Label>Default Garansi (Hari)</Label>
                    <Input
                        type="number"
                        bind:value={settings.defaultWarrantyDays}
                        min={0}
                    />
                </div>
                <div class="space-y-2">
                    <Label>Tenggang Waktu Komplain (Hari)</Label>
                    <Input
                        type="number"
                        bind:value={settings.gracePeriodDays}
                        min={0}
                    />
                </div>
                <div class="space-y-2">
                    <Label>Auto Close (Hari)</Label>
                    <Input
                        type="number"
                        bind:value={settings.autoCloseAfterDays}
                        min={0}
                    />
                    <p class="text-xs text-muted-foreground">
                        Service selesai otomatis ditutup jika tidak diambil.
                    </p>
                </div>
            </div>

            <Separator />

            <div class="space-y-2">
                <Label>Preset Garansi</Label>
                <div class="rounded-md border">
                    <div
                        class="grid grid-cols-12 gap-4 p-3 border-b bg-muted/50 font-medium text-sm"
                    >
                        <div class="col-span-8">Label</div>
                        <div class="col-span-2 text-right">Hari</div>
                        <div class="col-span-2"></div>
                    </div>
                    {#if settings.warrantyPresets.length === 0}
                        <div
                            class="p-4 text-center text-sm text-muted-foreground"
                        >
                            Belum ada preset garansi.
                        </div>
                    {/if}
                    {#each settings.warrantyPresets as preset, i}
                        <div
                            class="grid grid-cols-12 gap-4 p-3 items-center border-b last:border-0 hover:bg-muted/30"
                        >
                            <div class="col-span-8">{preset.label}</div>
                            <div class="col-span-2 text-right">
                                {preset.days} Hari
                            </div>
                            <div class="col-span-2 text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="h-8 w-8 text-destructive"
                                    onclick={() => removePreset(i)}
                                >
                                    <Trash2 class="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    {/each}
                    <div
                        class="grid grid-cols-12 gap-4 p-3 bg-muted/10 items-end"
                    >
                        <div class="col-span-8 space-y-1">
                            <Input
                                placeholder="Nama Preset (Misal: Garansi LCD)"
                                bind:value={newPresetLabel}
                            />
                        </div>
                        <div class="col-span-2 space-y-1">
                            <Input
                                type="number"
                                placeholder="Hari"
                                bind:value={newPresetDays}
                                min={0}
                            />
                        </div>
                        <div class="col-span-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                class="w-full"
                                onclick={addPreset}
                                disabled={!newPresetLabel}
                            >
                                <Plus class="mr-2 h-3.5 w-3.5" /> Tambah
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>

    <Card>
        <CardHeader>
            <CardTitle>Workflow & Notifikasi</CardTitle>
            <CardDescription
                >Pengaturan status awal dan notifikasi otomatis.</CardDescription
            >
        </CardHeader>
        <CardContent class="grid gap-6">
            <div class="space-y-2">
                <Label>Status Awal Service Baru</Label>
                <Select type="single" bind:value={settings.defaultStatus}>
                    <SelectTrigger>
                        {settings.defaultStatus === "antrian"
                            ? "Masuk Antrian"
                            : settings.defaultStatus === "dicek"
                              ? "Sedang Dicek"
                              : settings.defaultStatus}
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="antrian">Masuk Antrian</SelectItem>
                        <SelectItem value="dicek">Sedang Dicek</SelectItem>
                        <SelectItem value="menunggu_sparepart"
                            >Menunggu Sparepart</SelectItem
                        >
                    </SelectContent>
                </Select>
            </div>

            <div
                class="flex items-center justify-between p-3 border rounded-lg"
            >
                <div>
                    <Label>Notifikasi Harian Sebelum Pickup</Label>
                    <p class="text-xs text-muted-foreground">
                        Ingatkan customer jika barang belum diambil setelah X
                        hari.
                    </p>
                </div>
                <div class="flex items-center gap-4">
                    {#if settings.reminderBeforePickup}
                        <div class="w-20">
                            <Input
                                type="number"
                                bind:value={settings.reminderDays}
                                min={1}
                                class="text-right"
                            />
                        </div>
                        <span class="text-sm">Hari</span>
                    {/if}
                    <Switch bind:checked={settings.reminderBeforePickup} />
                </div>
            </div>
        </CardContent>
        <CardFooter>
            <Button onclick={save} disabled={saving || loading} class="ml-auto">
                {#if saving}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                {:else}
                    <Save class="mr-2 h-4 w-4" />
                    Simpan Perubahan
                {/if}
            </Button>
        </CardFooter>
    </Card>
</div>
