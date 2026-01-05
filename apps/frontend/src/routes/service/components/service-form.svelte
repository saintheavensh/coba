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
    import PatternLock from "$lib/components/ui/pattern-lock.svelte";

    // Form state
    let currentStep = 1;

    // Step 1: Customer & HP Data
    let isWalkin = false;
    let customerName = "";
    let customerPhone = "";
    let customerAddress = "";
    let phoneBrand = "";
    let phoneModel = "";

    // HP Condition
    let phoneStatus = "nyala";
    let imei = "";
    let physicalConditions: string[] = [];
    let completeness: string[] = [];
    let physicalNotes = "";
    let pinPattern = "";

    // Pattern Lock Modal
    let isPatternOpen = false;
    let patternPoints: number[] = [];
    $: patternString =
        patternPoints.length > 0
            ? patternPoints.map((p) => p + 1).join("-")
            : "";

    // Step 2: Service Details
    let complaint = "";
    let technician = "";
    let estimatedCost = "";
    let downPayment = "";
    let warranty = "none";
    let technicianNotes = ""; // New Field

    // Regular Service Specifics (NEW)
    let initialDiagnosis = ""; // Diagnosa Awal (Cek Arus dll)
    let possibleCauses = ""; // Kemungkinan Kerusakan
    let isPriceRange = false; // Toggle Range Price
    let minPrice = "";
    let maxPrice = "";

    // Walk-in Sparepart Logic
    let sparepartSource = "none";
    let selectedParts: any[] = [];
    const mockInventory = [
        { id: 1, name: "LCD Samsung A50 Original", stock: 5, price: 450000 },
        { id: 2, name: "Baterai Xiaomi BN45", stock: 10, price: 120000 },
        { id: 3, name: "Connector Cas Type-C", stock: 50, price: 15000 },
        { id: 4, name: "Tempered Glass Universal", stock: 100, price: 10000 },
    ];
    let showInventoryModal = false;
    let searchTerm = "";

    // External Part Data
    let extPartName = "";
    let extPartBuyPrice = "";
    let extPartSellPrice = "";

    // Payment State (Step 3 Walk-in)
    let paymentMethod = "cash"; // cash, transfer, split
    let payAmountCash = "";
    let payAmountTransfer = "";

    // Computed Totals
    $: totalPartPrice =
        selectedParts.reduce((sum, p) => sum + (parseInt(p.price) || 0), 0) +
        (sparepartSource === "external" ? parseInt(extPartSellPrice) || 0 : 0);
    $: serviceFee = parseInt(estimatedCost) || 0;
    $: grandTotalEstimate = serviceFee + totalPartPrice;

    // Split Payment Logic
    $: splitTransferAmount =
        paymentMethod === "split"
            ? grandTotalEstimate - (parseInt(payAmountCash) || 0)
            : 0;
    $: {
        if (paymentMethod === "split") {
            // Auto calculate transfer amount if cash is entered, but let user edit too if needed logic (simplified here)
            // For UX, maybe just show remaining needed for transfer.
        }
    }

    $: totalPaid =
        paymentMethod === "split"
            ? (parseInt(payAmountCash) || 0) +
              (parseInt(payAmountTransfer) || 0)
            : paymentMethod === "transfer"
              ? parseInt(payAmountTransfer) || 0
              : parseInt(payAmountCash) || 0;

    $: changeAmount = totalPaid - grandTotalEstimate;

    // Validation
    const isErrorStatus = (status: string) =>
        ["mati_total", "restart", "blank_hitam"].includes(status);

    $: step1Valid =
        customerName.trim() !== "" &&
        (isWalkin || customerPhone.trim() !== "") &&
        phoneBrand.trim() !== "" &&
        phoneModel.trim() !== "" &&
        phoneStatus.trim() !== "";

    $: step2Valid =
        complaint &&
        complaint.trim().length > 0 &&
        (!isWalkin || technician !== "");

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
    }

    function handleComplete() {
        if (isWalkin && totalPaid < grandTotalEstimate) {
            toast.error("Pembayaran kurang dari total tagihan!");
            return;
        }

        const msg = isWalkin
            ? "Service Selesai & Lunas!"
            : "Service order berhasil dibuat!";
        toast.success(msg, {
            description: `No. SRV-2026-NEW - ${customerName}`,
        });

        setTimeout(() => {
            goto("/service");
            resetForm();
        }, 1500);
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
                                <Label for="brand"
                                    >Merk/Brand <span class="text-red-500"
                                        >*</span
                                    ></Label
                                >
                                <Input
                                    id="brand"
                                    bind:value={phoneBrand}
                                    placeholder="Samsung"
                                />
                            </div>
                            <div class="space-y-2">
                                <Label for="model"
                                    >Model/Tipe <span class="text-red-500"
                                        >*</span
                                    ></Label
                                >
                                <Input
                                    id="model"
                                    bind:value={phoneModel}
                                    placeholder="Galaxy S24"
                                />
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
                                <Dialog bind:open={isPatternOpen}>
                                    <DialogTrigger
                                        disabled={isErrorStatus(phoneStatus)}
                                    >
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            title="Input Pola"
                                            disabled={isErrorStatus(
                                                phoneStatus,
                                            )}
                                        >
                                            <Grid3X3 class="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
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
                    <!-- Reguler Cost -->
                    <div class="space-y-2">
                        <Label for="cost">Estimasi Biaya Jasa</Label>
                        <Input
                            id="cost"
                            type="number"
                            bind:value={estimatedCost}
                            placeholder="Rp 0"
                        />
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
                                    <SelectItem value="none"
                                        >Tidak ada</SelectItem
                                    >
                                    <SelectItem value="1_minggu"
                                        >1 Minggu</SelectItem
                                    >
                                    <SelectItem value="1_bulan"
                                        >1 Bulan</SelectItem
                                    >
                                </SelectContent>
                            </Select>
                        </div>
                    {/if}
                </div>

                <!-- Technician Notes (New Field) -->
                <div class="space-y-2">
                    <Label>Catatan Teknisi (Fitur Tidak Normal)</Label>
                    <Textarea
                        placeholder="Catat jika ada fitur HP yang tidak berfungsi normal..."
                        bind:value={technicianNotes}
                        rows={2}
                    />
                </div>

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
                        <!-- Bill Info -->
                        <Card class="h-fit">
                            <CardHeader
                                ><CardTitle class="text-base"
                                    >Rincian Tagihan</CardTitle
                                ></CardHeader
                            >
                            <CardContent class="text-sm space-y-2">
                                <div class="flex justify-between">
                                    <span>Customer</span>
                                    <span class="font-medium"
                                        >{customerName}</span
                                    >
                                </div>
                                <div class="flex justify-between">
                                    <span>Unit</span>
                                    <span class="font-medium"
                                        >{phoneBrand} {phoneModel}</span
                                    >
                                </div>
                                <Separator class="my-2" />
                                <div class="flex justify-between">
                                    <span>Sparepart</span>
                                    <span
                                        >Rp {totalPartPrice.toLocaleString()}</span
                                    >
                                </div>
                                <div class="flex justify-between">
                                    <span>Jasa Service</span>
                                    <span>Rp {serviceFee.toLocaleString()}</span
                                    >
                                </div>
                                <Separator class="my-2" />
                                <div
                                    class="flex justify-between text-lg font-bold text-primary"
                                >
                                    <span>TOTAL</span>
                                    <span
                                        >Rp {grandTotalEstimate.toLocaleString()}</span
                                    >
                                </div>
                            </CardContent>
                        </Card>

                        <!-- Payment Form -->
                        <div class="space-y-4">
                            <div class="space-y-2">
                                <Label>Metode Pembayaran</Label>
                                <div class="flex gap-2">
                                    <Button
                                        variant={paymentMethod === "cash"
                                            ? "default"
                                            : "outline"}
                                        onclick={() => (paymentMethod = "cash")}
                                        class="flex-1">Cash</Button
                                    >
                                    <Button
                                        variant={paymentMethod === "transfer"
                                            ? "default"
                                            : "outline"}
                                        onclick={() =>
                                            (paymentMethod = "transfer")}
                                        class="flex-1">Transfer</Button
                                    >
                                    <Button
                                        variant={paymentMethod === "split"
                                            ? "default"
                                            : "outline"}
                                        onclick={() =>
                                            (paymentMethod = "split")}
                                        class="flex-1">Split</Button
                                    >
                                </div>
                            </div>

                            {#if paymentMethod === "cash"}
                                <div class="space-y-2">
                                    <Label>Nominal Cash (Rp)</Label>
                                    <Input
                                        type="number"
                                        bind:value={payAmountCash}
                                        class="h-12 text-lg"
                                        placeholder="0"
                                    />
                                </div>
                            {:else if paymentMethod === "transfer"}
                                <div class="space-y-2">
                                    <Label>Nominal Transfer (Rp)</Label>
                                    <Input
                                        type="number"
                                        bind:value={payAmountTransfer}
                                        class="h-12 text-lg"
                                        placeholder="0"
                                    />
                                </div>
                            {:else if paymentMethod === "split"}
                                <div
                                    class="grid gap-3 p-3 bg-muted rounded-md border"
                                >
                                    <div class="space-y-1">
                                        <Label>Transfer (Sebagian)</Label>
                                        <Input
                                            type="number"
                                            bind:value={payAmountTransfer}
                                            placeholder="Contoh: 200000"
                                        />
                                    </div>
                                    <div class="space-y-1">
                                        <Label>Cash (Sisa)</Label>
                                        <Input
                                            type="number"
                                            bind:value={payAmountCash}
                                            placeholder="Sisa tagihan..."
                                        />
                                    </div>
                                </div>
                            {/if}

                            <!-- Change Display -->
                            <div
                                class="p-4 bg-secondary rounded-lg text-center space-y-1"
                            >
                                <p class="text-sm text-muted-foreground">
                                    Total Bayar: Rp {totalPaid.toLocaleString()}
                                </p>
                                <p
                                    class="text-lg font-bold {changeAmount >= 0
                                        ? 'text-green-600'
                                        : 'text-red-500'}"
                                >
                                    {changeAmount >= 0
                                        ? "Kembalian"
                                        : "Kurang"}: Rp {Math.abs(
                                        changeAmount,
                                    ).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            {:else}
                <!-- Step 3 Reguler: Confirmation -->
                <div class="space-y-6">
                    <div class="text-center mb-6">
                        <CheckCircle
                            class="h-12 w-12 mx-auto text-green-600 mb-2"
                        />
                        <h4 class="font-medium text-lg">
                            Konfirmasi Service Order
                        </h4>
                    </div>
                    <Card>
                        <CardHeader
                            ><CardTitle class="text-base"
                                >Service Summary</CardTitle
                            ></CardHeader
                        >
                        <CardContent class="grid md:grid-cols-2 gap-4 text-sm">
                            <div class="space-y-1">
                                <p class="text-muted-foreground">Unit</p>
                                <p class="font-medium">
                                    {phoneBrand}
                                    {phoneModel}
                                </p>
                            </div>
                            <div class="space-y-1">
                                <p class="text-muted-foreground">
                                    Status & Fisik
                                </p>
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
                                <p class="text-muted-foreground">
                                    Diagnosa Awal
                                </p>
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
                                <p class="text-muted-foreground">
                                    Estimasi Biaya
                                </p>
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
                                <p class="text-muted-foreground">
                                    DP / Uang Muka
                                </p>
                                <p class="font-medium">
                                    {downPayment
                                        ? `Rp ${parseInt(downPayment).toLocaleString()}`
                                        : "-"}
                                </p>
                            </div>

                            <div class="space-y-1 col-span-2">
                                <p class="text-muted-foreground">
                                    Catatan Teknisi
                                </p>
                                <p class="font-medium">
                                    {technicianNotes || "-"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
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

<!-- Inventory Search Modal (Mock) -->
<Dialog bind:open={showInventoryModal}>
    <DialogContent class="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>Pilih Sparepart</DialogTitle></DialogHeader>
        <div class="py-4 space-y-4">
            <Input placeholder="Cari nama barang..." bind:value={searchTerm} />
            <div class="border rounded-md max-h-[200px] overflow-y-auto">
                {#each mockInventory.filter((i) => i.name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())) as item}
                    <button
                        class="w-full text-left p-3 hover:bg-muted text-sm flex justify-between border-b"
                        onclick={() => addInventoryPart(item)}
                    >
                        <span>{item.name}</span>
                        <span class="font-bold"
                            >Rp {item.price.toLocaleString()}</span
                        >
                    </button>
                {/each}
            </div>
        </div>
    </DialogContent>
</Dialog>
