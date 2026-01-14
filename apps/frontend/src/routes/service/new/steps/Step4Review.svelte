<script lang="ts">
    import { Separator } from "$lib/components/ui/separator";
    import { Badge } from "$lib/components/ui/badge";
    import {
        User,
        Smartphone,
        Wrench,
        Calendar,
        CheckCircle,
        Clock,
    } from "lucide-svelte";
    import type { ServiceFormStore } from "../form.svelte";

    let {
        form,
        technicians = [],
    }: { form: ServiceFormStore; technicians: any[] } = $props();

    const statusOptions = [
        { value: "nyala", label: "Nyala Normal" },
        { value: "mati_total", label: "Mati Total" },
        { value: "restart", label: "Restart" },
        { value: "blank_hitam", label: "Blank Hitam" },
    ];

    const physicalOptions = [
        { v: "normal", l: "Normal (Mulus)" },
        { v: "lecet", l: "Lecet / Goresan" },
        { v: "retak", l: "Retak / Pecah" },
        { v: "bekas_air", l: "Bekas Air / Korosi" },
        { v: "bengkok", l: "Bengkok / Dent" },
    ];

    const completenessOptions = [
        { v: "charger", l: "Charger" },
        { v: "box", l: "Dus/Box" },
        { v: "simcard", l: "SIM Card" },
        { v: "memorycard", l: "Memory Card" },
        { v: "case", l: "Case/Casing" },
        { v: "earphone", l: "Earphone" },
    ];
</script>

<div class="grid gap-6 animate-in slide-in-from-right-4 duration-500">
    <div class="space-y-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
            <CheckCircle class="h-5 w-5 text-primary" />
            Konfirmasi Layanan
        </h3>
        <p class="text-sm text-muted-foreground">
            Pastikan semua data yang diinput sudah benar sebelum menyimpan
            layanan.
        </p>
    </div>

    <div class="space-y-6">
        <!-- Service Type Badge -->
        <div
            class={`p-4 rounded-xl flex items-center gap-3 border ${form.isWalkin ? "bg-green-50 border-green-200 text-green-800" : "bg-blue-50 border-blue-200 text-blue-800"}`}
        >
            <div
                class={`p-2 rounded-full ${form.isWalkin ? "bg-green-100" : "bg-blue-100"}`}
            >
                <Clock class="h-5 w-5" />
            </div>
            <div>
                <p class="font-bold text-sm uppercase tracking-wide">
                    Tipe Layanan
                </p>
                <p class="font-semibold text-lg">
                    {form.isWalkin
                        ? "Walk-in Service (Ditunggu)"
                        : "Regular Service (Ditinggal)"}
                </p>
            </div>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
            <!-- Customer & Device -->
            <div class="space-y-6">
                <!-- Customer -->
                <div
                    class="rounded-xl border bg-card/50 shadow-sm overflow-hidden"
                >
                    <div
                        class="bg-muted/50 p-3 border-b flex items-center gap-2 font-medium"
                    >
                        <User class="h-4 w-4" /> Data Pelanggan
                    </div>
                    <div class="p-4 space-y-3 text-sm">
                        <div
                            class="grid grid-cols-[100px_1fr] items-center gap-2"
                        >
                            <span class="text-muted-foreground">Nama:</span>
                            <span class="font-medium">{form.customerName}</span>
                        </div>
                        {#if form.customerPhone}
                            <div
                                class="grid grid-cols-[100px_1fr] items-center gap-2"
                            >
                                <span class="text-muted-foreground"
                                    >Telepon:</span
                                >
                                <span class="font-medium"
                                    >{form.customerPhone}</span
                                >
                            </div>
                        {/if}
                        {#if form.customerAddress}
                            <div
                                class="grid grid-cols-[100px_1fr] items-start gap-2"
                            >
                                <span class="text-muted-foreground"
                                    >Alamat:</span
                                >
                                <span class="font-medium"
                                    >{form.customerAddress}</span
                                >
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Device -->
                <div
                    class="rounded-xl border bg-card/50 shadow-sm overflow-hidden"
                >
                    <div
                        class="bg-muted/50 p-3 border-b flex items-center gap-2 font-medium"
                    >
                        <Smartphone class="h-4 w-4" /> Data Perangkat
                    </div>
                    <div class="p-4 space-y-3 text-sm">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <span class="text-muted-foreground text-xs"
                                    >Brand/Model</span
                                >
                                <p class="font-medium">
                                    {form.phoneBrand}
                                    {form.phoneModel}
                                </p>
                            </div>
                            <div>
                                <span class="text-muted-foreground text-xs"
                                    >Status Awal</span
                                >
                                <p>
                                    <Badge variant="outline"
                                        >{statusOptions.find(
                                            (s) => s.value === form.phoneStatus,
                                        )?.label}</Badge
                                    >
                                </p>
                            </div>
                        </div>

                        {#if form.imei || form.pinPattern}
                            <Separator />
                            <div class="grid grid-cols-2 gap-4">
                                {#if form.imei}
                                    <div>
                                        <span
                                            class="text-muted-foreground text-xs"
                                            >IMEI</span
                                        >
                                        <p class="font-mono text-xs">
                                            {form.imei}
                                        </p>
                                    </div>
                                {/if}
                                {#if form.pinPattern}
                                    <div>
                                        <span
                                            class="text-muted-foreground text-xs"
                                            >PIN / Pola</span
                                        >
                                        <p class="font-mono text-xs">
                                            {form.pinPattern}
                                        </p>
                                    </div>
                                {/if}
                            </div>
                        {/if}

                        {#if form.physicalConditions.length > 0 || form.completeness.length > 0}
                            <Separator />
                            <div class="space-y-2">
                                {#if form.physicalConditions.length > 0}
                                    <div class="flex flex-wrap gap-1">
                                        {#each form.physicalConditions as item}
                                            <Badge
                                                variant="secondary"
                                                class="text-[10px]"
                                                >{physicalOptions.find(
                                                    (o) => o.v === item,
                                                )?.l}</Badge
                                            >
                                        {/each}
                                    </div>
                                {/if}
                                {#if form.completeness.length > 0}
                                    <div class="flex flex-wrap gap-1">
                                        {#each form.completeness as item}
                                            <Badge
                                                variant="outline"
                                                class="text-[10px]"
                                                >{completenessOptions.find(
                                                    (o) => o.v === item,
                                                )?.l}</Badge
                                            >
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {/if}
                        {#if form.physicalNotes}
                            <p class="text-xs text-muted-foreground italic">
                                " {form.physicalNotes} "
                            </p>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Service Info -->
            <div class="space-y-6">
                <div
                    class="rounded-xl border bg-card/50 shadow-sm overflow-hidden h-full"
                >
                    <div
                        class="bg-muted/50 p-3 border-b flex items-center gap-2 font-medium"
                    >
                        <Wrench class="h-4 w-4" /> Detail Service
                    </div>
                    <div class="p-4 space-y-4 text-sm">
                        <div>
                            <span
                                class="text-muted-foreground text-xs block mb-1"
                                >{form.isWalkin
                                    ? "Kerusakan yang Diperbaiki"
                                    : "Keluhan Customer"}</span
                            >
                            <p class="font-medium bg-muted/30 p-2 rounded-lg">
                                {form.complaint}
                            </p>
                        </div>

                        <div
                            class="grid grid-cols-[100px_1fr] gap-4 items-center"
                        >
                            <span class="text-muted-foreground">Teknisi:</span>
                            <span class="font-medium">
                                {technicians.find(
                                    (t) => t.id === form.technician,
                                )?.name || "Belum Ditentukan"}
                            </span>
                        </div>

                        <Separator />

                        {#if form.isWalkin}
                            <!-- Walk-in Financials -->
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-muted-foreground"
                                        >Jasa Service:</span
                                    >
                                    <span
                                        >Rp {form.walkinServiceFee.toLocaleString(
                                            "id-ID",
                                        )}</span
                                    >
                                </div>
                                {#if form.totalPartPrice > 0}
                                    <div class="flex justify-between">
                                        <span class="text-muted-foreground"
                                            >Sparepart Total:</span
                                        >
                                        <span
                                            >Rp {form.totalPartPrice.toLocaleString(
                                                "id-ID",
                                            )}</span
                                        >
                                    </div>
                                {/if}
                                <Separator />
                                <div
                                    class="flex justify-between font-bold text-lg"
                                >
                                    <span>Total Biaya:</span>
                                    <span class="text-green-600"
                                        >Rp {form.grandTotal.toLocaleString(
                                            "id-ID",
                                        )}</span
                                    >
                                </div>
                            </div>

                            {#if form.selectedParts.length > 0}
                                <div class="pt-2">
                                    <p
                                        class="text-xs text-muted-foreground mb-1"
                                    >
                                        Sparepart yg digunakan:
                                    </p>
                                    <ul class="list-disc list-inside text-xs">
                                        {#each form.selectedParts as part}
                                            <li>{part.name}</li>
                                        {/each}
                                    </ul>
                                </div>
                            {/if}
                        {:else}
                            <!-- Regular Service Financials -->
                            <div>
                                <span
                                    class="text-muted-foreground text-xs block mb-1"
                                    >Estimasi Biaya:</span
                                >
                                {#if form.isPriceRange}
                                    <p class="font-medium">
                                        Rp {form.minPrice.toLocaleString(
                                            "id-ID",
                                        )} - Rp {form.maxPrice.toLocaleString(
                                            "id-ID",
                                        )}
                                    </p>
                                {:else}
                                    <p class="font-medium">
                                        Rp {form.estimatedCost.toLocaleString(
                                            "id-ID",
                                        )}
                                    </p>
                                {/if}
                            </div>

                            {#if form.downPayment > 0}
                                <div
                                    class="flex items-center gap-2 text-green-600"
                                >
                                    <CheckCircle class="h-4 w-4" />
                                    <span class="font-medium"
                                        >DP Terbayar: Rp {form.downPayment.toLocaleString(
                                            "id-ID",
                                        )}</span
                                    >
                                </div>
                            {/if}

                            <div>
                                <span
                                    class="text-muted-foreground text-xs block mb-1"
                                    >Estimasi Selesai:</span
                                >
                                <p class="font-medium flex items-center gap-2">
                                    <Calendar
                                        class="h-4 w-4 text-muted-foreground"
                                    />
                                    {form.estimatedCompletionDate
                                        ? new Date(
                                              form.estimatedCompletionDate,
                                          ).toLocaleDateString("id-ID", {
                                              weekday: "long",
                                              day: "numeric",
                                              month: "long",
                                              year: "numeric",
                                          })
                                        : "Belum ditentukan"}
                                </p>
                            </div>

                            {#if form.initialDiagnosis}
                                <div class="pt-2">
                                    <span
                                        class="text-muted-foreground text-xs block mb-1"
                                        >Diagnosa Awal:</span
                                    >
                                    <p class="text-xs bg-muted/30 p-2 rounded">
                                        {form.initialDiagnosis}
                                    </p>
                                </div>
                            {/if}
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
