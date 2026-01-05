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

    // Walk-in Sparepart Logic
    let sparepartSource = "none"; // none, inventory, external
    let selectedParts: any[] = [];
    // Mock Inventory Data
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

    // Computed Totals
    $: totalPartPrice =
        selectedParts.reduce((sum, p) => sum + (parseInt(p.price) || 0), 0) +
        (sparepartSource === "external" ? parseInt(extPartSellPrice) || 0 : 0);
    $: grandTotalEstimate = (parseInt(estimatedCost) || 0) + totalPartPrice;

    // Validation
    const isStatusImeiOptional = (status: string) =>
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
        (!isWalkin || technician !== ""); // Technician required for Walk-in

    function nextStep() {
        if (currentStep === 1 && !step1Valid) {
            toast.error("Harap isi semua field yang wajib");
            return;
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

    function handleSubmit() {
        toast.success("Service order berhasil dibuat!", {
            description: `No. SRV-2026-NEW - ${customerName}`,
        });

        setTimeout(() => {
            goto("/service");
        }, 1500);
    }
</script>

<Card>
    <CardHeader>
        <CardTitle>Service Baru</CardTitle>
        <CardDescription>
            Wizard 3-step untuk create service order baru.
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
                <span class="text-xs text-muted-foreground">3. Konfirmasi</span>
            </div>
        </div>
    </CardHeader>

    <CardContent>
        {#if currentStep === 1}
            <!-- Step 1: Customer & HP Data (UNCHANGED) -->
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
                                >Quick Service (Langsung Selesai)</Badge
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

                        <!-- IMEI -->
                        <div class="space-y-2">
                            <Label for="imei">IMEI (15 digit)</Label>
                            <Input
                                id="imei"
                                bind:value={imei}
                                placeholder={isStatusImeiOptional(phoneStatus)
                                    ? "Kosongkan jika tidak ada"
                                    : "354217123456789"}
                                maxlength={15}
                                disabled={isStatusImeiOptional(phoneStatus)}
                            />
                            <p class="text-xs text-muted-foreground">
                                {isStatusImeiOptional(phoneStatus)
                                    ? "IMEI tidak perlu diisi untuk status ini"
                                    : "Opsional - Masukkan IMEI jika tersedia"}
                            </p>
                        </div>

                        <!-- PIN / Pattern -->
                        <div class="space-y-2">
                            <Label for="pinPattern">PIN / Pola Unlock</Label>
                            <div class="flex gap-2">
                                <Input
                                    id="pinPattern"
                                    bind:value={pinPattern}
                                    placeholder="Contoh: 1234 atau 1-2-3-5"
                                    class="flex-1"
                                />
                                <Dialog bind:open={isPatternOpen}>
                                    <DialogTrigger>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            title="Input Pola"
                                        >
                                            <Grid3X3 class="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent class="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle
                                                >Input Pola Kunci</DialogTitle
                                            >
                                            <DialogDescription>
                                                Gambar pola kunci pada grid di
                                                bawah ini.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div
                                            class="flex flex-col items-center justify-center py-4"
                                        >
                                            <PatternLock
                                                size={300}
                                                on:change={handlePatternChange}
                                                bind:value={patternPoints}
                                            />
                                            <div class="mt-4 text-center">
                                                <p class="text-sm font-medium">
                                                    Urutan Titik (1-9):
                                                </p>
                                                <p
                                                    class="text-lg font-mono tracking-widest"
                                                >
                                                    {patternString || "-"}
                                                </p>
                                            </div>
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
                            <Badge
                                variant="outline"
                                class="uppercase text-[10px] scale-90 origin-left"
                                >{phoneStatus.replace(/_/g, " ")}</Badge
                            >
                        </div>
                        <div class="space-y-1 col-span-2">
                            <span class="font-medium">Fisik:</span>
                            {physicalConditions.length > 0
                                ? physicalConditions
                                      .join(", ")
                                      .replace(/_/g, " ")
                                : "-"}
                        </div>
                        <div class="space-y-1 col-span-2">
                            <span class="font-medium">Kelengkapan:</span>
                            {completeness.length > 0
                                ? completeness.join(", ").replace(/_/g, " ")
                                : "-"}
                        </div>
                    </div>
                </div>

                <!-- Complaint -->
                <div class="space-y-2">
                    <Label for="complaint">
                        {isWalkin ? "Kerusakan" : "Keluhan Customer"}
                        <span class="text-red-500">*</span>
                    </Label>
                    <Textarea
                        id="complaint"
                        bind:value={complaint}
                        placeholder={isWalkin
                            ? "Contoh: LCD Pecah, ganti LCD Fullset"
                            : "Jelaskan keluhan detail..."}
                        rows={isWalkin ? 2 : 5}
                        maxlength={500}
                    />
                </div>

                <!-- Walk-in Sparepart Selection (NEW) -->
                {#if isWalkin}
                    <div class="space-y-4 border p-4 rounded-md">
                        <Label>Penggunaan Sparepart</Label>
                        <div class="flex gap-4">
                            <label
                                class="flex items-center gap-2 cursor-pointer text-sm"
                            >
                                <input
                                    type="radio"
                                    bind:group={sparepartSource}
                                    value="inventory"
                                    class="cursor-pointer"
                                />
                                <Package class="w-4 h-4" /> Inventory Toko
                            </label>
                            <label
                                class="flex items-center gap-2 cursor-pointer text-sm"
                            >
                                <input
                                    type="radio"
                                    bind:group={sparepartSource}
                                    value="external"
                                    class="cursor-pointer"
                                />
                                <ShoppingCart class="w-4 h-4" /> Beli Luar (External)
                            </label>
                            <label
                                class="flex items-center gap-2 cursor-pointer text-sm"
                            >
                                <input
                                    type="radio"
                                    bind:group={sparepartSource}
                                    value="none"
                                    class="cursor-pointer"
                                />
                                <XCircle class="w-4 h-4" /> Tanpa Sparepart
                            </label>
                        </div>

                        <!-- Option: Inventory -->
                        {#if sparepartSource === "inventory"}
                            <div class="space-y-2">
                                <Button
                                    variant="outline"
                                    class="w-full justify-start"
                                    onclick={() => (showInventoryModal = true)}
                                >
                                    <Search class="mr-2 h-4 w-4" /> Cari Sparepart
                                    di Inventory...
                                </Button>

                                <!-- Selected Inventory Parts List -->
                                {#if selectedParts.length > 0}
                                    <div class="space-y-2 mt-2">
                                        {#each selectedParts as part, i}
                                            <div
                                                class="flex justify-between items-center bg-secondary p-2 rounded text-sm"
                                            >
                                                <span>{part.name}</span>
                                                <div
                                                    class="flex items-center gap-2"
                                                >
                                                    <span class="font-medium"
                                                        >Rp {part.price.toLocaleString()}</span
                                                    >
                                                    <button
                                                        onclick={() =>
                                                            removePart(i)}
                                                        class="text-red-500 hover:text-red-700"
                                                        >×</button
                                                    >
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {/if}

                        <!-- Option: External -->
                        {#if sparepartSource === "external"}
                            <div class="grid gap-3 bg-muted/20 p-3 rounded">
                                <div class="space-y-1">
                                    <Label class="text-xs"
                                        >Nama Barang / Sparepart</Label
                                    >
                                    <Input
                                        bind:value={extPartName}
                                        placeholder="Contoh: LCD KW Super beli di ITC"
                                        class="h-8"
                                    />
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <div class="space-y-1">
                                        <Label class="text-xs"
                                            >Harga Beli (Modal)</Label
                                        >
                                        <Input
                                            type="number"
                                            bind:value={extPartBuyPrice}
                                            placeholder="0"
                                            class="h-8"
                                        />
                                    </div>
                                    <div class="space-y-1">
                                        <Label class="text-xs"
                                            >Harga Jual ke User</Label
                                        >
                                        <Input
                                            type="number"
                                            bind:value={extPartSellPrice}
                                            placeholder="0"
                                            class="h-8"
                                        />
                                    </div>
                                </div>
                            </div>
                        {/if}

                        <!-- Option: None -->
                        {#if sparepartSource === "none"}
                            <p class="text-xs text-muted-foreground italic">
                                Hanya dikenakan biaya jasa service.
                            </p>
                        {/if}
                    </div>
                {/if}

                <!-- Technician & Cost -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <Label for="technician"
                            >Teknisi {#if isWalkin}<span class="text-red-500"
                                    >*</span
                                >{/if}</Label
                        >
                        <Select
                            type="single"
                            name="technician"
                            bind:value={technician}
                        >
                            <SelectTrigger
                                >{technician ||
                                    "Belum ditentukan"}</SelectTrigger
                            >
                            <SelectContent>
                                <SelectItem value=""
                                    >Belum ditentukan</SelectItem
                                >
                                <SelectItem value="agus"
                                    >Agus (Available)</SelectItem
                                >
                                <SelectItem value="rudi"
                                    >Rudi (2 service)</SelectItem
                                >
                            </SelectContent>
                        </Select>
                        {#if isWalkin}
                            <p class="text-[10px] text-muted-foreground">
                                Teknisi yang mengerjakan service ini (akan
                                tercatat di laporan).
                            </p>
                        {/if}
                    </div>

                    <div class="space-y-2">
                        <Label for="cost">Biaya Jasa Service</Label>
                        <Input
                            id="cost"
                            type="number"
                            bind:value={estimatedCost}
                            placeholder="Rp 0"
                        />
                    </div>
                </div>

                {#if isWalkin}
                    <div
                        class="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20"
                    >
                        <span class="font-bold text-sm"
                            >Total Estimasi Harga:</span
                        >
                        <span class="font-bold text-lg text-primary"
                            >Rp {grandTotalEstimate.toLocaleString()}</span
                        >
                    </div>
                {/if}

                <!-- Walk-in Warranty -->
                {#if isWalkin}
                    <div class="space-y-2">
                        <Label for="warranty">Garansi</Label>
                        <Select
                            type="single"
                            name="warranty"
                            bind:value={warranty}
                        >
                            <SelectTrigger
                                >{warranty === "none"
                                    ? "Tidak ada garansi"
                                    : warranty.replace("_", " ")}</SelectTrigger
                            >
                            <SelectContent>
                                <SelectItem value="none"
                                    >Tidak ada garansi</SelectItem
                                >
                                <SelectItem value="3_hari">3 Hari</SelectItem>
                                <SelectItem value="1_minggu"
                                    >1 Minggu</SelectItem
                                >
                                <SelectItem value="2_minggu"
                                    >2 Minggu</SelectItem
                                >
                                <SelectItem value="1_bulan">1 Bulan</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                {/if}

                <!-- Down Payment -->
                <div class="space-y-2">
                    <Label for="dp">DP / Uang Muka</Label>
                    <Input
                        id="dp"
                        type="number"
                        bind:value={downPayment}
                        placeholder="Rp 0"
                    />
                </div>
            </div>
        {:else if currentStep === 3}
            <!-- Step 3: Confirmation -->
            <div class="space-y-6">
                <div class="text-center mb-6">
                    <CheckCircle
                        class="h-12 w-12 mx-auto text-green-600 mb-2"
                    />
                    <h4 class="font-medium text-lg">
                        Konfirmasi Service Order
                    </h4>
                </div>

                <div class="space-y-4">
                    <Card>
                        <CardHeader
                            ><CardTitle class="text-base"
                                >Customer & Unit</CardTitle
                            ></CardHeader
                        >
                        <CardContent class="grid md:grid-cols-2 gap-4 text-sm">
                            <div class="space-y-1">
                                <p class="text-muted-foreground">Nama</p>
                                <p class="font-medium">{customerName}</p>
                            </div>
                            <div class="space-y-1">
                                <p class="text-muted-foreground">Unit</p>
                                <p class="font-medium">
                                    {phoneBrand}
                                    {phoneModel}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader
                            ><CardTitle class="text-base"
                                >Service Info</CardTitle
                            ></CardHeader
                        >
                        <CardContent class="grid md:grid-cols-2 gap-4 text-sm">
                            <div class="space-y-1 col-span-2">
                                <p class="text-muted-foreground">
                                    {isWalkin ? "Kerusakan" : "Keluhan"}
                                </p>
                                <p class="font-medium">{complaint}</p>
                            </div>

                            {#if isWalkin && sparepartSource !== "none"}
                                <div class="space-y-1 col-span-2">
                                    <p class="text-muted-foreground">
                                        Sparepart ({sparepartSource})
                                    </p>
                                    {#if sparepartSource === "inventory"}
                                        <ul class="list-disc pl-4 text-xs">
                                            {#each selectedParts as part}
                                                <li>
                                                    {part.name} - Rp {part.price.toLocaleString()}
                                                </li>
                                            {/each}
                                        </ul>
                                    {:else if sparepartSource === "external"}
                                        <p class="font-medium text-xs">
                                            {extPartName} (Jual: Rp {parseInt(
                                                extPartSellPrice || "0",
                                            ).toLocaleString()})
                                        </p>
                                    {/if}
                                </div>
                            {/if}

                            <div class="space-y-1">
                                <p class="text-muted-foreground">Biaya Jasa</p>
                                <p class="font-medium">
                                    {estimatedCost
                                        ? `Rp ${parseInt(estimatedCost).toLocaleString()}`
                                        : "Rp 0"}
                                </p>
                            </div>

                            {#if isWalkin}
                                <div class="space-y-1">
                                    <p class="text-muted-foreground">
                                        Total Biaya
                                    </p>
                                    <p class="font-bold text-primary">
                                        Rp {grandTotalEstimate.toLocaleString()}
                                    </p>
                                </div>
                            {/if}

                            <div class="space-y-1">
                                <p class="text-muted-foreground">Teknisi</p>
                                <p class="font-medium capitalize">
                                    {technician || "-"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
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
            <Button onclick={handleSubmit}>
                <CheckCircle class="mr-2 h-4 w-4" /> Buat Service Order
            </Button>
        {/if}
    </CardFooter>
</Card>

<!-- Inventory Search Modal (Mock) -->
<Dialog bind:open={showInventoryModal}>
    <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
            <DialogTitle>Pilih Sparepart</DialogTitle>
            <DialogDescription>
                Pilih sparepart dari inventory toko.
            </DialogDescription>
        </DialogHeader>
        <div class="py-4 space-y-4">
            <Input placeholder="Cari nama barang..." bind:value={searchTerm} />
            <div class="border rounded-md max-h-[200px] overflow-y-auto">
                {#each mockInventory.filter((i) => i.name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())) as item}
                    <button
                        class="w-full text-left p-3 hover:bg-muted text-sm flex justify-between border-b last:border-0"
                        onclick={() => addInventoryPart(item)}
                    >
                        <div>
                            <div class="font-medium">{item.name}</div>
                            <div class="text-xs text-muted-foreground">
                                Stok: {item.stock}
                            </div>
                        </div>
                        <div class="font-semibold text-primary">
                            Rp {item.price.toLocaleString()}
                        </div>
                    </button>
                {/each}
            </div>
        </div>
    </DialogContent>
</Dialog>
