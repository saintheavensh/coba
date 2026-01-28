<script lang="ts">
    import { Badge } from "$lib/components/ui/badge";
    import { Separator } from "$lib/components/ui/separator";
    import { CheckCircle, XCircle, AlertCircle } from "lucide-svelte";
    import type { ServiceFormStore } from "../form.svelte";

    let { form } = $props<{ form: ServiceFormStore }>();
</script>

<div class="space-y-6">
    <div
        class="bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-3xl border border-primary/20 flex items-center gap-4 relative overflow-hidden"
    >
        <div class="absolute inset-0 bg-primary/5 blur-3xl"></div>
        <div class="p-3 bg-background/50 rounded-2xl shadow-sm z-10">
            <AlertCircle class="h-6 w-6 text-primary" />
        </div>
        <div class="z-10">
            <p class="font-bold text-lg text-primary">
                Konfirmasi Data Service
            </p>
            <p class="text-sm text-muted-foreground">
                Pastikan seluruh data sudah benar sebelum menyimpan tiket.
            </p>
        </div>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
        <!-- Customer Data -->
        <div class="space-y-4">
            <h3 class="font-bold text-lg flex items-center gap-2">
                <span
                    class="bg-primary/10 text-primary w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ring-1 ring-primary/20"
                    >1</span
                >
                Data Pelanggan
            </h3>
            <div
                class="bg-card/50 border rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300"
            >
                <div class="grid grid-cols-[100px_1fr] gap-3 text-sm">
                    <span class="text-muted-foreground">Nama:</span>
                    <span class="font-bold">{form.customerName}</span>

                    <span class="text-muted-foreground">Telepon:</span>
                    <span class="font-medium">{form.customerPhone || "-"}</span>

                    <span class="text-muted-foreground">Alamat:</span>
                    <span class="font-medium leading-relaxed"
                        >{form.customerAddress || "-"}</span
                    >
                </div>
            </div>
        </div>

        <!-- Device Data -->
        <div class="space-y-4">
            <h3 class="font-bold text-lg flex items-center gap-2">
                <span
                    class="bg-primary/10 text-primary w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ring-1 ring-primary/20"
                    >2</span
                >
                Data Perangkat
            </h3>
            <div
                class="bg-card/50 border rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300"
            >
                <div class="grid grid-cols-[100px_1fr] gap-3 text-sm">
                    <span class="text-muted-foreground">Device:</span>
                    <span class="font-bold"
                        >{form.phoneBrand} {form.phoneModel}</span
                    >

                    <span class="text-muted-foreground">IMEI:</span>
                    <span
                        class="font-mono bg-muted/50 px-2 py-0.5 rounded text-xs w-fit"
                        >{form.imei || "-"}</span
                    >

                    <span class="text-muted-foreground">Status:</span>
                    <span>
                        {#if form.phoneStatus === "mati_total"}
                            <Badge variant="destructive" class="rounded-md"
                                >Mati Total</Badge
                            >
                        {:else}
                            <Badge
                                variant="outline"
                                class="bg-green-50 text-green-700 border-green-200 rounded-md"
                                >Nyala</Badge
                            >
                        {/if}
                    </span>

                    <span class="text-muted-foreground">Pola/PIN:</span>
                    <span class="font-medium font-mono"
                        >{form.pinPattern || "-"}</span
                    >
                </div>

                <Separator class="bg-border/50" />

                <div class="space-y-2">
                    <span
                        class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                        >Kondisi Fisik</span
                    >
                    <div class="flex flex-wrap gap-1.5">
                        {#if form.physicalConditions.length > 0}
                            {#each form.physicalConditions as condition}
                                <Badge
                                    variant="secondary"
                                    class="text-xs font-normal rounded-lg bg-muted text-foreground"
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
                        class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                        >Kelengkapan</span
                    >
                    <div class="flex flex-wrap gap-1.5">
                        {#if form.completeness.length > 0}
                            {#each form.completeness as item}
                                <Badge
                                    variant="outline"
                                    class="text-xs font-normal rounded-lg"
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

        {#if form.isWalkin}
            <!-- Service & Warranty Data (Walk-in Only) -->
            <div class="space-y-4 md:col-span-2">
                <h3 class="font-bold text-lg flex items-center gap-2">
                    <span
                        class="bg-blue-100 text-blue-700 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ring-1 ring-blue-200"
                        >5</span
                    >
                    Detail Layanan & Garansi
                </h3>
                <div
                    class="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 space-y-4 shadow-sm"
                >
                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="space-y-3">
                            <span
                                class="text-xs font-bold text-blue-800 uppercase tracking-wider block border-b border-blue-200/50 pb-2"
                            >
                                Rincian Biaya
                            </span>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-muted-foreground"
                                        >Jasa Service:</span
                                    >
                                    <span class="font-medium"
                                        >Rp {form.walkinServiceFee.toLocaleString(
                                            "id-ID",
                                        )}</span
                                    >
                                </div>
                                {#if form.selectedParts.length > 0}
                                    <div class="flex justify-between">
                                        <span class="text-muted-foreground"
                                            >Total Sparepart ({form
                                                .selectedParts.length}):</span
                                        >
                                        <span class="font-medium"
                                            >Rp {form.totalPartPrice.toLocaleString(
                                                "id-ID",
                                            )}</span
                                        >
                                    </div>
                                {/if}
                                {#if form.extPartBuyPrice > 0}
                                    <div class="flex justify-between">
                                        <span class="text-muted-foreground"
                                            >Part Eksternal:</span
                                        >
                                        <span class="font-medium"
                                            >Rp {parseInt(
                                                form.extPartBuyPrice || 0,
                                            ).toLocaleString("id-ID")}</span
                                        >
                                    </div>
                                {/if}
                                <Separator class="bg-blue-200/30" />
                                <div
                                    class="flex justify-between text-base font-bold text-blue-900"
                                >
                                    <span>Total Biaya:</span>
                                    <span
                                        >Rp {form.grandTotal.toLocaleString(
                                            "id-ID",
                                        )}</span
                                    >
                                </div>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <span
                                class="text-xs font-bold text-blue-800 uppercase tracking-wider block border-b border-blue-200/50 pb-2"
                            >
                                Garansi & Catatan
                            </span>
                            <div class="space-y-4">
                                <div>
                                    <span
                                        class="text-xs text-muted-foreground block mb-1"
                                        >Durasi Garansi</span
                                    >
                                    {#if form.warranty === "none"}
                                        <Badge
                                            variant="destructive"
                                            class="rounded-md"
                                            >Tanpa Garansi</Badge
                                        >
                                    {:else}
                                        <Badge
                                            variant="outline"
                                            class="bg-green-50 text-green-700 border-green-200 rounded-md font-bold px-3 py-1"
                                        >
                                            {form.warranty}
                                        </Badge>
                                    {/if}
                                </div>

                                {#if form.serviceDescription}
                                    <div>
                                        <span
                                            class="text-xs text-muted-foreground block mb-1"
                                            >Keterangan Pengerjaan</span
                                        >
                                        <p
                                            class="text-sm bg-white/50 p-2 rounded-lg border border-blue-100"
                                        >
                                            {form.serviceDescription}
                                        </p>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>
