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
    } from "$lib/components/ui/dialog";
    import { Separator } from "$lib/components/ui/separator";
    import { Badge } from "$lib/components/ui/badge";
    import { toast } from "$lib/components/ui/sonner";
    import {
        ArrowLeft,
        ArrowRight,
        CheckCircle,
        Smartphone,
        User,
        Wrench,
        Calendar,
        Clock,
        Camera,
        Upload,
        X,
        ChevronLeft,
        ChevronRight,
        Grid3X3,
        Package,
        Search,
        Trash2,
        AlertCircle,
    } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { ServiceService } from "$lib/services/service.service";
    import { api, API_URL } from "$lib/api";
    import { createQuery } from "@tanstack/svelte-query";
    import PatternLock from "$lib/components/ui/pattern-lock.svelte";
    import CurrencyInput from "$lib/components/custom/currency-input.svelte";

    // Service Type
    let isWalkin = $state(false);

    // Form State
    let currentStep = $state(1);
    let isSubmitting = $state(false);

    // Step 1: Customer Data
    let customerName = $state("");
    let customerPhone = $state("");
    let customerAddress = $state("");

    // Step 2: Device Data
    let phoneBrand = $state("");
    let phoneModel = $state("");
    let phoneStatus = $state("nyala");
    let imei = $state("");
    let pinPattern = $state("");
    let physicalConditions = $state<string[]>([]);
    let completeness = $state<string[]>([]);
    let physicalNotes = $state("");

    // Pattern Lock Modal
    let isPatternOpen = $state(false);
    let patternPoints = $state<number[]>([]);
    let patternString = $derived(
        patternPoints.length > 0
            ? patternPoints.map((p) => p + 1).join("-")
            : "",
    );

    // Step 3: Service Details
    let complaint = $state("");
    let technician = $state("");
    let estimatedCompletionDate = $state("");

    // Regular service specific - Diagnosis
    let initialDiagnosis = $state("");
    let possibleCauses = $state("");
    let isPriceRange = $state(false);
    let estimatedCost = $state(0);
    let minPrice = $state(0);
    let maxPrice = $state(0);
    let downPayment = $state(0);

    // Walk-in specific - Service fee is required
    let serviceFee = $state(0);
    let serviceDescription = $state(""); // For jumper, cleaning, etc.

    // Walk-in Sparepart
    let sparepartSource = $state("none"); // none, inventory, external
    let selectedParts = $state<any[]>([]);
    let showInventoryModal = $state(false);
    let searchTerm = $state("");
    let extPartName = $state("");
    let extPartBuyPrice = $state(0);

    // Photos
    let photos = $state<string[]>([]);
    let isUploading = $state(false);

    // Calendar State
    let showCalendar = $state(false);
    let calendarDate = $state(new Date());

    // Fetch technicians
    const techniciansQuery = createQuery(() => ({
        queryKey: ["users", "technicians"],
        queryFn: async () => {
            const res = await api.get("/auth/users?role=teknisi");
            return res.data?.data || [];
        },
    }));

    // Fetch inventory for spareparts
    const inventoryQuery = createQuery(() => ({
        queryKey: ["inventory"],
        queryFn: async () => {
            const res = await api.get("/inventory");
            return res.data?.data || [];
        },
    }));

    // Fetch services for calendar preview
    const servicesQuery = createQuery(() => ({
        queryKey: ["services", "calendar"],
        queryFn: () => ServiceService.getAll(),
    }));

    let technicians = $derived(techniciansQuery.data || []);
    let inventoryItems = $derived(inventoryQuery.data || []);
    let services = $derived((servicesQuery.data || []) as any[]);

    // Filter inventory by search
    let filteredInventory = $derived(
        inventoryItems.filter((item: any) =>
            item.name?.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    );

    // Computed totals for walk-in
    let totalPartPrice = $derived(
        selectedParts.reduce(
            (sum, p) => sum + (parseInt(p.sellPrice) || 0),
            0,
        ) + (sparepartSource === "external" ? extPartBuyPrice || 0 : 0),
    );
    let grandTotal = $derived(serviceFee || 0);
    let walkinServiceFee = $derived(grandTotal - totalPartPrice);

    // Calendar helpers
    function getMonthDays(date: Date): Date[] {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days: Date[] = [];
        const startDay = firstDay.getDay() || 7;
        for (let i = startDay - 1; i > 0; i--) {
            const d = new Date(firstDay);
            d.setDate(d.getDate() - i);
            days.push(d);
        }
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            const d = new Date(lastDay);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    }

    function isPastDate(date: Date): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today;
    }

    function isToday(date: Date): boolean {
        return date.toDateString() === new Date().toDateString();
    }

    function isCurrentMonth(date: Date): boolean {
        return date.getMonth() === calendarDate.getMonth();
    }

    function getServicesForDate(date: Date): number {
        return services.filter((s) => {
            if (!s.estimatedCompletionDate) return false;
            const sDate = new Date(s.estimatedCompletionDate);
            return sDate.toDateString() === date.toDateString();
        }).length;
    }

    function selectDate(date: Date) {
        if (isPastDate(date)) {
            toast.error("Tidak dapat memilih tanggal yang sudah lewat");
            return;
        }
        // Validate technician is assigned for regular service
        if (!isWalkin && !technician) {
            toast.error(
                "Teknisi harus ditugaskan terlebih dahulu sebelum menentukan estimasi selesai",
            );
            return;
        }
        estimatedCompletionDate = date.toISOString().split("T")[0];
        showCalendar = false;
    }

    function navigateMonth(dir: number) {
        const newDate = new Date(calendarDate);
        newDate.setMonth(newDate.getMonth() + dir);
        calendarDate = newDate;
    }

    let calendarDays = $derived(getMonthDays(calendarDate));

    // Status check for locked fields
    const isErrorStatus = (status: string) =>
        ["mati_total", "restart", "blank_hitam"].includes(status);

    // Pattern Lock handlers
    function handlePatternChange(e: CustomEvent<number[]>) {
        patternPoints = e.detail;
        pinPattern = "Pola: " + patternString;
    }

    function handleSavePattern() {
        isPatternOpen = false;
        toast.success(`Pola tersimpan: ${patternString}`);
    }

    // Validation
    let step1Valid = $derived(
        customerName.trim() !== "" && (isWalkin || customerPhone.trim() !== ""),
    );

    let step2Valid = $derived(
        phoneBrand.trim() !== "" && phoneModel.trim() !== "",
    );

    let step3Valid = $derived(
        complaint.trim() !== "" &&
            (!isWalkin || (technician !== "" && !!serviceFee)),
    );

    function nextStep() {
        if (currentStep === 1 && !step1Valid) {
            toast.error(
                isWalkin
                    ? "Harap isi nama customer"
                    : "Harap isi nama dan nomor telepon customer",
            );
            return;
        }
        if (currentStep === 2 && !step2Valid) {
            toast.error("Harap isi brand dan model handphone");
            return;
        }
        if (currentStep === 3 && !step3Valid) {
            if (isWalkin) {
                if (technician === "") {
                    toast.error("Teknisi wajib dipilih untuk Walk-in Service");
                } else if (!serviceFee) {
                    toast.error(
                        "Total biaya wajib diisi untuk Walk-in Service",
                    );
                } else if (serviceFee < totalPartPrice) {
                    toast.error(
                        "Total biaya tidak boleh kurang dari harga sparepart",
                    );
                } else {
                    toast.error("Harap isi kerusakan");
                }
            } else {
                toast.error("Harap isi keluhan customer");
            }
            return;
        }
        currentStep++;
    }

    function prevStep() {
        currentStep--;
    }

    // Photo upload
    async function handleFileUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        isUploading = true;
        const files = Array.from(input.files);

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);
                const res = await api.post("/uploads", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                const data = res.data;
                if (data.success && data.data.url) {
                    photos = [...photos, data.data.url];
                }
            }
            toast.success("Foto berhasil diupload");
        } catch (error) {
            toast.error("Gagal upload foto");
        } finally {
            isUploading = false;
            input.value = "";
        }
    }

    function removePhoto(index: number) {
        photos = photos.filter((_, i) => i !== index);
    }

    // Sparepart functions
    function addInventoryPart(part: any) {
        // Get sellPrice from the first batch if available
        const sellPrice = part.batches?.[0]?.sellPrice || 0;
        selectedParts = [
            ...selectedParts,
            { ...part, sellPrice, type: "inventory" },
        ];
        showInventoryModal = false;
        toast.success(`${part.name} ditambahkan`);
    }

    function removePart(index: number) {
        selectedParts = selectedParts.filter((_, i) => i !== index);
    }

    // Submit form
    async function handleSubmit() {
        if (!step3Valid) {
            toast.error("Harap lengkapi semua field yang wajib");
            return;
        }

        isSubmitting = true;
        try {
            const payload: any = {
                type: isWalkin ? "walk_in" : "regular",
                customer: {
                    name: customerName,
                    phone: customerPhone || undefined,
                    address: customerAddress || undefined,
                },
                unit: {
                    brand: phoneBrand,
                    model: phoneModel,
                    status: phoneStatus,
                    imei: imei || undefined,
                    pin: pinPattern || undefined,
                    condition: physicalConditions,
                    completeness: completeness,
                    physicalNotes: physicalNotes || undefined,
                },
                complaint: complaint,
                technicianId: technician || null,
                status: isWalkin ? "selesai" : "antrian",
                photos: photos,
                estimatedCompletionDate: estimatedCompletionDate
                    ? new Date(estimatedCompletionDate).toISOString()
                    : undefined,
            };

            // Regular service diagnosis
            if (!isWalkin) {
                payload.diagnosis = {
                    initial: initialDiagnosis || undefined,
                    possibleCauses: possibleCauses || undefined,
                    estimatedCost: isPriceRange
                        ? `${minPrice}-${maxPrice}`
                        : estimatedCost || undefined,
                    downPayment: downPayment || undefined,
                };
            }

            // Walk-in parts and service
            if (isWalkin) {
                payload.serviceFee = walkinServiceFee;
                payload.serviceDescription = serviceDescription || undefined;
                if (selectedParts.length > 0) {
                    payload.parts = selectedParts.map((p) => ({
                        productId: p.id,
                        qty: 1,
                        price: parseInt(p.price),
                    }));
                }
            }

            await ServiceService.create(payload);
            toast.success(
                isWalkin
                    ? "Service Walk-in Selesai!"
                    : "Service order berhasil dibuat!",
            );
            goto("/service");
        } catch (e: any) {
            toast.error(
                "Gagal membuat service: " +
                    (e.response?.data?.message || e.message),
            );
        } finally {
            isSubmitting = false;
        }
    }

    const brands = [
        "Samsung",
        "Apple / iPhone",
        "Xiaomi",
        "Oppo",
        "Vivo",
        "Realme",
        "Infinix",
        "Asus",
        "Google",
        "Lainnya",
    ];
    const statusOptions = [
        { value: "nyala", label: "Nyala Normal", color: "text-green-600" },
        { value: "mati_total", label: "Mati Total", color: "text-red-600" },
        { value: "restart", label: "Restart", color: "text-orange-600" },
        { value: "blank_hitam", label: "Blank Hitam", color: "text-gray-800" },
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

<div class="space-y-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button variant="ghost" href="/service" class="shrink-0">
            <ArrowLeft class="h-4 w-4 mr-2" />
            Kembali
        </Button>
        <div class="flex-1">
            <h3 class="text-2xl font-bold tracking-tight">🔧 Service Baru</h3>
            <p class="text-sm text-muted-foreground">
                Buat tiket service baru dengan wizard 4 langkah
            </p>
        </div>
    </div>
    <Separator />

    <!-- Service Type Toggle -->
    <div class="flex gap-4 p-4 bg-muted/50 rounded-lg">
        <label
            class={`flex-1 flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${!isWalkin ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"}`}
        >
            <input
                type="radio"
                bind:group={isWalkin}
                value={false}
                class="sr-only"
            />
            <Clock class="h-6 w-6" />
            <span class="font-medium">Ditinggal (Reguler)</span>
            <span class="text-xs text-muted-foreground text-center"
                >Customer meninggalkan HP, telepon wajib</span
            >
        </label>
        <label
            class={`flex-1 flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${isWalkin ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"}`}
        >
            <input
                type="radio"
                bind:group={isWalkin}
                value={true}
                class="sr-only"
            />
            <CheckCircle class="h-6 w-6" />
            <span class="font-medium">Ditunggu (Walk-in)</span>
            <Badge variant="secondary" class="mt-1">Quick Service</Badge>
            <span class="text-xs text-muted-foreground text-center"
                >Selesai langsung, telepon opsional</span
            >
        </label>
    </div>

    <!-- Progress Bar -->
    <div class="flex items-center gap-2">
        {#each [{ step: 1, label: "Customer" }, { step: 2, label: "Perangkat" }, { step: 3, label: isWalkin ? "Service & Sparepart" : "Service" }, { step: 4, label: "Konfirmasi" }] as item}
            <div class="flex items-center gap-2 flex-1">
                <div
                    class={`
                    flex items-center justify-center h-8 w-8 rounded-full shrink-0 transition-all text-sm font-medium
                    ${currentStep >= item.step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
                `}
                >
                    {item.step}
                </div>
                <div
                    class={`h-1 flex-1 rounded-full transition-all ${currentStep > item.step ? "bg-primary" : "bg-muted"}`}
                ></div>
                <span class="text-xs text-muted-foreground hidden sm:inline"
                    >{item.label}</span
                >
            </div>
        {/each}
    </div>

    <!-- Form Card -->
    <Card>
        <CardHeader>
            <CardTitle class="flex items-center gap-2">
                {#if currentStep === 1}
                    <User class="h-5 w-5" /> Data Customer
                {:else if currentStep === 2}
                    <Smartphone class="h-5 w-5" /> Data Perangkat
                {:else if currentStep === 3}
                    <Wrench class="h-5 w-5" />
                    {isWalkin ? "Service & Sparepart" : "Detail Service"}
                {:else}
                    <CheckCircle class="h-5 w-5" /> Konfirmasi
                {/if}
            </CardTitle>
            <CardDescription>
                {#if currentStep === 1}
                    {isWalkin
                        ? "Nama wajib, telepon opsional untuk walk-in"
                        : "Masukkan nama dan telepon customer"}
                {:else if currentStep === 2}
                    Masukkan informasi perangkat yang akan di-service
                {:else if currentStep === 3}
                    {isWalkin
                        ? "Masukkan kerusakan, biaya jasa, dan pilih sparepart"
                        : "Masukkan detail keluhan, diagnosa, dan jadwal estimasi"}
                {:else}
                    Review dan konfirmasi data service
                {/if}
            </CardDescription>
        </CardHeader>

        <CardContent class="space-y-6">
            <!-- Step 1: Customer -->
            {#if currentStep === 1}
                <div class="grid gap-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                    <div class="space-y-2">
                        <Label for="address"
                            >Alamat {#if isWalkin}(Opsional){/if}</Label
                        >
                        <Textarea
                            id="address"
                            bind:value={customerAddress}
                            placeholder="Jl. Merdeka No. 45, Jakarta"
                            rows={2}
                            disabled={isWalkin}
                        />
                    </div>
                </div>

                <!-- Step 2: Device -->
            {:else if currentStep === 2}
                <div class="grid gap-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <Label
                                >Merk/Brand <span class="text-red-500">*</span
                                ></Label
                            >
                            <Select type="single" bind:value={phoneBrand}>
                                <SelectTrigger
                                    >{phoneBrand ||
                                        "Pilih Brand"}</SelectTrigger
                                >
                                <SelectContent>
                                    {#each brands as brand}
                                        <SelectItem value={brand}
                                            >{brand}</SelectItem
                                        >
                                    {/each}
                                </SelectContent>
                            </Select>
                        </div>
                        <div class="space-y-2">
                            <Label for="model"
                                >Model/Tipe <span class="text-red-500">*</span
                                ></Label
                            >
                            <Input
                                id="model"
                                bind:value={phoneModel}
                                placeholder="Galaxy S24"
                            />
                        </div>
                    </div>

                    <div class="space-y-2">
                        <Label>Status Awal Handphone</Label>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {#each statusOptions as option}
                                <label
                                    class={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${phoneStatus === option.value ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
                                >
                                    <input
                                        type="radio"
                                        bind:group={phoneStatus}
                                        value={option.value}
                                        class="sr-only"
                                    />
                                    <Smartphone
                                        class={`h-4 w-4 ${option.color}`}
                                    />
                                    <span class="text-sm">{option.label}</span>
                                </label>
                            {/each}
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <Label for="pin">PIN / Pola Unlock</Label>
                            <div class="flex gap-2">
                                <Input
                                    id="pin"
                                    bind:value={pinPattern}
                                    placeholder={isErrorStatus(phoneStatus)
                                        ? "Dikunci (Status Error)"
                                        : "1234 atau Pola: 1-2-3"}
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
                            </div>
                            {#if isErrorStatus(phoneStatus)}
                                <p class="text-xs text-red-500">
                                    IMEI & PIN dikunci karena status error
                                </p>
                            {/if}
                        </div>
                    </div>

                    <Separator />

                    <!-- Physical Condition & Completeness -->
                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <Label>Kondisi Fisik</Label>
                            <div
                                class="flex flex-col gap-2 p-3 border rounded-md"
                            >
                                {#each physicalOptions as item}
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
                        <div class="space-y-2">
                            <Label>Kelengkapan Unit</Label>
                            <div
                                class="flex flex-col gap-2 p-3 border rounded-md"
                            >
                                {#each completenessOptions as item}
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
                        <Label for="notes">Catatan Kondisi Fisik Lainnya</Label>
                        <Input
                            id="notes"
                            bind:value={physicalNotes}
                            placeholder="Lecet di sudut, retak layar, dll"
                        />
                    </div>

                    <!-- Photo Upload -->
                    <div class="space-y-2">
                        <Label class="flex items-center gap-2">
                            <Camera class="h-4 w-4" /> Foto Perangkat (Opsional)
                        </Label>
                        <div class="flex flex-wrap gap-2">
                            {#each photos as photo, index}
                                <div class="relative group">
                                    <img
                                        src={`${API_URL}${photo}`}
                                        alt="Preview"
                                        class="w-20 h-20 object-cover rounded-lg border"
                                    />
                                    <button
                                        type="button"
                                        onclick={() => removePhoto(index)}
                                        class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X class="h-3 w-3" />
                                    </button>
                                </div>
                            {/each}
                            <label
                                class="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors"
                            >
                                <Upload class="h-5 w-5 text-muted-foreground" />
                                <span class="text-xs text-muted-foreground mt-1"
                                    >{isUploading ? "..." : "Upload"}</span
                                >
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    class="sr-only"
                                    onchange={handleFileUpload}
                                    disabled={isUploading}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Step 3: Service Details -->
            {:else if currentStep === 3}
                <div class="grid gap-4">
                    <div class="space-y-2">
                        <Label for="complaint"
                            >{isWalkin ? "Kerusakan" : "Keluhan Customer"}
                            <span class="text-red-500">*</span></Label
                        >
                        <Textarea
                            id="complaint"
                            bind:value={complaint}
                            placeholder="Jelaskan keluhan/kerusakan secara detail"
                            rows={3}
                        />
                    </div>

                    <!-- Technician -->
                    <div class="space-y-2">
                        <Label
                            >Teknisi {#if isWalkin}<span class="text-red-500"
                                    >*</span
                                >{:else}(Opsional){/if}</Label
                        >
                        <Select
                            type="single"
                            bind:value={technician}
                            onValueChange={(v) => (technician = v)}
                        >
                            <SelectTrigger
                                >{technicians.find(
                                    (t: any) => t.id === technician,
                                )?.name || "Pilih Teknisi"}</SelectTrigger
                            >
                            <SelectContent>
                                {#if !isWalkin}
                                    <SelectItem value=""
                                        >Belum Ditentukan</SelectItem
                                    >
                                {/if}
                                {#each technicians as tech}
                                    <SelectItem value={tech.id}
                                        >{tech.name}</SelectItem
                                    >
                                {/each}
                            </SelectContent>
                        </Select>
                        {#if !isWalkin}
                            <p class="text-xs text-muted-foreground">
                                Teknisi dapat ditugaskan nanti, tapi wajib untuk
                                menentukan estimasi selesai
                            </p>
                        {/if}
                    </div>

                    {#if isWalkin}
                        <!-- Walk-in: Service Fee (Required) & Description -->
                        <Separator />
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <Label for="serviceFee"
                                    >Total Biaya Service <span
                                        class="text-red-500">*</span
                                    ></Label
                                >
                                <CurrencyInput
                                    bind:value={serviceFee}
                                    placeholder="50000"
                                />
                            </div>
                        </div>

                        <!-- Sparepart Section -->
                        <Separator />
                        <div class="space-y-4">
                            <Label class="flex items-center gap-2">
                                <Package class="h-4 w-4" /> Sparepart
                            </Label>
                            <div class="grid grid-cols-3 gap-2">
                                <label
                                    class={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${sparepartSource === "none" ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
                                >
                                    <input
                                        type="radio"
                                        bind:group={sparepartSource}
                                        value="none"
                                        class="sr-only"
                                    />
                                    <span class="text-sm">Tanpa Sparepart</span>
                                </label>
                                <label
                                    class={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${sparepartSource === "inventory" ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
                                >
                                    <input
                                        type="radio"
                                        bind:group={sparepartSource}
                                        value="inventory"
                                        class="sr-only"
                                    />
                                    <span class="text-sm">Dari Toko</span>
                                </label>
                                <label
                                    class={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${sparepartSource === "external" ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
                                >
                                    <input
                                        type="radio"
                                        bind:group={sparepartSource}
                                        value="external"
                                        class="sr-only"
                                    />
                                    <span class="text-sm">Dari Luar</span>
                                </label>
                            </div>

                            {#if sparepartSource === "none"}
                                <!-- Service Description when no sparepart -->
                                <div
                                    class="space-y-2 p-4 bg-muted/50 rounded-lg"
                                >
                                    <Label for="serviceDescNone"
                                        >Keterangan/Deskripsi Pekerjaan</Label
                                    >
                                    <Textarea
                                        id="serviceDescNone"
                                        bind:value={serviceDescription}
                                        placeholder="Jumper, cleaning IC, pengecekan jalur, dll"
                                        rows={2}
                                    />
                                    <p class="text-xs text-muted-foreground">
                                        Jelaskan detail pekerjaan yang dilakukan
                                        tanpa sparepart
                                    </p>
                                </div>
                            {/if}

                            {#if sparepartSource === "inventory"}
                                <div class="space-y-2">
                                    <Button
                                        variant="outline"
                                        onclick={() =>
                                            (showInventoryModal = true)}
                                    >
                                        <Search class="h-4 w-4 mr-2" /> Cari dari
                                        Inventory
                                    </Button>
                                    {#if selectedParts.length > 0}
                                        <div class="border rounded-lg divide-y">
                                            {#each selectedParts as part, index}
                                                <div
                                                    class="flex items-center justify-between p-2"
                                                >
                                                    <span class="text-sm"
                                                        >{part.name}</span
                                                    >
                                                    <div
                                                        class="flex items-center gap-2"
                                                    >
                                                        <span
                                                            class="text-sm font-medium"
                                                            >Rp {parseInt(
                                                                part.sellPrice ||
                                                                    0,
                                                            ).toLocaleString(
                                                                "id-ID",
                                                            )}</span
                                                        >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onclick={() =>
                                                                removePart(
                                                                    index,
                                                                )}
                                                        >
                                                            <Trash2
                                                                class="h-4 w-4 text-red-500"
                                                            />
                                                        </Button>
                                                    </div>
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            {/if}

                            {#if sparepartSource === "external"}
                                <div
                                    class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg"
                                >
                                    <div class="space-y-2">
                                        <Label for="extName">Nama Part</Label>
                                        <Input
                                            id="extName"
                                            bind:value={extPartName}
                                            placeholder="LCD Samsung A50"
                                        />
                                    </div>
                                    <div class="space-y-2">
                                        <Label for="extBuy">Harga Beli</Label>
                                        <CurrencyInput
                                            bind:value={extPartBuyPrice}
                                            placeholder="400000"
                                        />
                                    </div>
                                </div>
                            {/if}

                            <!-- Total -->
                            <div
                                class="p-4 bg-muted/50 rounded-lg space-y-2 text-sm"
                            >
                                <div class="flex justify-between">
                                    <span>Jasa Service (Hitung)</span>
                                    <span
                                        >Rp {walkinServiceFee.toLocaleString(
                                            "id-ID",
                                        )}</span
                                    >
                                </div>
                                {#if totalPartPrice > 0}
                                    <div class="flex justify-between">
                                        <span>Sparepart</span>
                                        <span
                                            >Rp {totalPartPrice.toLocaleString(
                                                "id-ID",
                                            )}</span
                                        >
                                    </div>
                                {/if}
                                <Separator />
                                <div
                                    class="flex justify-between font-bold text-base"
                                >
                                    <span>Total</span>
                                    <span class="text-green-600"
                                        >Rp {grandTotal.toLocaleString(
                                            "id-ID",
                                        )}</span
                                    >
                                </div>
                            </div>
                        </div>
                    {:else}
                        <!-- Regular Service: Diagnosis -->
                        <Separator />
                        <h4 class="font-medium">Diagnosa Awal</h4>

                        <div class="space-y-2">
                            <Label for="initialDiag"
                                >Pemeriksaan Awal (Cek Arus dll)</Label
                            >
                            <Textarea
                                id="initialDiag"
                                bind:value={initialDiagnosis}
                                placeholder="Arus normal: 0.5A, tidak short..."
                                rows={2}
                            />
                        </div>

                        <div class="space-y-2">
                            <Label for="causes">Kemungkinan Kerusakan</Label>
                            <Textarea
                                id="causes"
                                bind:value={possibleCauses}
                                placeholder="IC Power, Baterai, Konektor Cas..."
                                rows={2}
                            />
                        </div>

                        <!-- Price: Fixed or Range -->
                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <Label>Estimasi Biaya</Label>
                                <label
                                    class="flex items-center gap-2 text-sm cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        bind:checked={isPriceRange}
                                        class="cursor-pointer"
                                    />
                                    <span>Range Harga</span>
                                </label>
                            </div>
                            {#if isPriceRange}
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="space-y-1">
                                        <span
                                            class="text-xs text-muted-foreground"
                                            >Harga Minimum</span
                                        >
                                        <CurrencyInput
                                            bind:value={minPrice}
                                            placeholder="100000"
                                        />
                                    </div>
                                    <div class="space-y-1">
                                        <span
                                            class="text-xs text-muted-foreground"
                                            >Harga Maximum</span
                                        >
                                        <CurrencyInput
                                            bind:value={maxPrice}
                                            placeholder="300000"
                                        />
                                    </div>
                                </div>
                            {:else}
                                <CurrencyInput
                                    bind:value={estimatedCost}
                                    placeholder="150000"
                                />
                            {/if}
                        </div>

                        <div class="space-y-2">
                            <Label for="dp">Uang Muka / DP (Opsional)</Label>
                            <CurrencyInput
                                bind:value={downPayment}
                                placeholder="50000"
                            />
                        </div>

                        <!-- Estimated Completion Date -->
                        <Separator />
                        <div class="space-y-2">
                            <Label class="flex items-center gap-2">
                                <Calendar class="h-4 w-4" /> Estimasi Selesai (Opsional)
                            </Label>
                            {#if !technician}
                                <div
                                    class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2"
                                >
                                    <AlertCircle
                                        class="h-4 w-4 text-yellow-600 mt-0.5"
                                    />
                                    <span class="text-sm text-yellow-800"
                                        >Teknisi harus ditugaskan terlebih
                                        dahulu sebelum menentukan estimasi
                                        selesai</span
                                    >
                                </div>
                            {:else}
                                <div class="relative">
                                    <Button
                                        variant="outline"
                                        class="w-full justify-start text-left font-normal"
                                        onclick={() =>
                                            (showCalendar = !showCalendar)}
                                    >
                                        <Calendar class="mr-2 h-4 w-4" />
                                        {estimatedCompletionDate
                                            ? new Date(
                                                  estimatedCompletionDate,
                                              ).toLocaleDateString("id-ID", {
                                                  weekday: "long",
                                                  day: "numeric",
                                                  month: "long",
                                                  year: "numeric",
                                              })
                                            : "Pilih tanggal estimasi selesai"}
                                    </Button>

                                    {#if showCalendar}
                                        <div
                                            class="absolute z-50 mt-2 p-4 bg-background border rounded-lg shadow-lg w-full max-w-sm"
                                        >
                                            <div
                                                class="flex items-center justify-between mb-4"
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onclick={() =>
                                                        navigateMonth(-1)}
                                                >
                                                    <ChevronLeft
                                                        class="h-4 w-4"
                                                    />
                                                </Button>
                                                <span class="font-semibold">
                                                    {calendarDate.toLocaleDateString(
                                                        "id-ID",
                                                        {
                                                            month: "long",
                                                            year: "numeric",
                                                        },
                                                    )}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onclick={() =>
                                                        navigateMonth(1)}
                                                >
                                                    <ChevronRight
                                                        class="h-4 w-4"
                                                    />
                                                </Button>
                                            </div>
                                            <div
                                                class="grid grid-cols-7 gap-1 text-center text-xs mb-2"
                                            >
                                                {#each ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as day}
                                                    <div
                                                        class="font-medium text-muted-foreground py-1"
                                                    >
                                                        {day}
                                                    </div>
                                                {/each}
                                            </div>
                                            <div class="grid grid-cols-7 gap-1">
                                                {#each calendarDays as day}
                                                    {@const count =
                                                        getServicesForDate(day)}
                                                    <button
                                                        type="button"
                                                        onclick={() =>
                                                            selectDate(day)}
                                                        disabled={isPastDate(
                                                            day,
                                                        )}
                                                        class={`
                                                        relative p-2 text-sm rounded-lg transition-all
                                                        ${!isCurrentMonth(day) ? "opacity-30" : ""}
                                                        ${isPastDate(day) ? "bg-muted/50 cursor-not-allowed text-muted-foreground" : "hover:bg-primary/10"}
                                                        ${isToday(day) ? "bg-blue-100 text-blue-700 font-bold" : ""}
                                                        ${estimatedCompletionDate === day.toISOString().split("T")[0] ? "bg-primary text-primary-foreground" : ""}
                                                    `}
                                                    >
                                                        {day.getDate()}
                                                        {#if count > 0}
                                                            <span
                                                                class="absolute bottom-0.5 right-0.5 text-[8px] bg-yellow-400 text-yellow-900 rounded-full px-1"
                                                                >{count}</span
                                                            >
                                                        {/if}
                                                    </button>
                                                {/each}
                                            </div>
                                            <div
                                                class="mt-4 flex justify-between"
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onclick={() => {
                                                        estimatedCompletionDate =
                                                            "";
                                                        showCalendar = false;
                                                    }}>Hapus</Button
                                                >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onclick={() =>
                                                        (showCalendar = false)}
                                                    >Tutup</Button
                                                >
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                                <p class="text-xs text-muted-foreground">
                                    Angka kuning menunjukkan jumlah service pada
                                    tanggal tersebut
                                </p>
                            {/if}
                        </div>
                    {/if}
                </div>

                <!-- Step 4: Confirmation -->
            {:else}
                <div class="space-y-6">
                    <div
                        class="p-3 rounded-lg {isWalkin
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-blue-50 border border-blue-200'}"
                    >
                        <Badge variant="secondary"
                            >{isWalkin
                                ? "Walk-in (Ditunggu)"
                                : "Reguler (Ditinggal)"}</Badge
                        >
                    </div>

                    <!-- Customer Summary -->
                    <div class="p-4 bg-muted/50 rounded-lg space-y-2">
                        <h4 class="font-semibold flex items-center gap-2">
                            <User class="h-4 w-4" /> Data Customer
                        </h4>
                        <div
                            class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm"
                        >
                            <div>
                                <span class="text-muted-foreground">Nama:</span>
                                <p class="font-medium">{customerName}</p>
                            </div>
                            {#if customerPhone}
                                <div>
                                    <span class="text-muted-foreground"
                                        >Telepon:</span
                                    >
                                    <p class="font-medium">{customerPhone}</p>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <!-- Device Summary -->
                    <div class="p-4 bg-muted/50 rounded-lg space-y-2">
                        <h4 class="font-semibold flex items-center gap-2">
                            <Smartphone class="h-4 w-4" /> Data Perangkat
                        </h4>
                        <div
                            class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm"
                        >
                            <div>
                                <span class="text-muted-foreground">Brand:</span
                                >
                                <p class="font-medium">{phoneBrand}</p>
                            </div>
                            <div>
                                <span class="text-muted-foreground">Model:</span
                                >
                                <p class="font-medium">{phoneModel}</p>
                            </div>
                            <div>
                                <span class="text-muted-foreground"
                                    >Status:</span
                                >
                                <Badge variant="outline"
                                    >{statusOptions.find(
                                        (s) => s.value === phoneStatus,
                                    )?.label}</Badge
                                >
                            </div>
                            {#if pinPattern}
                                <div>
                                    <span class="text-muted-foreground"
                                        >PIN/Pola:</span
                                    >
                                    <p class="font-medium font-mono">
                                        {pinPattern}
                                    </p>
                                </div>
                            {/if}
                        </div>
                        {#if completeness.length > 0}
                            <div>
                                <span class="text-muted-foreground text-sm"
                                    >Kelengkapan:</span
                                >
                                <div class="flex flex-wrap gap-1 mt-1">
                                    {#each completeness as item}
                                        <Badge
                                            variant="secondary"
                                            class="text-xs"
                                            >{completenessOptions.find(
                                                (o) => o.v === item,
                                            )?.l}</Badge
                                        >
                                    {/each}
                                </div>
                            </div>
                        {/if}
                        {#if physicalConditions.length > 0}
                            <div>
                                <span class="text-muted-foreground text-sm"
                                    >Kondisi Fisik:</span
                                >
                                <div class="flex flex-wrap gap-1 mt-1">
                                    {#each physicalConditions as item}
                                        <Badge variant="outline" class="text-xs"
                                            >{physicalOptions.find(
                                                (o) => o.v === item,
                                            )?.l}</Badge
                                        >
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>

                    <!-- Service Summary -->
                    <div class="p-4 bg-muted/50 rounded-lg space-y-2">
                        <h4 class="font-semibold flex items-center gap-2">
                            <Wrench class="h-4 w-4" /> Detail Service
                        </h4>
                        <div class="space-y-3 text-sm">
                            <div>
                                <span class="text-muted-foreground"
                                    >{isWalkin ? "Kerusakan" : "Keluhan"}:</span
                                >
                                <p class="font-medium">{complaint}</p>
                            </div>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <span class="text-muted-foreground"
                                        >Teknisi:</span
                                    >
                                    <p class="font-medium">
                                        {technicians.find(
                                            (t: any) => t.id === technician,
                                        )?.name || "Belum Ditentukan"}
                                    </p>
                                </div>
                                {#if isWalkin}
                                    <div>
                                        <span class="text-muted-foreground"
                                            >Total Biaya:</span
                                        >
                                        <p class="font-medium text-green-600">
                                            Rp {grandTotal.toLocaleString(
                                                "id-ID",
                                            )}
                                        </p>
                                    </div>
                                {:else}
                                    {#if isPriceRange && minPrice && maxPrice}
                                        <div>
                                            <span class="text-muted-foreground"
                                                >Estimasi Biaya:</span
                                            >
                                            <p class="font-medium">
                                                Rp {minPrice.toLocaleString(
                                                    "id-ID",
                                                )} - Rp {maxPrice.toLocaleString(
                                                    "id-ID",
                                                )}
                                            </p>
                                        </div>
                                    {:else if estimatedCost}
                                        <div>
                                            <span class="text-muted-foreground"
                                                >Estimasi Biaya:</span
                                            >
                                            <p class="font-medium">
                                                Rp {estimatedCost.toLocaleString(
                                                    "id-ID",
                                                )}
                                            </p>
                                        </div>
                                    {/if}
                                    {#if estimatedCompletionDate}
                                        <div>
                                            <span class="text-muted-foreground"
                                                >Estimasi Selesai:</span
                                            >
                                            <p class="font-medium">
                                                {new Date(
                                                    estimatedCompletionDate,
                                                ).toLocaleDateString("id-ID", {
                                                    weekday: "long",
                                                    day: "numeric",
                                                    month: "long",
                                                })}
                                            </p>
                                        </div>
                                    {/if}
                                {/if}
                            </div>
                            {#if !isWalkin && initialDiagnosis}
                                <div>
                                    <span class="text-muted-foreground"
                                        >Diagnosa Awal:</span
                                    >
                                    <p class="font-medium">
                                        {initialDiagnosis}
                                    </p>
                                </div>
                            {/if}
                        </div>
                    </div>

                    {#if !technician && !isWalkin}
                        <div
                            class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2"
                        >
                            <Clock class="h-4 w-4 text-yellow-600 mt-0.5" />
                            <div class="text-sm text-yellow-800">
                                <strong>Perhatian:</strong> Teknisi belum ditugaskan.
                                Service akan masuk ke antrian.
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}
        </CardContent>

        <CardFooter class="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
                {#if currentStep > 1}
                    <Button variant="outline" onclick={prevStep}>
                        <ArrowLeft class="h-4 w-4 mr-2" />
                        Sebelumnya
                    </Button>
                {/if}
            </div>
            <div class="flex gap-2">
                {#if currentStep < 4}
                    <Button onclick={nextStep}>
                        Selanjutnya
                        <ArrowRight class="h-4 w-4 ml-2" />
                    </Button>
                {:else}
                    <Button
                        onclick={handleSubmit}
                        disabled={isSubmitting}
                        class="min-w-32"
                    >
                        {#if isSubmitting}
                            <span class="animate-spin mr-2">⏳</span>
                            Menyimpan...
                        {:else}
                            <CheckCircle class="h-4 w-4 mr-2" />
                            {isWalkin ? "Selesaikan Service" : "Buat Service"}
                        {/if}
                    </Button>
                {/if}
            </div>
        </CardFooter>
    </Card>
</div>

<!-- Pattern Lock Dialog -->
<Dialog bind:open={isPatternOpen}>
    <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
            <DialogTitle>Input Pola Kunci</DialogTitle>
            <DialogDescription>Gambar pola kunci handphone.</DialogDescription>
        </DialogHeader>
        <div class="flex flex-col items-center justify-center py-4">
            <PatternLock
                size={300}
                on:change={handlePatternChange}
                bind:value={patternPoints}
            />
            <p class="text-center mt-2 font-mono tracking-widest">
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
            <Button onclick={handleSavePattern}>Simpan Pola</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>

<!-- Inventory Modal -->
{#if showInventoryModal}
    <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
        <div
            class="bg-background p-6 rounded-lg w-full max-w-md max-h-[80vh] overflow-auto"
        >
            <h3 class="font-semibold mb-4">Pilih dari Inventory</h3>
            <Input
                bind:value={searchTerm}
                placeholder="Cari sparepart..."
                class="mb-4"
            />
            <div class="space-y-2 max-h-60 overflow-y-auto">
                {#each filteredInventory as item}
                    <button
                        type="button"
                        onclick={() => addInventoryPart(item)}
                        class="w-full flex justify-between items-center p-3 border rounded-lg hover:bg-muted transition-colors text-left"
                    >
                        <div>
                            <p class="font-medium text-sm">{item.name}</p>
                            <p class="text-xs text-muted-foreground">
                                Stok: {item.stock}
                            </p>
                        </div>
                        <span class="font-medium"
                            >Rp {parseInt(
                                item.batches?.[0]?.sellPrice || 0,
                            ).toLocaleString("id-ID")}</span
                        >
                    </button>
                {/each}
                {#if filteredInventory.length === 0}
                    <p class="text-center text-muted-foreground py-4">
                        Tidak ada item ditemukan
                    </p>
                {/if}
            </div>
            <div class="mt-4 flex justify-end">
                <Button
                    variant="outline"
                    onclick={() => (showInventoryModal = false)}>Tutup</Button
                >
            </div>
        </div>
    </div>
{/if}
