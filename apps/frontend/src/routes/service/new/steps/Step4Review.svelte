<script lang="ts">
    import { Separator } from "$lib/components/ui/separator";
    import { Badge } from "$lib/components/ui/badge";
    import CurrencyInput from "$lib/components/custom/currency-input.svelte";
    import {
        User,
        Smartphone,
        Wrench,
        Calendar,
        CheckCircle,
        Clock,
    } from "lucide-svelte";
    import type { ServiceFormStore } from "../form.svelte";

    interface BankVariant {
        id: string;
        name: string;
        accountNumber?: string;
        accountHolder?: string;
        enabled: boolean;
    }

    interface PaymentMethod {
        id: string;
        name: string;
        type: string;
        variants?: BankVariant[];
        enabled: boolean;
    }

    let {
        form,
        technicians = [],
        paymentMethods = [],
    }: {
        form: ServiceFormStore;
        technicians: any[];
        paymentMethods: PaymentMethod[];
    } = $props();

    // Get transfer banks (variants from transfer type payment methods)
    const transferBanks = $derived(
        paymentMethods
            .filter((m) => m.type === "transfer" && m.enabled)
            .flatMap((m) => m.variants?.filter((v) => v.enabled) || []),
    );

    // Local state for split payment amounts (for CurrencyInput binding)
    let splitCashAmount = $state(0);
    let splitTransferAmount = $state(0);
    let cashReceived = $state(0);

    // Sync split amounts with form.payments
    $effect(() => {
        if (form.paymentMethod === "mixed") {
            const cashPayment = form.payments.find((p) => p.method === "cash");
            const transferPayment = form.payments.find(
                (p) => p.method === "transfer",
            );
            if (cashPayment) splitCashAmount = cashPayment.amount;
            if (transferPayment) splitTransferAmount = transferPayment.amount;
        }
    });

    // Update payments when split amounts change
    function updateSplitPayments() {
        form.payments = [
            { method: "cash", amount: splitCashAmount },
            { method: "transfer", amount: splitTransferAmount },
        ];
    }

    // Calculate change for cash payment
    const changeAmount = $derived(
        form.paymentMethod === "cash" && cashReceived > 0
            ? cashReceived - form.grandTotal
            : 0,
    );

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

        <!-- Payment Section (Walk-in Only) -->
        {#if form.isWalkin}
            <div
                class="rounded-xl border bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-sm overflow-hidden"
            >
                <div
                    class="bg-green-100/80 p-4 border-b border-green-200 flex items-center gap-2 font-semibold text-green-800"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                    </svg>
                    Pembayaran & Garansi
                </div>
                <div class="p-4 space-y-4">
                    <!-- Total Summary -->
                    <div
                        class="flex items-center justify-between bg-white p-4 rounded-xl border border-green-200 shadow-sm"
                    >
                        <span class="text-lg font-medium text-gray-700"
                            >Total Biaya</span
                        >
                        <span class="text-2xl font-bold text-green-700">
                            Rp {form.grandTotal.toLocaleString("id-ID")}
                        </span>
                    </div>

                    <!-- Payment Method Selection -->
                    <div class="space-y-2">
                        <span class="text-sm font-medium text-gray-700"
                            >Metode Pembayaran</span
                        >
                        <div class="grid grid-cols-4 gap-2">
                            <button
                                type="button"
                                class={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${form.paymentMethod === "cash" ? "border-green-500 bg-green-50 shadow-sm" : "border-gray-200 hover:border-green-300 bg-white"}`}
                                onclick={() => {
                                    form.paymentMethod = "cash";
                                    form.payments = [
                                        {
                                            method: "cash",
                                            amount: form.grandTotal,
                                        },
                                    ];
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class={`h-6 w-6 ${form.paymentMethod === "cash" ? "text-green-600" : "text-gray-400"}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                                <span class="text-xs font-medium">Tunai</span>
                            </button>
                            <button
                                type="button"
                                class={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${form.paymentMethod === "transfer" ? "border-blue-500 bg-blue-50 shadow-sm" : "border-gray-200 hover:border-blue-300 bg-white"}`}
                                onclick={() => {
                                    form.paymentMethod = "transfer";
                                    form.payments = [
                                        {
                                            method: "transfer",
                                            amount: form.grandTotal,
                                        },
                                    ];
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class={`h-6 w-6 ${form.paymentMethod === "transfer" ? "text-blue-600" : "text-gray-400"}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                    />
                                </svg>
                                <span class="text-xs font-medium">Transfer</span
                                >
                            </button>
                            <button
                                type="button"
                                class={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${form.paymentMethod === "qris" ? "border-purple-500 bg-purple-50 shadow-sm" : "border-gray-200 hover:border-purple-300 bg-white"}`}
                                onclick={() => {
                                    form.paymentMethod = "qris";
                                    form.payments = [
                                        {
                                            method: "qris",
                                            amount: form.grandTotal,
                                        },
                                    ];
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class={`h-6 w-6 ${form.paymentMethod === "qris" ? "text-purple-600" : "text-gray-400"}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                                    />
                                </svg>
                                <span class="text-xs font-medium">QRIS</span>
                            </button>
                            <button
                                type="button"
                                class={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${form.paymentMethod === "mixed" ? "border-orange-500 bg-orange-50 shadow-sm" : "border-gray-200 hover:border-orange-300 bg-white"}`}
                                onclick={() => {
                                    form.paymentMethod = "mixed";
                                    const half = Math.floor(
                                        form.grandTotal / 2,
                                    );
                                    form.payments = [
                                        { method: "cash", amount: half },
                                        {
                                            method: "transfer",
                                            amount: form.grandTotal - half,
                                        },
                                    ];
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class={`h-6 w-6 ${form.paymentMethod === "mixed" ? "text-orange-600" : "text-gray-400"}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                    />
                                </svg>
                                <span class="text-xs font-medium">Split</span>
                            </button>
                        </div>
                    </div>

                    <!-- Cash Received Input (for cash payment) -->
                    {#if form.paymentMethod === "cash"}
                        <div
                            class="space-y-3 p-4 bg-white rounded-xl border border-gray-200"
                        >
                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-1.5">
                                    <span
                                        class="text-sm font-medium text-gray-700"
                                        >Uang Diterima</span
                                    >
                                    <div class="flex items-center gap-2">
                                        <span
                                            class="text-gray-500 text-sm font-medium"
                                            >Rp</span
                                        >
                                        <CurrencyInput
                                            bind:value={cashReceived}
                                            placeholder="0"
                                            class="flex-1"
                                        />
                                    </div>
                                </div>
                                <div class="space-y-1.5">
                                    <span
                                        class="text-sm font-medium text-gray-700"
                                        >Kembalian</span
                                    >
                                    <div
                                        class={`flex items-center gap-2 p-2.5 rounded-lg border ${changeAmount >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                                    >
                                        <span
                                            class="text-gray-500 text-sm font-medium"
                                            >Rp</span
                                        >
                                        <span
                                            class={`text-lg font-bold ${changeAmount >= 0 ? "text-green-700" : "text-red-600"}`}
                                        >
                                            {changeAmount.toLocaleString(
                                                "id-ID",
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <!-- Quick amount buttons -->
                            <div class="flex flex-wrap gap-2">
                                {#each [form.grandTotal, Math.ceil(form.grandTotal / 10000) * 10000, Math.ceil(form.grandTotal / 50000) * 50000, Math.ceil(form.grandTotal / 100000) * 100000].filter((v, i, arr) => arr.indexOf(v) === i) as amount}
                                    <button
                                        type="button"
                                        class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors"
                                        onclick={() => (cashReceived = amount)}
                                    >
                                        {amount.toLocaleString("id-ID")}
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <!-- Split Payment Inputs (only when mixed) -->
                    {#if form.paymentMethod === "mixed"}
                        <div
                            class="space-y-4 p-4 bg-white rounded-xl border border-gray-200"
                        >
                            <div class="flex items-center gap-2">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-4 w-4 text-orange-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                    />
                                </svg>
                                <span
                                    class="text-sm font-semibold text-gray-800"
                                    >Pembayaran Split</span
                                >
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <!-- Cash Amount -->
                                <div class="space-y-1.5">
                                    <span
                                        class="text-sm font-medium text-gray-700 flex items-center gap-2"
                                    >
                                        <span
                                            class="w-2 h-2 bg-green-500 rounded-full"
                                        ></span>
                                        Tunai
                                    </span>
                                    <div class="flex items-center gap-2">
                                        <span
                                            class="text-gray-500 text-sm font-medium"
                                            >Rp</span
                                        >
                                        <CurrencyInput
                                            bind:value={splitCashAmount}
                                            placeholder="0"
                                            class="flex-1"
                                        />
                                    </div>
                                </div>

                                <!-- Transfer Amount -->
                                <div class="space-y-1.5">
                                    <span
                                        class="text-sm font-medium text-gray-700 flex items-center gap-2"
                                    >
                                        <span
                                            class="w-2 h-2 bg-blue-500 rounded-full"
                                        ></span>
                                        Transfer
                                    </span>
                                    <div class="flex items-center gap-2">
                                        <span
                                            class="text-gray-500 text-sm font-medium"
                                            >Rp</span
                                        >
                                        <CurrencyInput
                                            bind:value={splitTransferAmount}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <!-- Quick split buttons -->
                            <div class="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-colors"
                                    onclick={() => {
                                        splitCashAmount = Math.floor(
                                            form.grandTotal / 2,
                                        );
                                        splitTransferAmount =
                                            form.grandTotal - splitCashAmount;
                                        updateSplitPayments();
                                    }}
                                >
                                    50% / 50%
                                </button>
                                <button
                                    type="button"
                                    class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-colors"
                                    onclick={() => {
                                        splitCashAmount = Math.floor(
                                            form.grandTotal * 0.3,
                                        );
                                        splitTransferAmount =
                                            form.grandTotal - splitCashAmount;
                                        updateSplitPayments();
                                    }}
                                >
                                    30% / 70%
                                </button>
                                <button
                                    type="button"
                                    class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-colors"
                                    onclick={() => {
                                        splitCashAmount = Math.floor(
                                            form.grandTotal * 0.7,
                                        );
                                        splitTransferAmount =
                                            form.grandTotal - splitCashAmount;
                                        updateSplitPayments();
                                    }}
                                >
                                    70% / 30%
                                </button>
                            </div>

                            <!-- Total Summary -->
                            <div
                                class="flex items-center justify-between pt-3 border-t border-gray-100"
                            >
                                <div class="flex items-center gap-4 text-sm">
                                    <span class="text-gray-500">Total:</span>
                                    <span
                                        class={`font-bold ${splitCashAmount + splitTransferAmount === form.grandTotal ? "text-green-600" : "text-red-500"}`}
                                    >
                                        Rp {(
                                            splitCashAmount +
                                            splitTransferAmount
                                        ).toLocaleString("id-ID")}
                                    </span>
                                </div>
                                {#if splitCashAmount + splitTransferAmount !== form.grandTotal}
                                    <span class="text-xs text-red-500">
                                        {splitCashAmount + splitTransferAmount >
                                        form.grandTotal
                                            ? "Kelebihan"
                                            : "Kurang"}
                                        Rp {Math.abs(
                                            splitCashAmount +
                                                splitTransferAmount -
                                                form.grandTotal,
                                        ).toLocaleString("id-ID")}
                                    </span>
                                {:else}
                                    <span
                                        class="text-xs text-green-600 flex items-center gap-1"
                                    >
                                        <CheckCircle class="h-3 w-3" /> Sesuai
                                    </span>
                                {/if}
                            </div>

                            <!-- Apply button -->
                            <button
                                type="button"
                                class="w-full py-2 text-sm font-medium rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={splitCashAmount +
                                    splitTransferAmount !==
                                    form.grandTotal}
                                onclick={updateSplitPayments}
                            >
                                Terapkan Split
                            </button>
                        </div>
                    {/if}

                    <!-- Bank Selection (for transfer or mixed) -->
                    {#if (form.paymentMethod === "transfer" || form.paymentMethod === "mixed") && transferBanks.length > 0}
                        <div class="space-y-2">
                            <span class="text-sm font-medium text-gray-700"
                                >Rekening Tujuan Transfer</span
                            >
                            <div class="grid grid-cols-1 gap-2">
                                {#each transferBanks as bank}
                                    <button
                                        type="button"
                                        class={`flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${form.selectedBank?.id === bank.id ? "border-blue-500 bg-blue-50 shadow-sm" : "border-gray-200 hover:border-blue-300 bg-white"}`}
                                        onclick={() => {
                                            form.selectedBank = {
                                                id: bank.id,
                                                name: bank.name,
                                                accountNumber:
                                                    bank.accountNumber || "",
                                                accountHolder:
                                                    bank.accountHolder || "",
                                            };
                                        }}
                                    >
                                        <div>
                                            <p
                                                class="font-semibold text-gray-800"
                                            >
                                                {bank.name}
                                            </p>
                                            {#if bank.accountNumber}
                                                <p
                                                    class="text-sm text-gray-600"
                                                >
                                                    {bank.accountNumber}
                                                </p>
                                            {/if}
                                            {#if bank.accountHolder}
                                                <p
                                                    class="text-xs text-gray-500"
                                                >
                                                    a.n. {bank.accountHolder}
                                                </p>
                                            {/if}
                                        </div>
                                        {#if form.selectedBank?.id === bank.id}
                                            <CheckCircle
                                                class="h-5 w-5 text-blue-600"
                                            />
                                        {/if}
                                    </button>
                                {/each}
                            </div>
                            {#if !form.selectedBank && (form.paymentMethod === "transfer" || form.paymentMethod === "mixed")}
                                <p
                                    class="text-xs text-amber-600 flex items-center gap-1"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-3 w-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                        />
                                    </svg>
                                    Pilih rekening tujuan transfer
                                </p>
                            {/if}
                        </div>
                    {/if}

                    <!-- Warranty Selection -->
                    <div class="space-y-2">
                        <span class="text-sm font-medium text-gray-700"
                            >Garansi Service</span
                        >
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {#each [{ value: "none", label: "Tidak Ada", days: 0 }, { value: "3d", label: "3 Hari", days: 3 }, { value: "7d", label: "1 Minggu", days: 7 }, { value: "30d", label: "1 Bulan", days: 30 }] as preset}
                                <button
                                    type="button"
                                    class={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${form.warranty === preset.value ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200 hover:border-amber-300 text-gray-600 bg-white"}`}
                                    onclick={() =>
                                        (form.warranty = preset.value)}
                                >
                                    {preset.label}
                                </button>
                            {/each}
                        </div>
                        {#if form.warranty !== "none"}
                            <p
                                class="text-xs text-amber-600 flex items-center gap-1"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-3 w-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                    />
                                </svg>
                                Garansi berlaku untuk keluhan yang sama
                            </p>
                        {/if}
                    </div>

                    <!-- Payment Notes -->
                    <div class="space-y-2">
                        <label
                            for="payment-notes"
                            class="text-sm font-medium text-gray-700"
                            >Catatan Pembayaran (Opsional)</label
                        >
                        <textarea
                            id="payment-notes"
                            bind:value={form.paymentNotes}
                            placeholder="Catatan tambahan untuk pembayaran..."
                            rows="2"
                            class="w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                        ></textarea>
                    </div>

                    <!-- Payment Status -->
                    <div
                        class={`p-4 rounded-xl flex items-center gap-3 ${form.paymentValid ? "bg-green-100 border border-green-300" : "bg-amber-100 border border-amber-300"}`}
                    >
                        {#if form.paymentValid}
                            <CheckCircle class="h-6 w-6 text-green-600" />
                            <div>
                                <p class="font-bold text-green-800">
                                    Pembayaran Lunas
                                </p>
                                <p class="text-sm text-green-600">
                                    Siap untuk diselesaikan
                                </p>
                            </div>
                        {:else}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-6 w-6 text-amber-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                            <div>
                                <p class="font-bold text-amber-800">
                                    Menunggu Pembayaran
                                </p>
                                <p class="text-sm text-amber-600">
                                    Pastikan pembayaran sudah diterima
                                </p>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>
