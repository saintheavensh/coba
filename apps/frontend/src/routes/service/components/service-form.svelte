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
    import { Separator } from "$lib/components/ui/separator";
    import { Badge } from "$lib/components/ui/badge";
    import { toast } from "$lib/components/ui/sonner";
    import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-svelte";
    import { goto } from "$app/navigation";

    // Form state
    let currentStep = 1;

    // Step 1: Customer & HP Data
    let isWalkin = false;
    let customerName = "";
    let customerPhone = "";
    let customerAddress = "";
    let phoneBrand = "";
    let phoneModel = "";
    let imei = "";

    // Step 2: Complaint & Technician
    let complaint = "";
    let technician = "";
    let estimatedCost = "";
    let pinPattern = "";

    // Validation - phone optional for walk-in, IMEI always optional
    $: step1Valid =
        customerName.trim() !== "" &&
        (isWalkin || customerPhone.trim() !== "") &&
        phoneBrand.trim() !== "" &&
        phoneModel.trim() !== "";

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

    function handleSubmit() {
        toast.success("Service order berhasil dibuat!", {
            description: `No. SRV-2026-NEW - ${customerName}`,
        });
        // Reset form
        currentStep = 1;
        isWalkin = false;
        customerName = "";
        customerPhone = "";
        customerAddress = "";
        phoneBrand = "";
        phoneModel = "";
        imei = "";
        complaint = "";
        technician = "";
        pinPattern = "";
        estimatedCost = "";

        // Navigate to list
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

                <div>
                    <h4 class="font-medium mb-4">Data Handphone</h4>
                    <div class="grid gap-4">
                        <div class="space-y-2">
                            <Label for="brand"
                                >Merk/Brand <span class="text-red-500">*</span
                                ></Label
                            >
                            <Input
                                id="brand"
                                bind:value={phoneBrand}
                                placeholder="Contoh: Samsung, iPhone, Xiaomi"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="model"
                                >Model/Tipe <span class="text-red-500">*</span
                                ></Label
                            >
                            <Input
                                id="model"
                                bind:value={phoneModel}
                                placeholder="Contoh: Galaxy S24, iPhone 15 Pro"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="imei">IMEI (15 digit)</Label>
                            <Input
                                id="imei"
                                bind:value={imei}
                                placeholder="354217123456789 (kosongkan jika HP mati total)"
                                maxlength={15}
                            />
                            <p class="text-xs text-muted-foreground">
                                Opsional - Kosongkan jika HP mati total
                            </p>
                        </div>
                        <div class="space-y-2">
                            <Label for="pinPattern">PIN / Pola Unlock</Label>
                            <Input
                                id="pinPattern"
                                bind:value={pinPattern}
                                placeholder="Contoh: 1234 atau Pola L"
                            />
                            <p class="text-xs text-muted-foreground">
                                Opsional - Untuk unlock HP saat service
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        {:else if currentStep === 2}
            <!-- Step 2: Complaint & Technician -->
            <div class="space-y-6">
                <div class="p-4 bg-muted rounded-lg">
                    <p class="text-sm">
                        <span class="font-medium">Customer:</span>
                        {customerName} ({customerPhone})
                    </p>
                    <p class="text-sm">
                        <span class="font-medium">HP:</span>
                        {phoneBrand}
                        {phoneModel} (IMEI: {imei.substring(0, 10)}...)
                    </p>
                </div>

                <div class="space-y-2">
                    <Label for="complaint"
                        >Keluhan Customer <span class="text-red-500">*</span
                        ></Label
                    >
                    <Textarea
                        id="complaint"
                        bind:value={complaint}
                        placeholder="Jelaskan keluhan/masalah pada handphone (max 500 karakter)"
                        rows={5}
                        maxlength={500}
                    />
                    <p class="text-xs text-muted-foreground text-right">
                        {complaint?.length || 0} / 500
                    </p>
                </div>

                <div class="space-y-2">
                    <Label for="technician">Teknisi</Label>
                    <Select
                        type="single"
                        name="technician"
                        bind:value={technician}
                    >
                        <SelectTrigger>
                            {technician || "Belum ditentukan (assign nanti)"}
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Belum ditentukan</SelectItem>
                            <SelectItem value="agus"
                                >Agus (Available)</SelectItem
                            >
                            <SelectItem value="rudi"
                                >Rudi (2 service aktif)</SelectItem
                            >
                        </SelectContent>
                    </Select>
                    <p class="text-xs text-muted-foreground">
                        Opsional - Teknisi bisa di-assign nanti saat diagnosa
                    </p>
                </div>

                <div class="space-y-2">
                    <Label for="cost">Estimasi Biaya</Label>
                    <Input
                        id="cost"
                        type="number"
                        bind:value={estimatedCost}
                        placeholder="500000"
                    />
                    <p class="text-xs text-muted-foreground">
                        Opsional - Bisa diisi/diubah saat diagnosa
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
                    <p class="text-sm text-muted-foreground">
                        Pastikan data sudah benar sebelum menyimpan
                    </p>
                </div>

                <div class="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle class="text-base"
                                >Data Customer</CardTitle
                            >
                        </CardHeader>
                        <CardContent class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-muted-foreground">Tipe</span>
                                <Badge variant="outline"
                                    >{isWalkin ? "Walk-in" : "Reguler"}</Badge
                                >
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-foreground">Nama</span>
                                <span class="font-medium">{customerName}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-foreground"
                                    >Telepon</span
                                >
                                <span class="font-medium">{customerPhone}</span>
                            </div>
                            {#if customerAddress}
                                <div class="flex justify-between">
                                    <span class="text-muted-foreground"
                                        >Alamat</span
                                    >
                                    <span class="font-medium"
                                        >{customerAddress}</span
                                    >
                                </div>
                            {/if}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle class="text-base"
                                >Data Handphone</CardTitle
                            >
                        </CardHeader>
                        <CardContent class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-muted-foreground"
                                    >Merk/Model</span
                                >
                                <span class="font-medium"
                                    >{phoneBrand} {phoneModel}</span
                                >
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-foreground">IMEI</span>
                                <span class="font-mono text-xs">{imei}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle class="text-base">Keluhan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p class="text-sm">{complaint}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle class="text-base"
                                >Detail Lainnya</CardTitle
                            >
                        </CardHeader>
                        <CardContent class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-muted-foreground"
                                    >Teknisi</span
                                >
                                <span class="font-medium"
                                    >{technician || "Belum ditentukan"}</span
                                >
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-foreground"
                                    >Estimasi</span
                                >
                                <span class="font-medium"
                                    >{estimatedCost
                                        ? `Rp ${parseInt(estimatedCost).toLocaleString()}`
                                        : "-"}</span
                                >
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-foreground">Status</span
                                >
                                <Badge variant="outline"
                                    >Menunggu Diagnosa</Badge
                                >
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
                <ArrowLeft class="mr-2 h-4 w-4" />
                Kembali
            </Button>
        {:else}
            <div></div>
        {/if}

        {#if currentStep < 3}
            <Button
                onclick={nextStep}
                disabled={currentStep === 1 && !step1Valid}
            >
                Lanjut
                <ArrowRight class="ml-2 h-4 w-4" />
            </Button>
        {:else}
            <Button onclick={handleSubmit}>
                <CheckCircle class="mr-2 h-4 w-4" />
                Buat Service Order
            </Button>
        {/if}
    </CardFooter>
</Card>
