<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/components/ui/dialog";
    import { Label } from "$lib/components/ui/label";
    import { Input } from "$lib/components/ui/input";
    import { Separator } from "$lib/components/ui/separator";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";
    import { Badge } from "$lib/components/ui/badge";
    import CurrencyInput from "$lib/components/custom/currency-input.svelte";
    import { toast } from "svelte-sonner";
    import {
        Camera,
        CheckCircle,
        CreditCard,
        Package,
        Upload,
        ChevronLeft,
        ChevronRight,
        Plus,
        X,
        Printer,
    } from "lucide-svelte";
    import { ServiceService } from "$lib/services/service.service";
    import {
        PaymentService,
        type PaymentMethod,
    } from "$lib/services/payment.service";
    import { formatCurrency } from "$lib/utils";
    import { onMount } from "svelte";
    import { SettingsService } from "$lib/services/settings.service";

    interface Props {
        open: boolean;
        serviceId: number;
        serviceNo: string;
        customer?: { name: string; phone: string } | null;
        device?: { brand: string; model: string; imei?: string };
        cost: number;
        serviceStatus: string;
        onComplete: () => void;
        onClose: () => void;
    }

    let {
        open = $bindable(false),
        serviceId,
        serviceNo,
        customer,
        device,
        cost,
        serviceStatus,
        onComplete,
        onClose,
    }: Props = $props();

    type PaymentItem = {
        methodId: string;
        variantId?: string; // For bank selection
        amount: number;
        reference?: string;
    };

    // Wizard State
    let currentStep = $state(1);
    const TOTAL_STEPS = 2; // Step 1: Verification, Step 2: Payment
    let isSubmitting = $state(false);

    // Verification Data
    let receiptOption = $state<"receipt" | "no_receipt">("receipt");
    let receiptPhoto = $state("");
    let idPhoto = $state("");
    let idName = $state("");

    // Payment Data
    let availableMethods = $state<PaymentMethod[]>([]);
    let payments = $state<PaymentItem[]>([]); // Initialized in effect

    // Load payment methods
    onMount(async () => {
        try {
            availableMethods = await PaymentService.getEnabledMethods();
        } catch (e) {
            console.error("Failed to load payment methods", e);
            toast.error("Gagal memuat metode pembayaran");
        }
    });

    // Warranty State
    let warranty = $state("");
    let warrantyOptions = $state<string[]>([]);

    onMount(async () => {
        try {
            const settings = await SettingsService.getServiceSettings();
            if (
                settings.warrantyPresets &&
                settings.warrantyPresets.length > 0
            ) {
                warrantyOptions = settings.warrantyPresets.map((p) => p.label);
                // Default to settings default warranty days if not set
                if (!warranty) {
                    const defaultPreset = settings.warrantyPresets.find(
                        (p) => p.days === settings.defaultWarrantyDays,
                    );
                    if (defaultPreset) {
                        warranty = defaultPreset.label;
                    } else {
                        warranty = warrantyOptions[0];
                    }
                }
            } else {
                // Fallback defaults
                warrantyOptions = [
                    "Tanpa Garansi",
                    "1 Minggu",
                    "1 Bulan",
                    "3 Bulan",
                ];
                warranty = "1 Minggu";
            }
        } catch (e) {
            console.error("Failed to load service settings", e);
            // Fail safe
            warrantyOptions = ["Tanpa Garansi", "1 Minggu", "1 Bulan"];
            warranty = "1 Minggu";
        }
    });

    // Initialize payment amount when opening
    $effect(() => {
        if (open) {
            currentStep = 1;
            // Default to first method (usually Cash)
            const defaultMethod =
                availableMethods.find((m) => m.type === "cash") ||
                availableMethods[0];
            const defaultId = defaultMethod ? defaultMethod.id : "";

            payments = [{ methodId: defaultId, amount: cost }];
            receiptOption = "receipt";
            receiptPhoto = "";
            idPhoto = "";
            idName = "";
        }
    });

    // Derived Logic
    let totalPaid = $derived(
        payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    );
    let change = $derived(totalPaid - cost);
    let remaining = $derived(cost - totalPaid);

    function nextStep() {
        if (currentStep === 1) {
            // Validate Step 1
            if (receiptOption === "receipt" && !receiptPhoto) {
                toast.error("Mohon upload foto nota/kwitansi");
                return;
            }
            if (receiptOption === "no_receipt") {
                if (!idName.trim()) {
                    toast.error("Mohon isi nama sesuai KTP");
                    return;
                }
                if (!idPhoto) {
                    toast.error("Mohon upload foto KTP");
                    return;
                }
                // Validate Name Match
                const customerName = (customer?.name || "").toLowerCase();
                const inputName = idName.toLowerCase();
                if (
                    !inputName.includes(customerName) &&
                    !customerName.includes(inputName) &&
                    !inputName.includes(customerName.split(" ")[0])
                ) {
                    if (
                        !confirm(
                            "Nama di KTP berbeda dengan nama customer. Lanjutkan?",
                        )
                    ) {
                        return;
                    }
                }
            }
            currentStep++;
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            currentStep--;
        }
    }

    function addPaymentRow() {
        const defaultMethod =
            availableMethods.find((m) => m.type === "cash") ||
            availableMethods[0];
        payments = [
            ...payments,
            { methodId: defaultMethod?.id || "", amount: 0 },
        ];
    }

    function removePaymentRow(index: number) {
        if (payments.length > 1) {
            payments = payments.filter((_, i) => i !== index);
        }
    }

    function handleMethodChange(index: number, newMethodId: string) {
        // Update method
        payments[index].methodId = newMethodId;
        // Reset variant
        payments[index].variantId = undefined;
    }

    function handleVariantChange(index: number, newVariantId: string) {
        payments[index].variantId = newVariantId;
    }

    function getSelectedMethod(methodId: string) {
        return availableMethods.find((m) => m.id === methodId);
    }

    async function handleSubmit() {
        if (remaining > 0) {
            toast.error(`Pembayaran kurang ${formatCurrency(remaining)}`);
            return;
        }

        // Validate banks for transfer methods
        for (const p of payments) {
            const method = getSelectedMethod(p.methodId);
            if (method?.type === "transfer" && !p.variantId) {
                toast.error("Mohon pilih Bank untuk metode Transfer");
                return;
            }
        }

        isSubmitting = true;
        try {
            // Map IDs to Names for storage (snapshot)
            // Or prefer storing IDs if backend supports linking.
            // Current schema `sale_payments` stores methodId AND method name.
            // `services` table stores `payment` as JSON. Ideally we store structure similar to sale_payments.

            const mappedPayments = payments.map((p) => {
                const method = getSelectedMethod(p.methodId);
                const variant = method?.variants.find(
                    (v) => v.id === p.variantId,
                );
                return {
                    methodId: p.methodId,
                    method: method?.name,
                    variantId: p.variantId,
                    variant: variant?.name,
                    amount: p.amount,
                };
            });

            const paymentData = {
                payments: mappedPayments,
                totalPaid,
                change,
                receiptOption,
                receiptPhoto,
                idPhoto,
                idName,
                warranty: serviceStatus !== "batal" ? warranty : undefined,
            };

            await ServiceService.patchService(serviceId, {
                payment: paymentData,
            });

            // Status update
            // Construct note from payments
            const paymentNote = mappedPayments
                .map(
                    (p) =>
                        `${p.method}${p.variant ? ` (${p.variant})` : ""}: ${formatCurrency(p.amount)}`,
                )
                .join(", ");

            await ServiceService.updateStatus(serviceId, {
                status: "diambil",
                userId:
                    JSON.parse(localStorage.getItem("user") || "{}").id ||
                    "USR-ADMIN",
                notes: `Pembayaran: ${paymentNote}`,
            });

            toast.success("Service berhasil diambil!");
            onComplete();
            open = false;
        } catch (e) {
            console.error(e);
            toast.error("Gagal memproses pengambilan");
        } finally {
            isSubmitting = false;
        }
    }

    function handlePhotoUpload(event: Event, target: "receipt" | "id") {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("File harus berupa gambar");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            if (target === "receipt") {
                receiptPhoto = base64;
            } else {
                idPhoto = base64;
            }
        };
        reader.readAsDataURL(file);
    }
</script>

<Dialog bind:open>
    <DialogContent
        class="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col p-0"
    >
        <DialogHeader class="px-6 py-4 border-b">
            <DialogTitle>Pengambilan Unit Service</DialogTitle>
            <DialogDescription>
                Service #{serviceNo} - {customer?.name}
            </DialogDescription>
        </DialogHeader>

        <div class="flex-1 overflow-y-auto p-6">
            {#if currentStep === 1}
                <!-- Step 1: Verification -->
                <div class="space-y-6">
                    <div class="p-3 bg-muted rounded-lg text-sm space-y-1">
                        <div class="flex justify-between font-medium">
                            <span>Device Info</span>
                            <span>{device?.brand} {device?.model}</span>
                        </div>
                        <div class="flex justify-between text-muted-foreground">
                            <span>IMEI</span>
                            <span>{device?.imei || "-"}</span>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <Label class="text-base">Dokumentasi Pengambilan</Label>

                        <!-- Option Selector -->
                        <div class="grid grid-cols-2 gap-4">
                            <label
                                class={`flex items-center justify-center p-4 rounded-lg border cursor-pointer transition-all text-sm font-medium gap-2
                                ${receiptOption === "receipt" ? "bg-primary/5 border-primary text-primary" : "bg-card hover:bg-muted"}`}
                            >
                                <input
                                    type="radio"
                                    bind:group={receiptOption}
                                    value="receipt"
                                    class="sr-only"
                                />
                                📄 Dengan Nota
                            </label>
                            <label
                                class={`flex items-center justify-center p-4 rounded-lg border cursor-pointer transition-all text-sm font-medium gap-2
                                ${receiptOption === "no_receipt" ? "bg-amber-50 border-amber-500 text-amber-700" : "bg-card hover:bg-muted"}`}
                            >
                                <input
                                    type="radio"
                                    bind:group={receiptOption}
                                    value="no_receipt"
                                    class="sr-only"
                                />
                                🪪 Tanpa Nota (KTP)
                            </label>
                        </div>

                        {#if receiptOption === "receipt"}
                            <div
                                class="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors"
                            >
                                {#if receiptPhoto}
                                    <div class="relative inline-block group">
                                        <img
                                            src={receiptPhoto}
                                            alt="Nota"
                                            class="max-h-48 rounded shadow-sm"
                                        />
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onclick={() => (receiptPhoto = "")}
                                        >
                                            Ganti
                                        </Button>
                                    </div>
                                {:else}
                                    <label class="cursor-pointer block">
                                        <div
                                            class="flex flex-col items-center gap-2 text-muted-foreground"
                                        >
                                            <Camera
                                                class="h-10 w-10 opacity-50"
                                            />
                                            <span class="font-medium"
                                                >Upload Foto Nota / Kwitansi</span
                                            >
                                            <span class="text-xs"
                                                >Klik untuk ambil foto atau
                                                upload file</span
                                            >
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            class="hidden"
                                            onchange={(e) =>
                                                handlePhotoUpload(e, "receipt")}
                                        />
                                    </label>
                                {/if}
                            </div>
                        {:else}
                            <div class="space-y-4">
                                <div
                                    class="bg-amber-50 text-amber-800 p-3 rounded text-sm flex items-start gap-2"
                                >
                                    <span class="text-lg">⚠️</span>
                                    <p>
                                        Customer wajib menunjukkan KTP asli yang
                                        sesuai dengan nama pemilik unit.
                                    </p>
                                </div>

                                <div class="space-y-2">
                                    <Label
                                        >Nama Sesuai KTP <span
                                            class="text-red-500">*</span
                                        ></Label
                                    >
                                    <Input
                                        bind:value={idName}
                                        placeholder="Masukkan nama lengkap di KTP"
                                    />
                                </div>

                                <div class="space-y-2">
                                    <Label
                                        >Foto KTP <span class="text-red-500"
                                            >*</span
                                        ></Label
                                    >
                                    <div
                                        class="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors"
                                    >
                                        {#if idPhoto}
                                            <div
                                                class="relative inline-block group"
                                            >
                                                <img
                                                    src={idPhoto}
                                                    alt="KTP"
                                                    class="max-h-48 rounded shadow-sm"
                                                />
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onclick={() =>
                                                        (idPhoto = "")}
                                                >
                                                    Ganti
                                                </Button>
                                            </div>
                                        {:else}
                                            <label class="cursor-pointer block">
                                                <div
                                                    class="flex flex-col items-center gap-2 text-muted-foreground"
                                                >
                                                    <Camera
                                                        class="h-10 w-10 opacity-50"
                                                    />
                                                    <span class="font-medium"
                                                        >Upload Foto KTP</span
                                                    >
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    class="hidden"
                                                    onchange={(e) =>
                                                        handlePhotoUpload(
                                                            e,
                                                            "id",
                                                        )}
                                                />
                                            </label>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            {:else if currentStep === 2}
                <!-- Step 2: Payment (Sales Style) -->
                <div class="flex flex-col h-full gap-6">
                    <!-- Summary Top -->
                    <div
                        class="bg-muted/30 p-4 rounded-lg border text-center space-y-1"
                    >
                        <span
                            class="text-xs text-muted-foreground uppercase tracking-wider font-semibold"
                            >Total Tagihan</span
                        >
                        <div
                            class="text-3xl font-bold font-mono tracking-tight text-primary"
                        >
                            {formatCurrency(cost)}
                        </div>
                    </div>

                    <!-- Payment Methods -->
                    <div class="space-y-3 flex-1">
                        <div
                            class="flex justify-between items-center pb-2 border-b"
                        >
                            <Label class="text-base font-semibold"
                                >Metode Pembayaran</Label
                            >
                            <Button
                                variant="ghost"
                                size="sm"
                                onclick={addPaymentRow}
                                disabled={payments.length >= 2 ||
                                    (payments[0] &&
                                        getSelectedMethod(payments[0].methodId)
                                            ?.type === "cash") ||
                                    availableMethods.length === 0}
                                class="h-8 text-xs"
                            >
                                <Plus class="h-3 w-3 mr-1" /> Tambah Split
                            </Button>
                        </div>

                        {#if availableMethods.length === 0}
                            <div
                                class="text-center p-4 text-muted-foreground text-sm"
                            >
                                Memuat metode pembayaran...
                            </div>
                        {:else}
                            {#each payments as payment, i}
                                {@const selectedMethod = getSelectedMethod(
                                    payment.methodId,
                                )}
                                <div
                                    class="p-3 border rounded-lg bg-card space-y-3 relative"
                                >
                                    <div
                                        class="flex justify-between items-center"
                                    >
                                        <span
                                            class="text-xs font-semibold text-muted-foreground uppercase"
                                            >Pembayaran #{i + 1}</span
                                        >
                                        {#if payments.length > 1}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                class="h-6 w-6 -mr-2 text-muted-foreground hover:text-red-500"
                                                onclick={() =>
                                                    removePaymentRow(i)}
                                            >
                                                <X class="h-3 w-3" />
                                            </Button>
                                        {/if}
                                    </div>

                                    <div class="grid gap-2">
                                        <Select
                                            type="single"
                                            value={payment.methodId}
                                            onValueChange={(val) =>
                                                handleMethodChange(i, val)}
                                        >
                                            <SelectTrigger>
                                                <span>
                                                    {getSelectedMethod(
                                                        payment.methodId,
                                                    )?.name || "Pilih Metode"}
                                                </span>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {#each availableMethods as method}
                                                    <SelectItem
                                                        value={method.id}
                                                    >
                                                        <span class="mr-2"
                                                            >{method.icon}</span
                                                        >
                                                        {method.name}
                                                    </SelectItem>
                                                {/each}
                                            </SelectContent>
                                        </Select>

                                        <!-- Sub-method / Variant Selector (e.g. Bank for Transfer) -->
                                        {#if selectedMethod?.variants && selectedMethod.variants.length > 0}
                                            <Select
                                                type="single"
                                                value={payment.variantId}
                                                onValueChange={(val) =>
                                                    handleVariantChange(i, val)}
                                            >
                                                <SelectTrigger
                                                    class="bg-muted/50"
                                                >
                                                    <span>
                                                        {selectedMethod.variants.find(
                                                            (v) =>
                                                                v.id ===
                                                                payment.variantId,
                                                        )?.name ||
                                                            "Pilih Bank / Opsi"}
                                                    </span>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {#each selectedMethod.variants as variant}
                                                        <SelectItem
                                                            value={variant.id}
                                                        >
                                                            {variant.name}
                                                            {variant.accountNumber
                                                                ? `(${variant.accountNumber})`
                                                                : ""}
                                                        </SelectItem>
                                                    {/each}
                                                </SelectContent>
                                            </Select>
                                        {/if}

                                        <div class="relative">
                                            <span
                                                class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium"
                                                >Rp</span
                                            >
                                            <CurrencyInput
                                                class="pl-9 font-semibold text-right"
                                                bind:value={payment.amount}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        {/if}
                    </div>

                    {#if serviceStatus !== "batal"}
                        <div
                            class="bg-card border rounded-lg p-4 space-y-2 mt-4 mb-4"
                        >
                            <Label>Garansi Toko</Label>
                            <Select
                                type="single"
                                value={warranty}
                                onValueChange={(v) => (warranty = v)}
                            >
                                <SelectTrigger>
                                    {warranty || "Pilih Garansi"}
                                </SelectTrigger>
                                <SelectContent>
                                    {#each warrantyOptions as opt}
                                        <SelectItem value={opt}
                                            >{opt}</SelectItem
                                        >
                                    {/each}
                                </SelectContent>
                            </Select>
                        </div>
                    {/if}

                    <!-- Payment Summary Box -->
                    <div
                        class="bg-muted p-4 rounded-lg space-y-2 text-sm mt-auto"
                    >
                        <div
                            class="flex justify-between items-center text-muted-foreground"
                        >
                            <span>Terbayar</span>
                            <span>{formatCurrency(totalPaid)}</span>
                        </div>
                        <Separator />
                        {#if remaining > 0}
                            <div
                                class="flex justify-between items-center font-bold text-red-600 text-base"
                            >
                                <span>Kurang Bayar</span>
                                <span>{formatCurrency(remaining)}</span>
                            </div>
                        {:else}
                            <div
                                class="flex justify-between items-center font-bold text-green-600 text-base"
                            >
                                <span>Kembalian</span>
                                <span>{formatCurrency(change)}</span>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>

        <DialogFooter
            class="px-6 py-4 border-t bg-muted/20 sm:justify-between items-center"
        >
            {#if currentStep === 1}
                <Button variant="ghost" onclick={onClose}>Batal</Button>
                <Button onclick={nextStep}>
                    Lanjut Pembayaran <ChevronRight class="ml-2 h-4 w-4" />
                </Button>
            {:else}
                <Button variant="outline" onclick={prevStep}>
                    <ChevronLeft class="mr-2 h-4 w-4" /> Kembali
                </Button>
                <Button
                    onclick={handleSubmit}
                    disabled={isSubmitting || remaining > 0}
                    class="min-w-[140px]"
                >
                    {#if isSubmitting}
                        Memproses...
                    {:else}
                        <CreditCard class="mr-2 h-4 w-4" /> Bayar & Ambil
                    {/if}
                </Button>
            {/if}
        </DialogFooter>
    </DialogContent>
</Dialog>
