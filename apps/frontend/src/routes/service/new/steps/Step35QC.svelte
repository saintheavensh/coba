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
        <h3 class="text-lg font-semibold flex items-center gap-2">
            <ClipboardCheck class="h-5 w-5 text-primary" />
            Quality Control
        </h3>
        <p class="text-sm text-muted-foreground">
            {#if form.canDoInitialQC}
                Bandingkan kondisi sebelum dan sesudah perbaikan.
            {:else}
                <span class="flex items-center gap-1.5 text-amber-600">
                    <AlertCircle class="h-4 w-4" />
                    Kondisi awal tidak dapat direkam (HP mati/error). Verifikasi
                    hasil perbaikan saja.
                </span>
            {/if}
        </p>
    </div>

    <!-- QC Checklist Grid -->
    <div class="rounded-xl border bg-card/50 shadow-sm overflow-hidden">
        <div class="bg-muted/50 p-3 border-b">
            <div
                class="grid grid-cols-[1fr_80px_80px_80px] gap-2 text-xs font-medium text-muted-foreground"
            >
                <span>Fungsi</span>
                {#if form.canDoInitialQC}
                    <span class="text-center">Sebelum</span>
                {/if}
                <span class="text-center">Sesudah</span>
                {#if form.canDoInitialQC}
                    <span class="text-center">Status</span>
                {/if}
            </div>
        </div>

        <div class="divide-y">
            {#each qcItems as item}
                {@const comparison = getComparison(item.key)}
                <div
                    class="grid grid-cols-[1fr_80px_80px_80px] gap-2 p-3 items-center hover:bg-muted/30 transition-colors"
                >
                    <span class="text-sm font-medium">{item.label}</span>

                    {#if form.canDoInitialQC}
                        <!-- Before (read-only from initial QC) -->
                        <div class="flex justify-center">
                            {#if form.initialQC[item.key] === true}
                                <CheckCircle class="h-5 w-5 text-green-500" />
                            {:else if form.initialQC[item.key] === false}
                                <XCircle class="h-5 w-5 text-red-500" />
                            {:else}
                                <span class="text-xs text-muted-foreground"
                                    >-</span
                                >
                            {/if}
                        </div>
                    {/if}

                    <!-- After (editable) -->
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

                    {#if form.canDoInitialQC}
                        <!-- Comparison Status -->
                        <div class="flex justify-center">
                            {#if comparison === "improved"}
                                <Badge
                                    variant="outline"
                                    class="bg-green-50 text-green-700 border-green-200 text-[10px]"
                                >
                                    ✅ Baik
                                </Badge>
                            {:else if comparison === "degraded"}
                                <Badge
                                    variant="outline"
                                    class="bg-red-50 text-red-700 border-red-200 text-[10px]"
                                >
                                    ⚠️ Turun
                                </Badge>
                            {:else if comparison === "same"}
                                <Badge variant="outline" class="text-[10px]">
                                    <ArrowRight class="h-3 w-3" />
                                </Badge>
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

    <!-- Post-Repair Checks -->
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
    <div class="space-y-2">
        <Label for="qc-notes">Catatan QC (Opsional)</Label>
        <Textarea
            id="qc-notes"
            bind:value={form.qcNotes}
            placeholder="Catatan tambahan hasil quality control..."
            rows={2}
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
</div>
