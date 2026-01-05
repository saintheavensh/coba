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
    let phoneStatus = "nyala"; // nyala, mati_total, restart
    let imei = "";
    let physicalConditions: string[] = []; // normal, lecet, retak, bekas_air
    let completeness: string[] = []; // sim_tray, sim_card, softcase, memory_card, box, charger
    let physicalNotes = "";
    let pinPattern = "";

    // Pattern Lock Modal
    let isPatternOpen = false;
    let patternPoints: number[] = [];
    $: patternString =
        patternPoints.length > 0
            ? patternPoints.map((p) => p + 1).join("-")
            : "";

    // Step 2: Complaint & Technician
    let complaint = "";
    let technician = "";
    let estimatedCost = "";
    let downPayment = "";

    // Validation
    $: step1Valid =
        customerName.trim() !== "" &&
        (isWalkin || customerPhone.trim() !== "") &&
        phoneBrand.trim() !== "" &&
        phoneModel.trim() !== "" &&
        phoneStatus.trim() !== "";

    $: step2Valid = complaint && complaint.trim().length > 0;

    function nextStep() {
        if (currentStep === 1 && !step1Valid) {
            toast.error("Harap isi semua field yang wajib");
            return;
        }
        if (currentStep === 2 && !step2Valid) {
            toast.error("Harap isi keluhan customer");
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
        // Don't close immediately, let user confirm visual or manual close?
        // For smoother UX, maybe wait a bit or let them close modal.
    }

    function handleSavePattern() {
        isPatternOpen = false;
        toast.success(`Pola tersimpan: ${patternString}`);
    }

    function handleSubmit() {
        toast.success("Service order berhasil dibuat!", {
            description: `No. SRV-2026-NEW - ${customerName}`,
        });

        // Reset and navigate
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
        <!-- Progress indicator -->
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
                <span class="text-xs text-muted-foreground">2. Keluhan</span>
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

                        <!-- Status Awal (Moved above IMEI) -->
                        <div class="space-y-2">
                            <Label
                                >Status Awal Handphone <span
                                    class="text-red-500">*</span
                                ></Label
                            >
                            <div
                                class="flex flex-wrap gap-4 p-3 border rounded-md bg-muted/20"
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
                            </div>
                        </div>

                        <!-- IMEI -->
                        <div class="space-y-2">
                            <Label for="imei">IMEI (15 digit)</Label>
                            <Input
                                id="imei"
                                bind:value={imei}
                                placeholder={phoneStatus === "nyala"
                                    ? "354217123456789"
                                    : "Kosongkan jika HP mati total/restart"}
                                maxlength={15}
                                disabled={phoneStatus === "mati_total" ||
                                    phoneStatus === "restart"}
                            />
                            <p class="text-xs text-muted-foreground">
                                {phoneStatus === "nyala"
                                    ? "Opsional - Masukkan IMEI jika tersedia"
                                    : "IMEI tidak perlu diisi untuk kondisi ini"}
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

                            <!-- Kelengkapan (New Field) -->
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
            <!-- Step 2: Complaint & Technician -->
            <div class="space-y-6">
                <div class="p-4 bg-muted rounded-lg space-y-2">
                    <div class="flex justify-between">
                        <span class="font-medium text-sm">Unit:</span>
                        <span class="text-sm">{phoneBrand} {phoneModel}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium text-sm">Status:</span>
                        <Badge variant="outline" class="uppercase text-[10px]"
                            >{phoneStatus.replace("_", " ")}</Badge
                        >
                    </div>
                </div>

                <div class="space-y-2">
                    <Label for="complaint"
                        >Keluhan Customer <span class="text-red-500">*</span
                        ></Label
                    >
                    <Textarea
                        id="complaint"
                        bind:value={complaint}
                        placeholder="Jelaskan keluhan detail..."
                        rows={5}
                        maxlength={500}
                    />
                    <p class="text-xs text-muted-foreground text-right">
                        {complaint?.length || 0} / 500
                    </p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <Label for="technician">Teknisi</Label>
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
                    </div>

                    <div class="space-y-2">
                        <Label for="cost">Estimasi Biaya</Label>
                        <Input
                            id="cost"
                            type="number"
                            bind:value={estimatedCost}
                            placeholder="Rp 0"
                        />
                    </div>
                </div>

                <!-- Down Payment (New Field) -->
                <div class="space-y-2">
                    <Label for="dp">DP / Uang Muka</Label>
                    <Input
                        id="dp"
                        type="number"
                        bind:value={downPayment}
                        placeholder="Rp 0"
                    />
                    <p class="text-xs text-muted-foreground">
                        Isi jika customer membayar uang muka
                    </p>
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
                            <div class="space-y-1">
                                <p class="text-muted-foreground">Status Awal</p>
                                <Badge variant="outline" class="uppercase"
                                    >{phoneStatus.replace("_", " ")}</Badge
                                >
                            </div>
                            <div class="space-y-1">
                                <p class="text-muted-foreground">Kelengkapan</p>
                                <p class="font-medium">
                                    {completeness.length > 0
                                        ? completeness
                                              .join(", ")
                                              .replace(/_/g, " ")
                                        : "-"}
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
                                <p class="text-muted-foreground">Keluhan</p>
                                <p class="font-medium">{complaint}</p>
                            </div>
                            <div class="space-y-1">
                                <p class="text-muted-foreground">Estimasi</p>
                                <p class="font-medium">
                                    {estimatedCost
                                        ? `Rp ${parseInt(estimatedCost).toLocaleString()}`
                                        : "-"}
                                </p>
                            </div>
                            <div class="space-y-1">
                                <p class="text-muted-foreground">
                                    DP / Uang Muka
                                </p>
                                <p class="font-medium text-green-600">
                                    {downPayment
                                        ? `Rp ${parseInt(downPayment).toLocaleString()}`
                                        : "-"}
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
