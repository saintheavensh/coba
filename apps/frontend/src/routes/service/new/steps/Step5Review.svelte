<script lang="ts">
    import { Badge } from "$lib/components/ui/badge";
    import { Separator } from "$lib/components/ui/separator";
    import { CheckCircle, XCircle, AlertCircle } from "lucide-svelte";
    import type { ServiceFormStore } from "../form.svelte";

    let { form } = $props<{ form: ServiceFormStore }>();
</script>

<div class="space-y-6">
    <div
        class="bg-primary/5 p-4 rounded-xl border border-primary/20 flex items-center gap-3"
    >
        <AlertCircle class="h-5 w-5 text-primary" />
        <div>
            <p class="font-medium text-primary">Konfirmasi Data Service</p>
            <p class="text-sm text-muted-foreground">
                Pastikan seluruh data sudah benar sebelum menyimpan.
            </p>
        </div>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
        <!-- Customer Data -->
        <div class="space-y-4">
            <h3 class="font-bold text-lg flex items-center gap-2">
                <span
                    class="bg-muted w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    >1</span
                >
                Data Pelanggan
            </h3>
            <div class="bg-card border rounded-xl p-4 space-y-3 shadow-sm">
                <div class="grid grid-cols-[100px_1fr] gap-2 text-sm">
                    <span class="text-muted-foreground">Nama:</span>
                    <span class="font-medium">{form.customerName}</span>

                    <span class="text-muted-foreground">Telepon:</span>
                    <span class="font-medium">{form.customerPhone || "-"}</span>

                    <span class="text-muted-foreground">Alamat:</span>
                    <span class="font-medium"
                        >{form.customerAddress || "-"}</span
                    >
                </div>
            </div>
        </div>

        <!-- Device Data -->
        <div class="space-y-4">
            <h3 class="font-bold text-lg flex items-center gap-2">
                <span
                    class="bg-muted w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    >2</span
                >
                Data Perangkat
            </h3>
            <div class="bg-card border rounded-xl p-4 space-y-3 shadow-sm">
                <div class="grid grid-cols-[100px_1fr] gap-2 text-sm">
                    <span class="text-muted-foreground">Device:</span>
                    <span class="font-medium"
                        >{form.phoneBrand} {form.phoneModel}</span
                    >

                    <span class="text-muted-foreground">IMEI:</span>
                    <span class="font-medium font-mono">{form.imei || "-"}</span
                    >

                    <span class="text-muted-foreground">Status:</span>
                    <span>
                        {#if form.phoneStatus === "mati_total"}
                            <Badge variant="destructive">Mati Total</Badge>
                        {:else}
                            <Badge
                                variant="outline"
                                class="bg-green-50 text-green-700 border-green-200"
                                >Nyala</Badge
                            >
                        {/if}
                    </span>

                    <span class="text-muted-foreground">Pola/PIN:</span>
                    <span class="font-medium">{form.pinPattern || "-"}</span>
                </div>

                <Separator />

                <div class="space-y-2">
                    <span
                        class="text-xs font-semibold text-muted-foreground uppercase"
                        >Kondisi Fisik</span
                    >
                    <div class="flex flex-wrap gap-1">
                        {#if form.physicalConditions.length > 0}
                            {#each form.physicalConditions as condition}
                                <Badge variant="secondary" class="text-xs"
                                    >{condition}</Badge
                                >
                            {/each}
                        {:else}
                            <span class="text-sm text-muted-foreground italic"
                                >Tidak ada catatan fisik</span
                            >
                        {/if}
                    </div>
                </div>

                <div class="space-y-2">
                    <span
                        class="text-xs font-semibold text-muted-foreground uppercase"
                        >Kelengkapan</span
                    >
                    <div class="flex flex-wrap gap-1">
                        {#if form.completeness.length > 0}
                            {#each form.completeness as item}
                                <Badge variant="outline" class="text-xs"
                                    >{item}</Badge
                                >
                            {/each}
                        {:else}
                            <span class="text-sm text-muted-foreground italic"
                                >Batangan</span
                            >
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <!-- QC Summary -->
        <div class="space-y-4">
            <h3 class="font-bold text-lg flex items-center gap-2">
                <span
                    class="bg-muted w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    >3</span
                >
                Initial QC
            </h3>
            <div class="bg-card border rounded-xl p-4 space-y-3 shadow-sm">
                {#if form.canDoInitialQC}
                    <div class="grid grid-cols-2 gap-2">
                        {#each Object.entries(form.initialQC) as [key, value]}
                            <div class="flex items-center gap-2 text-sm">
                                {#if value}
                                    <CheckCircle
                                        class="h-4 w-4 text-green-500"
                                    />
                                {:else}
                                    <XCircle class="h-4 w-4 text-red-500" />
                                {/if}
                                <span class="capitalize"
                                    >{key
                                        .replace(/([A-Z])/g, " $1")
                                        .trim()}</span
                                >
                            </div>
                        {/each}
                        {#if Object.keys(form.initialQC).length === 0}
                            <span
                                class="text-sm text-muted-foreground italic col-span-2"
                                >Belum ada data QC</span
                            >
                        {/if}
                    </div>
                {:else}
                    <div
                        class="flex items-center gap-3 p-3 rounded-lg border border-dashed text-orange-900 border-orange-200 bg-orange-50"
                    >
                        <AlertCircle class="h-5 w-5 text-orange-500" />
                        <p class="text-sm">
                            Initial QC tidak dapat dilakukan karena kondisi
                            perangkat <strong>Mati Total</strong>.
                        </p>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Complaint Data -->
        <div class="space-y-4">
            <h3 class="font-bold text-lg flex items-center gap-2">
                <span
                    class="bg-muted w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    >4</span
                >
                Keluhan & Masalah
            </h3>
            <div class="bg-card border rounded-xl p-4 space-y-3 shadow-sm">
                <div class="space-y-1">
                    <span
                        class="text-xs font-semibold text-muted-foreground uppercase"
                        >Keluhan Utama</span
                    >
                    <p class="text-sm bg-muted/30 p-2 rounded-lg border">
                        {form.complaint}
                    </p>
                </div>

                {#if form.photos.length > 0}
                    <div class="space-y-1 pt-2">
                        <span
                            class="text-xs font-semibold text-muted-foreground uppercase"
                            >Foto Perangkat</span
                        >
                        <div class="flex gap-2 overflow-x-auto py-2">
                            {#each form.photos as photo}
                                <img
                                    src={photo}
                                    alt="Device"
                                    class="h-16 w-16 object-cover rounded-lg border"
                                />
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
