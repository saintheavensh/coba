<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Card,
        CardContent,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Switch } from "$lib/shared/components/ui/switch";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import { Separator } from "$lib/shared/components/ui/separator";
    import { Plus, MinusCircle, Save, Loader2 } from "lucide-svelte";
    import type { LegacySettingsController } from "../../legacy.controller.svelte";

    let { controller } = $props<{ controller: LegacySettingsController }>();
</script>

<Card>
    <CardHeader>
        <CardTitle>Pengaturan Service</CardTitle>
        <CardDescription>
            Konfigurasi workflow, penomoran, dan garansi service.
        </CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
        <!-- Numbering -->
        <div class="space-y-4">
            <h4 class="font-medium">Penomoran Service</h4>
            <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                    <Label>Format Nomor</Label>
                    <Input
                        bind:value={controller.serviceSettings.numberFormat}
                        placeholder={"SRV-{YYYY}-{XXX}"}
                    />
                    <p class="text-xs text-muted-foreground">
                        Gunakan {"{YYYY}"} untuk tahun, {"{XXX}"} untuk counter
                    </p>
                </div>
                <div
                    class="flex items-center justify-between p-3 border rounded-lg"
                >
                    <div>
                        <Label>Reset Counter Tiap Tahun</Label>
                        <p class="text-xs text-muted-foreground">
                            Counter dimulai dari 001 setiap tahun baru
                        </p>
                    </div>
                    <Switch
                        bind:checked={
                            controller.serviceSettings.resetCounterYearly
                        }
                    />
                </div>
            </div>
        </div>

        <Separator />

        <!-- Workflow -->
        <div class="space-y-4">
            <h4 class="font-medium">Workflow</h4>
            <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                    <Label>Status Default Service Baru</Label>
                    <Select
                        type="single"
                        bind:value={controller.serviceSettings.defaultStatus}
                    >
                        <SelectTrigger>
                            {controller.serviceSettings.defaultStatus ===
                            "antrian"
                                ? "Antrian"
                                : "Proses"}
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="antrian">Antrian</SelectItem>
                            <SelectItem value="proses">Proses</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div
                    class="flex items-center justify-between p-3 border rounded-lg"
                >
                    <div>
                        <Label>Auto-Notify Saat Status Berubah</Label>
                        <p class="text-xs text-muted-foreground">
                            Kirim notifikasi otomatis
                        </p>
                    </div>
                    <Switch
                        bind:checked={
                            controller.serviceSettings.autoNotifyOnStatusChange
                        }
                    />
                </div>
            </div>
        </div>

        <Separator />

        <!-- Warranty Presets -->
        <div class="space-y-4">
            <h4 class="font-medium">Opsi Garansi</h4>
            <div class="border rounded-lg p-4 space-y-4">
                <div class="grid gap-2 md:grid-cols-3">
                    <div class="space-y-1">
                        <Label class="text-xs">Label</Label>
                        <Input
                            bind:value={controller.newPresetLabel}
                            placeholder="Garansi 1 Minggu"
                        />
                    </div>
                    <div class="space-y-1">
                        <Label class="text-xs">Durasi (Hari)</Label>
                        <Input
                            type="number"
                            bind:value={controller.newPresetDays}
                            placeholder="7"
                        />
                    </div>
                    <div class="flex items-end">
                        <Button
                            variant="secondary"
                            onclick={() => controller.addPreset()}
                            class="w-full"
                        >
                            <Plus class="mr-2 h-4 w-4" /> Tambah
                        </Button>
                    </div>
                </div>
                <div class="space-y-2">
                    {#each controller.serviceSettings.warrantyPresets as preset, i}
                        <div
                            class="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                        >
                            <span>{preset.label} ({preset.days} Hari)</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                class="h-6 w-6 text-red-500"
                                onclick={() => controller.removePreset(i)}
                            >
                                <MinusCircle class="h-4 w-4" />
                            </Button>
                        </div>
                    {/each}
                </div>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                    <Label>Garansi Default (Hari)</Label>
                    <Input
                        type="number"
                        bind:value={
                            controller.serviceSettings.defaultWarrantyDays
                        }
                    />
                </div>
                <div class="space-y-2">
                    <Label>Masa Tenggang Klaim (Hari)</Label>
                    <Input
                        type="number"
                        bind:value={controller.serviceSettings.gracePeriodDays}
                    />
                    <p class="text-xs text-muted-foreground">
                        Setelah garansi berakhir
                    </p>
                </div>
            </div>
        </div>

        <Separator />

        <!-- Automation -->
        <div class="space-y-4">
            <h4 class="font-medium">Otomatisasi</h4>
            <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                    <Label>Auto-Close Setelah (Hari)</Label>
                    <Input
                        type="number"
                        bind:value={
                            controller.serviceSettings.autoCloseAfterDays
                        }
                    />
                    <p class="text-xs text-muted-foreground">
                        Tutup otomatis service yang sudah selesai
                    </p>
                </div>
                <div
                    class="flex items-center justify-between p-3 border rounded-lg"
                >
                    <div>
                        <Label>Reminder Pengambilan</Label>
                        <p class="text-xs text-muted-foreground">
                            Ingatkan customer mengambil barang
                        </p>
                    </div>
                    <Switch
                        bind:checked={
                            controller.serviceSettings.reminderBeforePickup
                        }
                    />
                </div>
            </div>
            {#if controller.serviceSettings.reminderBeforePickup}
                <div class="space-y-2 max-w-xs">
                    <Label>Ingatkan Setelah (Hari)</Label>
                    <Input
                        type="number"
                        bind:value={controller.serviceSettings.reminderDays}
                    />
                </div>
            {/if}
        </div>
    </CardContent>
    <CardFooter>
        <Button
            onclick={() => controller.saveServiceSettings()}
            disabled={controller.saving}
        >
            {#if controller.saving}
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            {:else}
                <Save class="mr-2 h-4 w-4" />
            {/if}
            Simpan Pengaturan
        </Button>
    </CardFooter>
</Card>
