<script lang="ts">
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
    import { Badge } from "$lib/components/ui/badge";
    import { Separator } from "$lib/components/ui/separator";
    import {
        CheckCircle,
        XCircle,
        ArrowRight,
        AlertCircle,
        ClipboardCheck,
    } from "lucide-svelte";
    import { ServiceFormStore } from "../form.svelte";

    let { form }: { form: ServiceFormStore } = $props();

    const qcItems = ServiceFormStore.QC_ITEMS;

    function setQCValue(key: string, value: boolean) {
        form.qcAfter = { ...form.qcAfter, [key]: value };
    }

    function getComparison(
        key: string,
    ): "improved" | "same" | "degraded" | "na" {
        if (!form.canDoInitialQC) return "na";
        const before = form.initialQC[key];
        const after = form.qcAfter[key];
        if (before === undefined || after === undefined) return "na";
        if (!before && after) return "improved";
        if (before && !after) return "degraded";
        return "same";
    }
</script>

<div class="grid gap-6 animate-in slide-in-from-right-4 duration-500">
    <div class="space-y-4">
        <h3
            class="text-xl font-bold flex items-center gap-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
        >
            <ClipboardCheck class="h-6 w-6 text-primary" />
            Quality Control
        </h3>
        <p class="text-sm text-muted-foreground">
            {#if form.canDoInitialQC}
                Bandingkan kondisi sebelum dan sesudah perbaikan.
            {:else}
                <span
                    class="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-full w-fit"
                >
                    <AlertCircle class="h-4 w-4" />
                    Kondisi awal tidak dapat direkam (HP mati/error).
                </span>
            {/if}
        </p>
    </div>

    <!-- QC Checklist Grid -->
    <div
        class="rounded-3xl border border-muted/60 bg-card/50 shadow-sm overflow-hidden relative group"
    >
        <!-- Glow Effect -->
        <div
            class="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 transition-opacity opacity-0 group-hover:opacity-100"
        ></div>
        <div class="bg-muted/50 p-3 border-b">
            <!-- Headers adapt to mode -->
            {#if form.currentStep === 3}
                <div
                    class="grid grid-cols-[1fr_80px_80px] gap-2 text-xs font-medium text-muted-foreground"
                >
                    <span>Fungsi</span>
                    <span class="text-center">Kondisi</span>
                    <span class="text-center">Status</span>
                </div>
            {:else}
                <div
                    class="grid grid-cols-[1fr_80px_80px_80px] gap-2 text-xs font-medium text-muted-foreground"
                >
                    <span>Fungsi</span>
                    {#if form.canDoInitialQC}<span class="text-center"
                            >Sebelum</span
                        >{/if}
                    <span class="text-center">Sesudah</span>
                    <span class="text-center">Hasil</span>
                </div>
            {/if}
        </div>

        <div class="divide-y">
            {#each qcItems as item}
                <div
                    class="grid gap-2 p-3 items-center hover:bg-muted/30 transition-colors
                    {form.currentStep === 3
                        ? 'grid-cols-[1fr_80px_80px]'
                        : 'grid-cols-[1fr_80px_80px_80px]'}"
                >
                    <span class="text-sm font-medium">{item.label}</span>

                    {#if form.currentStep === 3}
                        <!-- INTAKE MODE: Edit Initial QC -->
                        <div class="flex justify-center gap-1">
                            <button
                                type="button"
                                class={`p-1 rounded-md transition-colors ${form.initialQC[item.key] === true ? "bg-green-100 text-green-600 ring-2 ring-green-500/20" : "hover:bg-muted text-muted-foreground"}`}
                                onclick={() =>
                                    (form.initialQC = {
                                        ...form.initialQC,
                                        [item.key]: true,
                                    })}
                                title="Berfungsi Baik"
                            >
                                <CheckCircle class="h-6 w-6" />
                            </button>
                            <button
                                type="button"
                                class={`p-1 rounded-md transition-colors ${form.initialQC[item.key] === false ? "bg-red-100 text-red-600 ring-2 ring-red-500/20" : "hover:bg-muted text-muted-foreground"}`}
                                onclick={() =>
                                    (form.initialQC = {
                                        ...form.initialQC,
                                        [item.key]: false,
                                    })}
                                title="Rusak / Bermasalah"
                            >
                                <XCircle class="h-6 w-6" />
                            </button>
                        </div>

                        <!-- Status Label -->
                        <div class="flex justify-center">
                            {#if form.initialQC[item.key] === true}
                                <span
                                    class="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full"
                                    >OK</span
                                >
                            {:else if form.initialQC[item.key] === false}
                                <span
                                    class="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full"
                                    >Rusak</span
                                >
                            {:else}
                                <span class="text-xs text-muted-foreground"
                                    >-</span
                                >
                            {/if}
                        </div>
                    {:else}
                        <!-- REVIEW/WALKIN MODE: Compare Before/After -->
                        <!-- ... Existing Logic for Review Mode ... -->
                        {#if form.canDoInitialQC}
                            <div class="flex justify-center">
                                {#if form.initialQC[item.key] === true}
                                    <CheckCircle
                                        class="h-5 w-5 text-green-500"
                                    />
                                {:else if form.initialQC[item.key] === false}
                                    <XCircle class="h-5 w-5 text-red-500" />
                                {:else}
                                    <span class="text-xs text-muted-foreground"
                                        >-</span
                                    >
                                {/if}
                            </div>
                        {/if}

                        <!-- After (Editable) -->
                        <div class="flex justify-center gap-1">
                            <button
                                type="button"
                                class={`p-1 rounded-md transition-colors ${form.qcAfter[item.key] === true ? "bg-green-100 text-green-600" : "hover:bg-muted"}`}
                                onclick={() => setQCValue(item.key, true)}
                            >
                                <CheckCircle class="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                class={`p-1 rounded-md transition-colors ${form.qcAfter[item.key] === false ? "bg-red-100 text-red-600" : "hover:bg-muted"}`}
                                onclick={() => setQCValue(item.key, false)}
                            >
                                <XCircle class="h-5 w-5" />
                            </button>
                        </div>

                        <!-- Comparison -->
                        {@const comparison = getComparison(item.key)}
                        <div class="flex justify-center">
                            {#if comparison === "improved"}
                                <Badge
                                    variant="outline"
                                    class="bg-green-50 text-green-700 border-green-200 text-[10px]"
                                    >✅ Baik</Badge
                                >
                            {:else if comparison === "degraded"}
                                <Badge
                                    variant="outline"
                                    class="bg-red-50 text-red-700 border-red-200 text-[10px]"
                                    >⚠️ Turun</Badge
                                >
                            {:else if comparison === "same"}
                                <Badge variant="outline" class="text-[10px]"
                                    ><ArrowRight class="h-3 w-3" /></Badge
                                >
                            {:else}
                                <span class="text-xs text-muted-foreground"
                                    >-</span
                                >
                            {/if}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>

    {#if form.currentStep !== 3}
        <!-- Post-Repair Checks (Final QC only) -->
        <div class="rounded-xl border bg-card/50 shadow-sm p-4 space-y-3">
            <Label class="text-base font-medium">Verifikasi Tambahan</Label>
            <div class="grid grid-cols-2 gap-2">
                <label
                    class="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                >
                    <input
                        type="checkbox"
                        bind:checked={form.qcAfter["complaintResolved"]}
                        class="rounded border-primary text-primary focus:ring-primary"
                    />
                    <span class="text-sm">Keluhan teratasi</span>
                </label>
                <label
                    class="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                >
                    <input
                        type="checkbox"
                        bind:checked={form.qcAfter["noNewIssues"]}
                        class="rounded border-primary text-primary focus:ring-primary"
                    />
                    <span class="text-sm">Tidak ada masalah baru</span>
                </label>
                <label
                    class="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                >
                    <input
                        type="checkbox"
                        bind:checked={form.qcAfter["deviceCleaned"]}
                        class="rounded border-primary text-primary focus:ring-primary"
                    />
                    <span class="text-sm">Perangkat dibersihkan</span>
                </label>
                <label
                    class="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                >
                    <input
                        type="checkbox"
                        bind:checked={form.qcAfter["allSecured"]}
                        class="rounded border-primary text-primary focus:ring-primary"
                    />
                    <span class="text-sm">Komponen terpasang baik</span>
                </label>
            </div>
        </div>

        <!-- QC Notes -->
        <div class="space-y-3">
            <Label for="qc-notes" class="text-sm font-semibold"
                >Catatan QC (Opsional)</Label
            >
            <Textarea
                id="qc-notes"
                bind:value={form.qcNotes}
                placeholder="Catatan tambahan hasil quality control..."
                rows={2}
                class="rounded-xl bg-background/50 border-muted-foreground/20 focus:bg-background transition-colors"
            />
        </div>

        <!-- QC Status Summary -->
        <div
            class={`p-4 rounded-xl border-2 flex items-center gap-3 ${form.qcPassed ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}
        >
            {#if form.qcPassed}
                <CheckCircle class="h-8 w-8 text-green-600" />
                <div>
                    <p class="font-bold text-green-800">QC PASS</p>
                    <p class="text-sm text-green-600">
                        Semua item terverifikasi OK
                    </p>
                </div>
            {:else}
                <AlertCircle class="h-8 w-8 text-amber-600" />
                <div>
                    <p class="font-bold text-amber-800">QC Belum Lengkap</p>
                    <p class="text-sm text-amber-600">
                        Lengkapi checklist untuk melanjutkan
                    </p>
                </div>
            {/if}
        </div>
    {/if}
</div>
