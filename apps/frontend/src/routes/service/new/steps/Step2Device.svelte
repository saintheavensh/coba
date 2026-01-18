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
    import { createQuery } from "@tanstack/svelte-query";
    import Combobox from "$lib/components/ui/combobox.svelte";
    import {
        CheckCircle,
        Smartphone,
        Grid3X3,
        Camera,
        X,
        Upload,
        AlertCircle,
    } from "lucide-svelte";
    import { cn } from "$lib/utils";
    import { toast } from "svelte-sonner";

    let { form }: { form: ServiceFormStore } = $props();

    const devicesQuery = createQuery(() => ({
        queryKey: ["devices"],
        queryFn: () => InventoryService.getDevices(),
    }));

    import {
        DEFAULT_BRANDS,
        DEVICE_STATUS_OPTIONS,
        PHYSICAL_CONDITIONS,
        COMPLETENESS_OPTIONS,
    } from "@repo/shared";

    // ... (Imports stay same, removed local consts) ...

    const isErrorStatus = (status: string) =>
        ["mati_total", "restart", "blank_hitam"].includes(status);

    function handleSavePattern() {
        form.isPatternOpen = false;
    }
</script>

<div class="grid gap-6 animate-in slide-in-from-right-4 duration-500">
    <div class="space-y-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
            <Smartphone class="h-5 w-5 text-primary" />
            Data Perangkat
        </h3>
        <p class="text-sm text-muted-foreground">
            Detail spesifikasi dan kondisi fisik perangkat yang akan diservis.
        </p>
    </div>

    <div class="space-y-6">
        <!-- Main Device Info -->
        <div
            class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-xl bg-card/50 shadow-sm"
        >
            <div class="space-y-2">
                <Label>Merk/Brand <span class="text-red-500">*</span></Label>
                <Select type="single" bind:value={form.phoneBrand}>
                    <SelectTrigger
                        >{form.phoneBrand || "Pilih Brand"}</SelectTrigger
                    >
                    <SelectContent>
                        {#each DEFAULT_BRANDS as brand}
                            <SelectItem value={brand}>{brand}</SelectItem>
                        {/each}
                    </SelectContent>
                </Select>
            </div>
            <div class="space-y-2 flex flex-col">
                <Label for="model"
                    >Model/Tipe <span class="text-red-500">*</span></Label
                >
                <div class="flex gap-2">
                    <Input
                        id="model"
                        bind:value={form.phoneModel}
                        placeholder="Contoh: Galaxy S24 Ultra"
                        class="flex-1"
                    />

                    <Combobox
                        items={devicesQuery.data || []}
                        bind:value={form.selectedDeviceId}
                        valueKey="id"
                        labelKey={(item) => `${item.brand} ${item.model}`}
                        filterKey={(item) =>
                            `${item.brand} ${item.model} ${item.code || ""}`}
                        placeholder="Cari..."
                        searchPlaceholder="Cari model device..."
                        onSelect={(item) => {
                            form.phoneBrand = item.brand;
                            form.phoneModel = item.model;
                            toast.success(
                                `Device dipilih: ${item.brand} ${item.model}`,
                            );
                        }}
                    >
                        {#snippet itemSnippet(item)}
                            <div class="flex flex-col text-left">
                                <span>{item.brand} {item.model}</span>
                                <span class="text-xs text-muted-foreground"
                                    >{item.code || "-"}</span
                                >
                            </div>
                        {/snippet}
                    </Combobox>
                </div>
                {#if form.selectedDeviceId}
                    <p class="text-xs text-green-600 flex items-center">
                        <CheckCircle class="h-3 w-3 mr-1" /> Terhubung dengan database
                        <Button
                            variant="link"
                            class="h-auto p-0 ml-2 text-xs text-muted-foreground"
                            onclick={() => (form.selectedDeviceId = null)}
                            >(Reset)</Button
                        >
                    </p>
                {/if}
            </div>
        </div>

        <!-- Status Selection -->
        <div class="space-y-3">
            <Label>Status Awal Handphone</Label>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                {#each DEVICE_STATUS_OPTIONS as option}
                    <label
                        class={`
                        cursor-pointer relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                        ${form.phoneStatus === option.value ? `${option.border} ${option.bg}` : "border-border hover:bg-muted"}
                    `}
                    >
                        <input
                            type="radio"
                            bind:group={form.phoneStatus}
                            value={option.value}
                            class="sr-only"
                        />
                        <Smartphone class={`h-6 w-6 ${option.color}`} />
                        <span class="text-sm font-medium text-center"
                            >{option.label}</span
                        >
                        {#if form.phoneStatus === option.value}
                            <div
                                class="absolute top-2 right-2 w-2 h-2 rounded-full bg-current text-primary"
                            ></div>
                        {/if}
                    </label>
                {/each}
            </div>
        </div>

        <!-- Security & Identity -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
                <Label for="imei">IMEI (15 digit)</Label>
                <Input
                    id="imei"
                    bind:value={form.imei}
                    placeholder={isErrorStatus(form.phoneStatus)
                        ? "Dikunci (Status Error)"
                        : "354217123456789"}
                    maxlength={15}
                    disabled={isErrorStatus(form.phoneStatus)}
                    class="font-mono"
                />
            </div>
            <div class="space-y-2">
                <Label for="pin">PIN / Pola Unlock</Label>
                <div class="flex gap-2">
                    <Input
                        id="pin"
                        bind:value={form.pinPattern}
                        placeholder={isErrorStatus(form.phoneStatus)
                            ? "Dikunci (Status Error)"
                            : "1234 atau klik icon grid"}
                        class="flex-1 font-mono"
                        disabled={isErrorStatus(form.phoneStatus)}
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        title="Input Pola"
                        disabled={isErrorStatus(form.phoneStatus)}
                        onclick={() => (form.isPatternOpen = true)}
                    >
                        <Grid3X3 class="h-4 w-4" />
                    </Button>
                </div>
                {#if isErrorStatus(form.phoneStatus)}
                    <p class="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle class="h-3 w-3" /> IMEI & PIN tidak wajib untuk
                        HP mati/error
                    </p>
                {/if}
            </div>
        </div>

        <Separator />

        <!-- Condition & Completeness -->
        <div class="grid md:grid-cols-2 gap-6">
            <div class="space-y-3">
                <Label class="text-base">Kondisi Fisik</Label>
                <div class="grid grid-cols-2 gap-2">
                    {#each PHYSICAL_CONDITIONS as item}
                        <label
                            class="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                        >
                            <input
                                type="checkbox"
                                bind:group={form.physicalConditions}
                                value={item.v}
                                class="rounded border-primary text-primary focus:ring-primary"
                            />
                            <span class="text-sm">{item.l}</span>
                        </label>
                    {/each}
                </div>
            </div>
            <div class="space-y-3">
                <Label class="text-base">Kelengkapan Unit</Label>
                <div class="grid grid-cols-2 gap-2">
                    {#each COMPLETENESS_OPTIONS as item}
                        <label
                            class="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                        >
                            <input
                                type="checkbox"
                                bind:group={form.completeness}
                                value={item.v}
                                class="rounded border-primary text-primary focus:ring-primary"
                            />
                            <span class="text-sm">{item.l}</span>
                        </label>
                    {/each}
                </div>
            </div>
        </div>

        <div class="space-y-2">
            <Label for="notes">Catatan Kondisi Fisik Lainnya</Label>
            <Input
                id="notes"
                bind:value={form.physicalNotes}
                placeholder="Contoh: Lecet di sudut kiri atas, tombol volume agak keras"
            />
        </div>

        <!-- Photos -->
        <div class="space-y-3 p-4 border rounded-xl bg-card/50 border-dashed">
            <Label class="flex items-center gap-2 text-base">
                <Camera class="h-5 w-5" /> Foto Perangkat
            </Label>

            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {#each form.photos as photo, index}
                    <div class="relative group aspect-square">
                        <img
                            src={`${API_URL}${photo}`}
                            alt="Preview"
                            class="w-full h-full object-cover rounded-lg border shadow-sm"
                        />
                        <button
                            type="button"
                            onclick={() => form.removePhoto(index)}
                            class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                        >
                            <X class="h-3 w-3" />
                        </button>
                    </div>
                {/each}

                <label
                    class="aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all group"
                >
                    <Upload
                        class="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors"
                    />
                    <span
                        class="text-xs text-muted-foreground mt-2 group-hover:text-primary transition-colors"
                    >
                        {form.isUploading ? "Uploading..." : "Upload Foto"}
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
            <p class="text-xs text-muted-foreground">
                Mendukung format JPG, PNG. Maksimal 5MB per file.
            </p>
        </div>
    </div>
</div>

<!-- Pattern Lock Dialog -->
<Dialog bind:open={form.isPatternOpen}>
    <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
            <DialogTitle>Input Pola Kunci</DialogTitle>
            <DialogDescription
                >Gambar pola kunci handphone untuk membuka layar.</DialogDescription
            >
        </DialogHeader>
        <div
            class="flex flex-col items-center justify-center py-6 bg-muted/20 rounded-xl"
        >
            <PatternLock
                size={280}
                on:change={(e) => form.handlePatternChange(e.detail)}
                bind:value={form.patternPoints}
            />
            <p
                class="text-center mt-4 font-mono tracking-widest text-lg font-bold text-primary"
            >
                {form.patternString || "Gambarkan Pola"}
            </p>
        </div>
        <DialogFooter class="flex gap-2 sm:gap-0">
            <Button
                variant="outline"
                onclick={() => {
                    form.patternPoints = [];
                    form.pinPattern = "";
                }}>Reset</Button
            >
            <Button onclick={handleSavePattern}>Simpan Pola</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
