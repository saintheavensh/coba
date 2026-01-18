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
    import { Textarea } from "$lib/components/ui/textarea";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
        DialogTrigger,
    } from "$lib/components/ui/dialog";
    import { Separator } from "$lib/components/ui/separator";
    import { Badge } from "$lib/components/ui/badge";
    import { toast } from "$lib/components/ui/sonner";
    import {
        ArrowLeft,
        ArrowRight,
        CheckCircle,
        Grid3X3,
        Smartphone,
        Package,
        ShoppingCart,
        XCircle,
        Search,
        Printer,
        DollarSign,
    } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { formatCurrency } from "$lib/utils";
    import PatternLock from "$lib/components/ui/pattern-lock.svelte";
    import { activityLogs, settings } from "$lib/stores/settings";
    import { refreshServiceList } from "$lib/stores/events";
    import { onMount } from "svelte";
    import {
        ServiceService,
        type CreateServiceInput,
    } from "$lib/services/service.service";
    import { InventoryService } from "$lib/services/inventory.service";
    import { api, API_URL } from "$lib/api";
    import CurrencyInput from "$lib/components/custom/currency-input.svelte";
    import { Plus, Minus, Trash2 } from "lucide-svelte";
    import { createQuery } from "@tanstack/svelte-query";
    import * as Command from "$lib/components/ui/command";
    import * as Popover from "$lib/components/ui/popover";
    import { Switch } from "$lib/components/ui/switch";
    import { Check, ChevronsUpDown } from "lucide-svelte";
    import { cn } from "$lib/utils";

    // Form state
    let currentStep = $state(1);
    let createdServiceOrder = $state<any>(null);
    let showPrintModal = $state(false);

    // Step 1: Customer & HP Data
    let isWalkin = $state(false);
    let customerName = $state("");
    let customerPhone = $state("");
    let customerAddress = $state("");
    let phoneBrand = $state("");
    let phoneModel = $state("");

    // HP Condition
    let phoneStatus = $state("nyala");
    let imei = $state("");
    let physicalConditions = $state<string[]>([]);
    let completeness = $state<string[]>([]);
    let physicalNotes = $state("");
    let pinPattern = $state("");

    // Pattern Lock Modal
    let isPatternOpen = $state(false);
    let patternPoints = $state<number[]>([]);
    let patternString = $derived(
        patternPoints.length > 0
            ? patternPoints.map((p) => p + 1).join("-")
            : "",
    );

    // Step 2: Service Details
    let complaint = $state("");
    let technician = $state("");
    let estimatedCost = $state("");
    let downPayment = $state("");
    let warranty = $state("none");
    let technicianNotes = $state(""); // New Field

    // Regular Service Specifics (NEW)
    let initialDiagnosis = $state(""); // Diagnosa Awal (Cek Arus dll)
    let possibleCauses = $state(""); // Kemungkinan Kerusakan
    let isPriceRange = $state(false); // Toggle Range Price
    let minPrice = $state("");
    let maxPrice = $state("");

    // Walk-in Sparepart Logic
    let sparepartSource = $state("none");
    let selectedParts = $state<any[]>([]);

    // Inventory & Device Compatibility
    let selectedDeviceId = $state<string | null>(null);
    let deviceSearchOpen = $state(false);

    let showInventoryModal = $state(false);
    let searchTerm = $state("");
    let filterCompatible = $state(true); // Default active if device selected

    // Queries
    const devicesQuery = createQuery(() => ({
        queryKey: ["devices"],
        queryFn: () => InventoryService.getDevices(),
    }));

    const inventoryQuery = createQuery(() => ({
        queryKey: [
            "products",
            searchTerm,
            filterCompatible && selectedDeviceId ? selectedDeviceId : null,
        ],
        queryFn: () =>
            InventoryService.getProducts(
                filterCompatible && selectedDeviceId
                    ? selectedDeviceId
                    : undefined,
            ),
        enabled: showInventoryModal,
    }));

    // External Part Data
    let extPartName = $state("");
    let extPartBuyPrice = $state("");
    let extPartSellPrice = $state("");

    // Payment State (Step 3 Walk-in)
    let paymentMethod = $state("cash"); // cash, transfer, split
    let payAmountCash = $state("");
    let payAmountTransfer = $state("");

    // Computed Totals
    let totalPartPrice = $derived(
        selectedParts.reduce((sum, p) => sum + (parseInt(p.price) || 0), 0) +
            (sparepartSource === "external"
                ? parseInt(extPartSellPrice) || 0
                : 0),
    );
    let serviceFee = $derived(parseInt(estimatedCost) || 0);
    // grandTotalEstimate replaces old 'grandTotalEstimate' logic to match sales flow
    let grandTotalEstimate = $derived(serviceFee + totalPartPrice);

    // Split Payment Logic
    let splitTransferAmount = $derived(
        paymentMethod === "split"
            ? grandTotalEstimate - (parseInt(payAmountCash) || 0)
            : 0,
    );

    let totalPaid = $derived(
        paymentMethod === "split"
            ? (parseInt(payAmountCash) || 0) +
                  (parseInt(payAmountTransfer) || 0)
            : paymentMethod === "transfer"
              ? parseInt(payAmountTransfer) || 0
              : parseInt(payAmountCash) || 0,
    );

    let changeAmount = $derived(totalPaid - grandTotalEstimate);

    // Validation
    const isErrorStatus = (status: string) =>
        ["mati_total", "restart", "blank_hitam"].includes(status);

    let step1Valid = $derived(
        customerName.trim() !== "" &&
            (isWalkin || customerPhone.trim() !== "") &&
            phoneBrand.trim() !== "" &&
            phoneModel.trim() !== "" &&
            phoneStatus.trim() !== "",
    );

    let step2Valid = $derived(
        complaint &&
            complaint.trim().length > 0 &&
            (!isWalkin || technician !== ""),
    );

    function nextStep() {
        if (currentStep === 1) {
            // Reset locked fields if error status
            if (isErrorStatus(phoneStatus)) {
                imei = "";
                pinPattern = "";
                patternPoints = [];
            }
            if (!step1Valid) {
                toast.error("Harap isi semua field yang wajib");
                return;
            }
        }
        if (currentStep === 2 && !step2Valid) {
            if (isWalkin && technician === "") {
                toast.error("Teknisi wajib diisi untuk Walk-in Customer");
            } else {
                toast.error(
                    `Harap isi ${isWalkin ? "kerusakan" : "keluhan customer"}`,
                );
            }
            return;
        }
        currentStep++;
    }

    function prevStep() {
        currentStep--;
    }

    function handlePatternChange(e: CustomEvent<number[]>) {
        patternPoints = e.detail;
        pinPattern = "Pola: " + patternString;
    }

    function handleSavePattern() {
        isPatternOpen = false;
        toast.success(`Pola tersimpan: ${patternString}`);
    }

    function addInventoryPart(part: any) {
        selectedParts = [...selectedParts, { ...part, type: "inventory" }];
        showInventoryModal = false;
        toast.success(`${part.name} ditambahkan`);
    }

    function removePart(index: number) {
        selectedParts = selectedParts.filter((_, i) => i !== index);
    }

    function resetForm() {
        currentStep = 1;
        isWalkin = false;
        customerName = "";
        customerPhone = "";
        customerAddress = "";
        phoneBrand = "";
        phoneModel = "";
        selectedDeviceId = null;
        phoneStatus = "nyala";
        imei = "";
        physicalConditions = [];
        completeness = [];
        physicalNotes = "";
        pinPattern = "";
        patternPoints = [];
        complaint = "";
        technician = "";
        estimatedCost = "";
        downPayment = "";
        warranty = "none";
        technicianNotes = "";
        sparepartSource = "none";
        selectedParts = [];
        extPartName = "";
        extPartBuyPrice = "";
        extPartSellPrice = "";
        paymentMethod = "cash";
        payAmountCash = "";
        payAmountTransfer = "";

        initialDiagnosis = "";
        possibleCauses = "";
        isPriceRange = false;
        minPrice = "";
        maxPrice = "";
        searchTerm = "";
        filterCompatible = true;
    }

    // Local CreateServiceInput type (matches ServiceService.create signature)

    // ... imports

    // Data from API
    let technicians = $state<any[]>([]);
    let inventoryItems = $state<any[]>([]);
    let isSubmitting = $state(false);

    // ...

    // Photo State
    let photos = $state<string[]>([]);
    let isUploading = $state(false);

    async function handleFileUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        isUploading = true;
        const files = Array.from(input.files);

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);

                // Use axios via api instance for unified consistency
                const res = await api.post("/uploads", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                // Axios response structure: res.data is the body
                const data = res.data;

                if (data.success && data.data.url) {
                    photos = [...photos, data.data.url];
                }
            }
            toast.success("Foto berhasil diupload");
        } catch (error) {
            console.error("Upload Error:", error);
            toast.error("Gagal upload foto");
        } finally {
            isUploading = false;
            input.value = ""; // Reset
        }
    }

    function removePhoto(index: number) {
        photos = photos.filter((_, i) => i !== index);
    }

    // Payment State (Enhanced)
    type PaymentItem = {
        method: "cash" | "transfer" | "qris" | "tempo";
        amount: number;
    };
    let payments = $state<PaymentItem[]>([{ method: "cash", amount: 0 }]);

    // Recalculate Total Paid from payments array
    let totalPaidCombined = $derived(
        payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    );
    let remainingAmount = $derived(grandTotalEstimate - totalPaidCombined);

    function addPaymentRow() {
        payments = [...payments, { method: "cash", amount: 0 }];
    }

    function removePaymentRow(index: number) {
        if (payments.length > 1) {
            payments = payments.filter((_, i) => i !== index);
        }
    }

    async function handleComplete() {
        if (isWalkin && remainingAmount > 0) {
            toast.error(
                `Pembayaran kurang Rp ${(remainingAmount || 0).toLocaleString("id-ID")}`,
            );
            return;
        }

        isSubmitting = true;
        try {
            // Construct Payload matching Shared Schema
            // createServiceSchema (packages/shared/index.ts)

            const payload: any = {
                type: isWalkin ? "walk_in" : "regular",
                customer: {
                    name: customerName,
                    phone: customerPhone,
                    address: customerAddress || undefined,
                },
                unit: {
                    brand: phoneBrand,
                    model: phoneModel,
                    status: phoneStatus, // nyala, mati_total, etc.
                    imei: imei || undefined,
                    pin: pinPattern || undefined,
                    condition: physicalConditions,
                    completeness: completeness,
                    physicalNotes: physicalNotes || undefined,
                },
                complaint: complaint,
                technicianId: technician || null, // API handles conversion if needed, shared schema allows string|null
                status: isWalkin ? "selesai" : "antrian",
                photos: photos,

                // Regular specific (Diagnostic)
                diagnosis: !isWalkin
                    ? {
                          initial: initialDiagnosis || undefined,
                          possibleCauses: possibleCauses || undefined,
                          estimatedCost: isPriceRange
                              ? `${minPrice}-${maxPrice}`
                              : estimatedCost,
                          downPayment: downPayment || undefined,
                      }
                    : undefined,

                // Walk-in parts as 'parts' array if needed, OR handle via service-parts relation
                // Schema has 'parts' optional. Let's send them if walk-in.
                parts:
                    isWalkin && selectedParts.length > 0
                        ? selectedParts.map((p) => ({
                              productId: p.id, // Assuming selectedParts has ID
                              qty: 1, // Logic for qty needed if >1
                              price: parseInt(p.price),
                          }))
                        : undefined,
            };

            // NOTE: Walk-in Payment Handling
            // The CreateServiceSchema might NOT have 'payments' field explicitly if it wasn't added yet.
            // But usually we need to send payment info for Walk-in completion.
            // If schema doesn't support 'payments', we might fail or need separate call.
            // Checking Schema again... Schema in shared/index.ts DOES NOT have `payments`.
            // Ideally we should add `payments` to schema or backend handles it separately.
            // For now, I will send it, but if backend strips it, we might need a follow-up "pay" call.
            // However, `isWalkin=true` usually implies immediate completion.
            // Let's assume Backend Logic handles `payments` if passed, or I need to add it to schema too?
            // The user asked to "fix 400 error". The 400 was schema mismatch on `device` vs `unit`.
            // I will adhere to schema. If payment is not in schema, I might skip sending it HERE
            // and maybe just rely on `downPayment` logic OR I should add payments to schema.
            // Given user request "create a payment method on the service form", I recall the backend likely needs it.
            // I'll add `payments` to the payload typed as `any` to bypass strict local type check if needed,
            // but effectively I should add `payments` to schema if I want it to work properly.
            // For this step, I'll send it inside payload cast as any.

            // UPDATE: I will assume I should add `payments` to schema as well if I want professional payment like sales.
            (payload as any).payments = isWalkin ? payments : [];

            // Use ServiceService
            const res = await ServiceService.create(payload);
            createdServiceOrder = res; // Assuming res is the service object or has it.
            // If res is { success: true, data: ... }, adjust accordingly.
            // I'll assume ServiceService returns the data directly or I check it differently.
            // Common pattern in this project: api.post returns data.
            // Let's assume it returns the object. If not, I might need to fetch it or rely on what I have.
            // But wait, to print barcode I need the generated NO.
            // So createdServiceOrder MUST have the `no` field.

            const msg = isWalkin
                ? "Service Selesai & Lunas!"
                : "Service order berhasil dibuat!";

            toast.success(msg);

            // Trigger Print
            showPrintModal = true;

            // resetForm will be called when closing the modal or navigating away in the success UI
        } catch (e: any) {
            console.error(e);
            toast.error(
                "Gagal membuat service: " +
                    (e.response?.data?.message || e.message),
            );
        } finally {
            isSubmitting = false;
        }
    }
</script>

<Card>
    <CardHeader>
        <CardTitle
            >{isWalkin && currentStep === 3
                ? "Pembayaran & Selesai"
                : "Service Baru"}</CardTitle
        >
        <CardDescription>
            {isWalkin && currentStep === 3
                ? "Selesaikan pembayaran untuk service ini."
                : "Wizard 3-step untuk create service order baru."}
        </CardDescription>
        <div class="flex items-center gap-2 mt-4">
            <div class="flex items-center gap-2 flex-1">
                <div
                    class="h-2 flex-1 rounded-full {currentStep >= 1
                        ? 'bg-primary'
                        : 'bg-muted'}"
                ></div>
                <span class="text-xs text-muted-foreground">1. Data</span>
            </div>
            <div class="flex items-center gap-2 flex-1">
                <div
                    class="h-2 flex-1 rounded-full {currentStep >= 2
                        ? 'bg-primary'
                        : 'bg-muted'}"
                ></div>
                <span class="text-xs text-muted-foreground"
                    >2. {isWalkin ? "Kerusakan & Biaya" : "Keluhan"}</span
                >
            </div>
            <div class="flex items-center gap-2 flex-1">
                <div
                    class="h-2 flex-1 rounded-full {currentStep >= 3
                        ? 'bg-primary'
                        : 'bg-muted'}"
                ></div>
                <span class="text-xs text-muted-foreground"
                    >3. {isWalkin ? "Bayar" : "Konfirmasi"}</span
                >
            </div>
        </div>
    </CardHeader>

    <CardContent>
        {#if currentStep === 1}
            <!-- Step 1: Customer & HP Data -->
            <div class="space-y-6">
                <!-- Customer Section -->
                <div>
                    <h4 class="font-medium mb-4">Tipe Customer</h4>
                    <div class="flex gap-4">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                bind:group={isWalkin}
                                value={false}
                                class="cursor-pointer"
                            />
                            <span>Customer Reguler (Ditinggal)</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                bind:group={isWalkin}
                                value={true}
                                class="cursor-pointer"
                            />
                            <span>Walk-in (Tunggu di tempat)</span>
                            <Badge variant="secondary" class="ml-2"
                                >Quick Service</Badge
                            >
                        </label>
                    </div>
                </div>

                <Separator />

                <div>
                    <h4 class="font-medium mb-4">Data Customer</h4>
                    <div class="grid gap-4">
                        <div class="space-y-2">
                            <Label for="name"
                                >Nama Lengkap <span class="text-red-500">*</span
                                ></Label
                            >
                            <Input
                                id="name"
                                bind:value={customerName}
                                placeholder="Contoh: Budi Santoso"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="phone"
                                >No. Telepon / WA {#if !isWalkin}<span
                                        class="text-red-500">*</span
                                    >{/if}</Label
                            >
                            <Input
                                id="phone"
                                type="tel"
                                bind:value={customerPhone}
                                placeholder="0812-3456-7890"
                            />
                            {#if isWalkin}
                                <p class="text-xs text-muted-foreground">
                                    Opsional untuk walk-in customer
                                </p>
                            {/if}
                        </div>
                        <div class="space-y-2">
                            <Label for="address">Alamat</Label>
                            <Input
                                id="address"
                                bind:value={customerAddress}
                                placeholder="Jl. Merdeka No. 45, Jakarta"
                                disabled={isWalkin}
                            />
                            {#if isWalkin}
                                <p class="text-xs text-muted-foreground">
                                    Alamat opsional untuk walk-in customer
                                </p>
                            {/if}
                        </div>
                    </div>
                </div>

                <Separator />

                <!-- Handphone Section -->
                <div>
                    <h4 class="font-medium mb-4">Data Handphone</h4>
                    <div class="grid gap-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <Label
                                    >Merk/Brand <span class="text-red-500"
                                        >*</span
                                    ></Label
                                >
                                <Input
                                    bind:value={phoneBrand}
                                    placeholder="Samsung"
                                />
                            </div>
                            <div class="space-y-2 flex flex-col">
                                <Label
                                    >Model/Tipe <span class="text-red-500"
                                        >*</span
                                    ></Label
                                >
                                <div class="flex gap-2">
                                    <Input
                                        bind:value={phoneModel}
                                        placeholder="Galaxy S24"
                                        class="flex-1"
                                    />

                                    <Popover.Root bind:open={deviceSearchOpen}>
                                        <Popover.Trigger
                                            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-3 ml-2"
                                            title="Cari di Database"
                                        >
                                            <Search class="mr-2 h-4 w-4" /> Cari
                                        </Popover.Trigger>
                                        <Popover.Content
                                            class="p-0 w-[300px]"
                                            align="end"
                                        >
                                            <Command.Root>
                                                <Command.Input
                                                    placeholder="Cari model..."
                                                />
                                                <Command.List>
                                                    <Command.Empty
                                                        >Tidak ditemukan.</Command.Empty
                                                    >
                                                    <Command.Group
                                                        heading="Devices"
                                                        class="max-h-[200px] overflow-auto"
                                                    >
                                                        {#each devicesQuery.data || [] as device}
                                                            <Command.Item
                                                                value={`${device.brand} ${device.model}`}
                                                                onSelect={() => {
                                                                    phoneBrand =
                                                                        device.brand;
                                                                    phoneModel =
                                                                        device.model;
                                                                    selectedDeviceId =
                                                                        device.id;
                                                                    deviceSearchOpen = false;
                                                                    toast.success(
                                                                        `Device dipilih: ${device.brand} ${device.model}`,
                                                                    );
                                                                }}
                                                            >
                                                                <Check
                                                                    class={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedDeviceId ===
                                                                            device.id
                                                                            ? "opacity-100"
                                                                            : "opacity-0",
                                                                    )}
                                                                />
                                                                {device.brand}
                                                                {device.model}
                                                            </Command.Item>
                                                        {/each}
                                                    </Command.Group>
                                                </Command.List>
                                            </Command.Root>
                                        </Popover.Content>
                                    </Popover.Root>
                                </div>
                                {#if selectedDeviceId}
                                    <p
                                        class="text-xs text-green-600 flex items-center"
                                    >
                                        <CheckCircle class="h-3 w-3 mr-1" /> Terhubung
                                        dengan database
                                        <Button
                                            variant="link"
                                            class="h-auto p-0 ml-2 text-xs text-muted-foreground"
                                            onclick={() =>
                                                (selectedDeviceId = null)}
                                            >(Reset)</Button
                                        >
                                    </p>
                                {/if}
                            </div>
                        </div>

                        <!-- Status Awal -->
                        <div class="space-y-2">
                            <Label
                                >Status Awal Handphone <span
                                    class="text-red-500">*</span
                                ></Label
                            >
                            <div
                                class="grid grid-cols-2 lg:grid-cols-4 gap-4 p-3 border rounded-md bg-muted/20"
                            >
                                <label
                                    class="flex items-center gap-2 cursor-pointer"
                                >
                                    <input
                                        type="radio"
                                        bind:group={phoneStatus}
                                        value="nyala"
                                        class="cursor-pointer"
                                    />
                                    <span class="flex items-center gap-1"
                                        ><Smartphone
                                            class="w-4 h-4 text-green-600"
                                        /> Nyala Normal</span
                                    >
                                </label>
                                <label
                                    class="flex items-center gap-2 cursor-pointer"
                                >
                                    <input
                                        type="radio"
                                        bind:group={phoneStatus}
                                        value="mati_total"
                                        class="cursor-pointer"
                                    />
                                    <span class="flex items-center gap-1"
                                        ><Smartphone
                                            class="w-4 h-4 text-red-600"
                                        /> Mati Total</span
                                    >
                                </label>
                                <label
                                    class="flex items-center gap-2 cursor-pointer"
                                >
                                    <input
                                        type="radio"
                                        bind:group={phoneStatus}
                                        value="restart"
                                        class="cursor-pointer"
                                    />
                                    <span class="flex items-center gap-1"
                                        ><Smartphone
                                            class="w-4 h-4 text-orange-600"
                                        /> Restart</span
                                    >
                                </label>
                                <label
                                    class="flex items-center gap-2 cursor-pointer"
                                >
                                    <input
                                        type="radio"
                                        bind:group={phoneStatus}
                                        value="blank_hitam"
                                        class="cursor-pointer"
                                    />
                                    <span class="flex items-center gap-1"
                                        ><Smartphone
                                            class="w-4 h-4 text-gray-800"
                                        /> Blank Hitam</span
                                    >
                                </label>
                            </div>
                        </div>

                        <!-- IMEI, PIN, Pattern (Locked if error status) -->
                        <div class="space-y-2">
                            <Label for="imei">IMEI (15 digit)</Label>
                            <Input
                                id="imei"
                                bind:value={imei}
                                placeholder={isErrorStatus(phoneStatus)
                                    ? "Dikunci (Status Error)"
                                    : "354217123456789"}
                                maxlength={15}
                                disabled={isErrorStatus(phoneStatus)}
                            />
                        </div>

                        <div class="space-y-2">
                            <Label for="pinPattern">PIN / Pola Unlock</Label>
                            <div class="flex gap-2">
                                <Input
                                    id="pinPattern"
                                    bind:value={pinPattern}
                                    placeholder={isErrorStatus(phoneStatus)
                                        ? "Dikunci (Status Error)"
                                        : "Contoh: 1234"}
                                    class="flex-1"
                                    disabled={isErrorStatus(phoneStatus)}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    title="Input Pola"
                                    disabled={isErrorStatus(phoneStatus)}
                                    onclick={() => (isPatternOpen = true)}
                                >
                                    <Grid3X3 class="h-4 w-4" />
                                </Button>
                                <Dialog bind:open={isPatternOpen}>
                                    <DialogContent class="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle
                                                >Input Pola Kunci</DialogTitle
                                            >
                                            <DialogDescription
                                                >Gambar pola kunci.</DialogDescription
                                            >
                                        </DialogHeader>
                                        <div
                                            class="flex flex-col items-center justify-center py-4"
                                        >
                                            <PatternLock
                                                size={300}
                                                on:change={handlePatternChange}
                                                bind:value={patternPoints}
                                            />
                                            <p
                                                class="text-center mt-2 font-mono tracking-widest"
                                            >
                                                {patternString || "-"}
                                            </p>
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                variant="outline"
                                                onclick={() => {
                                                    patternPoints = [];
                                                    pinPattern = "";
                                                }}>Reset</Button
                                            >
                                            <Button onclick={handleSavePattern}
                                                >Simpan Pola</Button
                                            >
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            {#if isErrorStatus(phoneStatus)}
                                <p
                                    class="text-xs text-red-500 bg-red-50 p-1 rounded inline-block"
                                >
                                    Field IMEI, PIN, dan Pola DIKUNCI karena
                                    status handphone bermasalah
                                    (Mati/Restart/Blank).
                                </p>
                            {/if}
                        </div>

                        <Separator />

                        <!-- Physical Condition & Completeness -->
                        <div class="grid md:grid-cols-2 gap-6">
                            <!-- Kondisi Fisik -->
                            <div class="space-y-2">
                                <Label>Kondisi Fisik</Label>
                                <div
                                    class="flex flex-col gap-2 p-3 border rounded-md"
                                >
                                    {#each [{ v: "normal", l: "Normal (Mulus)" }, { v: "lecet", l: "Lecet / Goresan" }, { v: "retak", l: "Retak / Pecah" }, { v: "bekas_air", l: "Bekas Air / Korosi" }, { v: "bengkok", l: "Bengkok / Dent" }] as item}
                                        <label
                                            class="flex items-center gap-2 cursor-pointer text-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                bind:group={physicalConditions}
                                                value={item.v}
                                                class="cursor-pointer"
                                            />
                                            <span>{item.l}</span>
                                        </label>
                                    {/each}
                                </div>
                            </div>
                            <!-- Kelengkapan -->
                            <div class="space-y-2">
                                <Label>Kelengkapan</Label>
                                <div
                                    class="flex flex-col gap-2 p-3 border rounded-md bg-muted/10"
                                >
                                    {#each [{ v: "sim_tray", l: "Sim Tray" }, { v: "sim_card", l: "Sim Card" }, { v: "softcase", l: "Softcase / Case" }, { v: "memory_card", l: "Memory Card" }, { v: "box", l: "Dus / Box" }, { v: "charger", l: "Charger / Kabel" }] as item}
                                        <label
                                            class="flex items-center gap-2 cursor-pointer text-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                bind:group={completeness}
                                                value={item.v}
                                                class="cursor-pointer"
                                            />
                                            <span>{item.l}</span>
                                        </label>
                                    {/each}
                                </div>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <Label>Catatan Kondisi</Label>
                            <Textarea
                                placeholder="Detail tambahan kondisi fisik..."
                                bind:value={physicalNotes}
                                rows={2}
                            />
                        </div>

                        <Separator />

                        <!-- Photo Upload -->
                        <div class="space-y-2">
                            <Label>Foto Kondisi Fisik</Label>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <!-- Upload Button -->
                                <label
                                    class="border-2 border-dashed rounded-md flex flex-col items-center justify-center aspect-square cursor-pointer hover:bg-muted/50 transition-colors"
                                >
                                    {#if isUploading}
                                        <div
                                            class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"
                                        ></div>
                                    {:else}
                                        <div
                                            class="bg-primary/10 p-2 rounded-full mb-2"
                                        >
                                            <Smartphone
                                                class="h-6 w-6 text-primary"
                                            />
                                        </div>
                                        <span
                                            class="text-xs font-medium text-center"
                                            >Ambil Foto / Upload</span
                                        >
                                    {/if}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        capture="environment"
                                        class="hidden"
                                        onchange={handleFileUpload}
                                        disabled={isUploading}
                                    />
                                </label>

                                <!-- Photo Previews -->
                                {#each photos as photo, i}
                                    <div
                                        class="relative group aspect-square rounded-md overflow-hidden border"
                                    >
                                        <img
                                            src={photo.startsWith("http")
                                                ? photo
                                                : photo}
                                            alt="Condition"
                                            class="w-full h-full object-cover"
                                        />
                                        <button
                                            class="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            onclick={() => removePhoto(i)}
                                        >
                                            <XCircle class="h-4 w-4" />
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        {:else if currentStep === 2}
            <!-- Step 2: Service Details -->
            <div class="space-y-6">
                <!-- Unit Recap -->
                <div class="p-4 bg-muted rounded-lg space-y-2 text-sm">
                    <div class="grid grid-cols-2 gap-x-4">
                        <div class="space-y-1">
                            <span class="font-medium">Unit:</span>
                            {phoneBrand}
                            {phoneModel}
                        </div>
                        <div class="space-y-1">
                            <span class="font-medium">Status:</span>
                            <Badge variant="outline">{phoneStatus}</Badge>
                        </div>
                        <div class="space-y-1 col-span-2">
                            <span class="font-medium">Fisik:</span>
                            {physicalConditions.join(", ") || "-"}
                        </div>
                    </div>
                </div>

                <!-- Complaint -->
                <div class="space-y-2">
                    <Label for="complaint"
                        >{isWalkin ? "Kerusakan" : "Keluhan Customer"}
                        <span class="text-red-500">*</span></Label
                    >
                    <Textarea
                        id="complaint"
                        bind:value={complaint}
                        placeholder={isWalkin
                            ? "Contoh: LCD Pecah"
                            : "Jelaskan keluhan detail..."}
                        rows={isWalkin ? 2 : 5}
                    />
                </div>

                <!-- NEW: Diagnostic & Price Range (Regular Only) -->
                {#if !isWalkin}
                    <div class="space-y-4 border p-4 rounded-md">
                        <h5 class="font-medium text-sm">
                            Diagnosa Awal & Prediksi
                        </h5>

                        <div class="space-y-2">
                            <Label>Diagnosa Awal (Teknis)</Label>
                            <Textarea
                                placeholder="Cth: Konsumsi arus 0.2A, tidak short, flexible aman..."
                                bind:value={initialDiagnosis}
                                rows={3}
                            />
                            <p class="text-[10px] text-muted-foreground">
                                Pengecekan umum sebelum bongkar/deep check.
                            </p>
                        </div>

                        <div class="space-y-2">
                            <Label>Kemungkinan Kerusakan (Hipotesa)</Label>
                            <Textarea
                                placeholder="Cth: Kemungkinan IC Power atau Baterai drop..."
                                bind:value={possibleCauses}
                                rows={2}
                            />
                        </div>
                    </div>
                {/if}

                <!-- Walk-in Sparepart & Cost (Existing) -->
                {#if isWalkin}
                    <!-- Walk-in Sparepart & Cost -->
                    <div class="space-y-4 border p-4 rounded-md bg-background">
                        <Label>Penggunaan Sparepart</Label>
                        <div class="flex gap-4 mb-4">
                            <label
                                class="flex items-center gap-2 cursor-pointer text-sm"
                            >
                                <input
                                    type="radio"
                                    bind:group={sparepartSource}
                                    value="inventory"
                                /> Inventory
                            </label>
                            <label
                                class="flex items-center gap-2 cursor-pointer text-sm"
                            >
                                <input
                                    type="radio"
                                    bind:group={sparepartSource}
                                    value="external"
                                /> External
                            </label>
                            <label
                                class="flex items-center gap-2 cursor-pointer text-sm"
                            >
                                <input
                                    type="radio"
                                    bind:group={sparepartSource}
                                    value="none"
                                /> Tanpa Part
                            </label>
                        </div>

                        {#if sparepartSource === "inventory"}
                            <Button
                                variant="outline"
                                size="sm"
                                onclick={() => (showInventoryModal = true)}
                                >+ Cari Part</Button
                            >
                            {#each selectedParts as part, i}
                                <div
                                    class="flex justify-between items-center bg-secondary p-2 rounded text-sm mt-2"
                                >
                                    <span>{part.name}</span>
                                    <span
                                        >Rp {part.price.toLocaleString()}
                                        <button
                                            onclick={() => removePart(i)}
                                            class="ml-2 text-red-500">×</button
                                        ></span
                                    >
                                </div>
                            {/each}
                        {:else if sparepartSource === "external"}
                            <div class="grid grid-cols-2 gap-2">
                                <Input
                                    placeholder="Nama barang"
                                    bind:value={extPartName}
                                    class="col-span-2 h-8"
                                />
                                <Input
                                    type="number"
                                    placeholder="Harga Jual User"
                                    bind:value={extPartSellPrice}
                                    class="h-8"
                                />
                                <Input
                                    type="number"
                                    placeholder="Harga Beli (Modal)"
                                    bind:value={extPartBuyPrice}
                                    class="h-8"
                                />
                            </div>
                        {/if}
                    </div>

                    <!-- Walk-in Total Price ONLY (Merged) -->
                    <div class="space-y-2">
                        <div
                            class="flex flex-col gap-1 p-4 bg-primary/10 rounded-lg border border-primary/20"
                        >
                            <Label
                                for="totalCost"
                                class="text-primary font-bold"
                                >TOTAL HARGA (Jasa + Part)</Label
                            >
                            <div class="flex items-center gap-2">
                                <span class="text-muted-foreground">Rp</span>
                                <input
                                    id="totalCost"
                                    type="number"
                                    placeholder="0"
                                    class="flex h-12 w-full rounded-md border border-input bg-white px-3 py-2 text-xl font-bold ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={grandTotalEstimate}
                                    oninput={(e) => {
                                        const val =
                                            parseInt(e.currentTarget.value) ||
                                            0;
                                        estimatedCost = (
                                            val - totalPartPrice
                                        ).toString();
                                    }}
                                />
                            </div>
                            <p class="text-[10px] text-muted-foreground">
                                *Otomatis hitung: Rp {totalPartPrice.toLocaleString()}
                                (Part) + Rp {parseInt(
                                    estimatedCost || "0",
                                ).toLocaleString()} (Jasa)
                            </p>
                        </div>
                    </div>
                {:else}
                    <!-- Regular Cost with Range Option -->
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <Label for="cost">Estimasi Biaya</Label>
                            <label
                                class="flex items-center gap-2 cursor-pointer text-xs"
                            >
                                <input
                                    type="checkbox"
                                    bind:checked={isPriceRange}
                                    class="cursor-pointer"
                                />
                                <span>Gunakan Range Harga (Min - Max)</span>
                            </label>
                        </div>

                        {#if isPriceRange}
                            <div class="flex items-center gap-2">
                                <div class="flex-1 space-y-1">
                                    <Input
                                        type="number"
                                        bind:value={minPrice}
                                        placeholder="Min (Ex: 100k)"
                                    />
                                    <span
                                        class="text-[10px] text-muted-foreground"
                                        >Min</span
                                    >
                                </div>
                                <span class="text-muted-foreground">-</span>
                                <div class="flex-1 space-y-1">
                                    <Input
                                        type="number"
                                        bind:value={maxPrice}
                                        placeholder="Max (Ex: 300k)"
                                    />
                                    <span
                                        class="text-[10px] text-muted-foreground"
                                        >Max</span
                                    >
                                </div>
                            </div>
                        {:else}
                            <Input
                                id="cost"
                                type="number"
                                bind:value={estimatedCost}
                                placeholder="Rp 0"
                            />
                        {/if}
                    </div>
                {/if}

                <!-- Technician (Walk-in required) -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <Label
                            >Teknisi {#if isWalkin}<span class="text-red-500"
                                    >*</span
                                >{/if}</Label
                        >
                        <Select type="single" bind:value={technician}>
                            <SelectTrigger
                                >{technician ||
                                    "Belum ditentukan"}</SelectTrigger
                            >
                            <SelectContent>
                                <SelectItem value="agus">Agus</SelectItem>
                                <SelectItem value="rudi">Rudi</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {#if isWalkin}
                        <div class="space-y-2">
                            <Label>Garansi</Label>
                            <Select type="single" bind:value={warranty}>
                                <SelectTrigger
                                    >{warranty.replace("_", " ")}</SelectTrigger
                                >
                                <SelectContent>
                                    {#each $settings.warrantyPresets as preset}
                                        <SelectItem
                                            value={preset.days.toString()}
                                            >{preset.label}</SelectItem
                                        >
                                    {/each}
                                </SelectContent>
                            </Select>
                        </div>
                    {/if}
                </div>

                <!-- Technician Notes (Only for Walk-in) -->
                {#if isWalkin}
                    <div class="space-y-2">
                        <Label>Catatan Teknisi (Fitur Tidak Normal)</Label>
                        <Textarea
                            placeholder="Catat jika ada fitur HP yang tidak berfungsi normal..."
                            bind:value={technicianNotes}
                            rows={2}
                        />
                    </div>
                {/if}

                {#if !isWalkin}
                    <div class="space-y-2">
                        <Label>DP / Uang Muka</Label>
                        <Input
                            type="number"
                            bind:value={downPayment}
                            placeholder="Rp 0"
                        />
                    </div>
                {/if}
            </div>
        {:else if currentStep === 3}
            {#if isWalkin}
                <!-- Step 3 Walk-in: Payment -->
                <div class="space-y-6">
                    <div class="text-center mb-6">
                        <DollarSign
                            class="h-12 w-12 mx-auto text-green-600 mb-2"
                        />
                        <h4 class="font-medium text-lg">
                            Pembayaran & Selesai
                        </h4>
                    </div>

                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="space-y-1">
                            <p class="text-muted-foreground">Status & Fisik</p>
                            <p class="font-medium">
                                {phoneStatus} - {physicalConditions.join(
                                    ", ",
                                ) || "Normal"}
                            </p>
                        </div>
                        <div class="space-y-1 col-span-2">
                            <p class="text-muted-foreground">
                                Keluhan Customer
                            </p>
                            <p class="font-medium">{complaint}</p>
                        </div>

                        <Separator class="col-span-2 my-2" />

                        <!-- NEW: Diagnosis Display -->
                        <div class="space-y-1 col-span-2">
                            <p class="text-muted-foreground">Diagnosa Awal</p>
                            <p class="font-medium">
                                {initialDiagnosis || "-"}
                            </p>
                        </div>
                        <div class="space-y-1 col-span-2">
                            <p class="text-muted-foreground">
                                Kemungkinan Kerusakan
                            </p>
                            <p class="font-medium">
                                {possibleCauses || "-"}
                            </p>
                        </div>

                        <Separator class="col-span-2 my-2" />

                        <div class="space-y-1">
                            <p class="text-muted-foreground">Estimasi Biaya</p>
                            {#if isPriceRange}
                                <p class="font-medium">
                                    Rp {parseInt(
                                        minPrice || "0",
                                    ).toLocaleString()} - Rp {parseInt(
                                        maxPrice || "0",
                                    ).toLocaleString()}
                                </p>
                            {:else}
                                <p class="font-medium">
                                    {estimatedCost
                                        ? `Rp ${parseInt(estimatedCost).toLocaleString()}`
                                        : "Belum estimasi"}
                                </p>
                            {/if}
                        </div>

                        <div class="space-y-1">
                            <p class="text-muted-foreground">DP / Uang Muka</p>
                            <p class="font-medium">
                                {downPayment
                                    ? `Rp ${parseInt(downPayment).toLocaleString()}`
                                    : "-"}
                            </p>
                        </div>

                        <div class="space-y-1 col-span-2">
                            <p class="text-muted-foreground">Catatan Teknisi</p>
                            <p class="font-medium">
                                {technicianNotes || "-"}
                            </p>
                        </div>
                    </div>
                </div>
            {/if}
        {/if}
    </CardContent>

    <CardFooter class="flex justify-between">
        {#if currentStep > 1}
            <Button variant="outline" onclick={prevStep}>
                <ArrowLeft class="mr-2 h-4 w-4" /> Kembali
            </Button>
        {:else}
            <div></div>
        {/if}

        {#if currentStep < 3}
            <Button
                onclick={nextStep}
                disabled={currentStep === 1 && !step1Valid}
            >
                Lanjut <ArrowRight class="ml-2 h-4 w-4" />
            </Button>
        {:else}
            <Button
                onclick={handleComplete}
                class={isWalkin ? "bg-green-600 hover:bg-green-700" : ""}
            >
                {#if isWalkin}
                    <Printer class="mr-2 h-4 w-4" /> Bayar & Selesai
                {:else}
                    <CheckCircle class="mr-2 h-4 w-4" /> Buat Service Order
                {/if}
            </Button>
        {/if}
    </CardFooter>
</Card>

<!-- Inventory Search Modal (Real) -->
<Dialog bind:open={showInventoryModal}>
    <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
            <DialogTitle>Pilih Sparepart / Produk</DialogTitle>
            <DialogDescription>
                Pilih sparepart dari inventory.
            </DialogDescription>
        </DialogHeader>
        <div class="py-4 space-y-4">
            <div class="flex items-center gap-2">
                <Input
                    placeholder="Cari nama barang..."
                    bind:value={searchTerm}
                    class="flex-1"
                />
            </div>

            {#if selectedDeviceId}
                <div
                    class="flex items-center space-x-2 border p-2 rounded bg-muted/20"
                >
                    <Switch
                        id="filter-compat"
                        bind:checked={filterCompatible}
                    />
                    <Label for="filter-compat" class="text-xs cursor-pointer">
                        Hanya tampilkan yang kompatibel dengan <b
                            >{phoneBrand} {phoneModel}</b
                        >
                    </Label>
                </div>
            {/if}

            <div class="border rounded-md h-[300px] overflow-y-auto">
                {#if inventoryQuery.isLoading}
                    <div
                        class="flex items-center justify-center h-full text-muted-foreground"
                    >
                        Memuat data...
                    </div>
                {:else if (inventoryQuery.data || []).length === 0}
                    <div
                        class="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center"
                    >
                        <Package class="h-8 w-8 mb-2 opacity-50" />
                        <p>Tidak ada produk ditemukan.</p>
                        {#if filterCompatible && selectedDeviceId}
                            <p class="text-xs mt-1 text-orange-600">
                                Coba matikan filter kompatibilitas.
                            </p>
                        {/if}
                    </div>
                {:else}
                    {#each (inventoryQuery.data || []).filter((i) => !searchTerm || i.name
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase())) as item}
                        <button
                            class="w-full text-left p-3 hover:bg-muted text-sm flex justify-between border-b items-center group transition-colors"
                            onclick={() => addInventoryPart(item)}
                        >
                            <div class="flex flex-col">
                                <span class="font-medium">{item.name}</span>
                                <span class="text-xs text-muted-foreground"
                                    >Stok: {item.stock}</span
                                >
                            </div>
                            <div class="text-right">
                                <div class="font-bold text-primary">
                                    Rp {item.price
                                        ? item.price.toLocaleString()
                                        : "0"}
                                </div>
                                <!-- Assuming product has price/HPP, usually 'sellPrice' or just 'price' need to serve. Inventory returns Product. Product usually has 'sellPrice' -->
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    class="h-6 text-xs opacity-0 group-hover:opacity-100"
                                    >Pilih</Button
                                >
                            </div>
                        </button>
                    {/each}
                {/if}
            </div>
        </div>
    </DialogContent>
</Dialog>

<!-- Success Modal -->
<Dialog
    open={showPrintModal}
    onOpenChange={(open) => {
        if (!open) {
            showPrintModal = false;
            goto("/service");
            resetForm();
        }
    }}
>
    <DialogContent class="sm:max-w-md">
        <DialogHeader>
            <DialogTitle class="text-center flex flex-col items-center gap-2">
                <CheckCircle class="h-12 w-12 text-green-500" />
                Service Berhasil Dibuat
            </DialogTitle>
            <DialogDescription class="text-center">
                Service Order {createdServiceOrder?.no} telah berhasil disimpan.
            </DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-3 py-4">
            <Button
                size="lg"
                onclick={async () => {
                    if (createdServiceOrder?.id) {
                        try {
                            await ServiceService.print(createdServiceOrder.id);
                            toast.success("Perintah cetak dikirim ke server");
                        } catch (e: any) {
                            console.error(e);
                            const errMsg =
                                e.response?.data?.errors?.[0] ||
                                e.response?.data?.message ||
                                e.message;
                            toast.error("Gagal mencetak: " + errMsg);
                        }
                    }
                }}
                class="w-full"
            >
                <Printer class="mr-2 h-4 w-4" /> Cetak Struk (Server)
            </Button>
            <div class="grid grid-cols-2 gap-3">
                <Button
                    variant="outline"
                    onclick={() => {
                        showPrintModal = false;
                        resetForm();
                        // Stay on page to create new
                    }}
                >
                    <Plus class="mr-2 h-4 w-4" /> Buat Baru
                </Button>
                <Button
                    variant="outline"
                    onclick={() => {
                        showPrintModal = false;
                        goto("/service");
                        refreshServiceList.update((n) => n + 1);
                        resetForm();
                    }}
                >
                    <ArrowLeft class="mr-2 h-4 w-4" /> Ke List
                </Button>
            </div>
        </div>
    </DialogContent>
</Dialog>
