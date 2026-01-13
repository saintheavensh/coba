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
    import {
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
    } from "$lib/components/ui/tabs";
    import { Separator } from "$lib/components/ui/separator";
    import { toast } from "svelte-sonner";
    import {
        Store,
        User,
        Shield,
        Users,
        Plus,
        Trash2,
        Settings,
        Receipt,
        Wrench,
        MessageCircle,
        CreditCard,
        Save,
        Loader2,
        MinusCircle,
        Printer,
        RefreshCw,
    } from "lucide-svelte";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/components/ui/table";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/components/ui/dialog";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";
    import { Badge } from "$lib/components/ui/badge";
    import { Textarea } from "$lib/components/ui/textarea";
    import { Switch } from "$lib/components/ui/switch";
    import { onMount } from "svelte";
    import {
        SettingsService,
        PaymentMethodsService,
        type StoreInfo,
        type ReceiptSettings,
        type ServiceSettings,
        type WhatsAppSettings,
        type PaymentMethod,
        type WarrantyPreset,
        PAYMENT_ICONS,
        PAYMENT_TYPES,
        PRINTER_TYPES,
        PAPER_SIZES,
    } from "$lib/services/settings.service";
    import {
        createQuery,
        createMutation,
        useQueryClient,
    } from "@tanstack/svelte-query";
    import { api } from "$lib/api";

    const queryClient = useQueryClient();

    // ============================================
    // STATE
    // ============================================

    let activeTab = $state("store");
    let saving = $state(false);

    // Store Info
    let storeInfo = $state<StoreInfo>({
        name: "",
        address: "",
        phone: "",
        email: "",
        logo: "",
        socialMedia: "",
    });

    // Receipt Settings
    let receiptSettings = $state<ReceiptSettings>({
        showLogo: true,
        headerText: "",
        footerText: "",
        termsConditions: "",
        showCustomerPhone: true,
        showCustomerAddress: false,
        showImei: false,
        showSparepartDetails: false,
        showTechnicianName: true,
        showWarrantyInfo: true,
        printerType: "thermal",
        paperSize: "58mm",
        printCopies: 1,
    });

    // Service Settings
    let serviceSettings = $state<ServiceSettings>({
        numberFormat: "SRV-{YYYY}-{XXX}",
        resetCounterYearly: true,
        defaultStatus: "antrian",
        autoNotifyOnStatusChange: false,
        warrantyPresets: [],
        defaultWarrantyDays: 7,
        gracePeriodDays: 3,
        autoCloseAfterDays: 30,
        reminderBeforePickup: true,
        reminderDays: 7,
    });

    // WhatsApp Settings
    let whatsappSettings = $state<WhatsAppSettings>({
        enabled: false,
        phoneNumber: "",
        newServiceTemplate: "",
        statusUpdateTemplate: "",
        readyForPickupTemplate: "",
        warrantyReminderTemplate: "",
        autoSendOnNewService: false,
        autoSendOnStatusChange: false,
        autoSendOnComplete: false,
    });

    // New warranty preset form
    let newPresetLabel = $state("");
    let newPresetDays = $state(0);

    // Payment Methods
    let paymentMethods = $state<PaymentMethod[]>([]);
    let showAddMethod = $state(false);
    let newMethod = $state({
        name: "",
        icon: "💳",
        type: "custom" as const,
    });
    let newVariantByMethod = $state<
        Record<
            string,
            { name: string; accountNumber: string; accountHolder: string }
        >
    >({});

    // ============================================
    // DATA LOADING
    // ============================================

    const settingsQuery = createQuery(() => ({
        queryKey: ["settings", "all"],
        queryFn: async () => {
            const all = await SettingsService.getAll();
            return all;
        },
    }));

    const paymentMethodsQuery = createQuery(() => ({
        queryKey: ["payment-methods"],
        queryFn: () => PaymentMethodsService.getAll(),
    }));

    const usersQuery = createQuery(() => ({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await api.get("/auth/users");
            return res.data.data || [];
        },
    }));

    // Sync query data to local state (only when query data changes)
    let initialDataLoaded = $state(false);

    $effect(() => {
        const data = settingsQuery.data;
        if (data && !initialDataLoaded) {
            initialDataLoaded = true;
            storeInfo = {
                name: data.storeInfo?.name || "",
                address: data.storeInfo?.address || "",
                phone: data.storeInfo?.phone || "",
                email: data.storeInfo?.email || "",
                logo: data.storeInfo?.logo || "",
                socialMedia: data.storeInfo?.socialMedia || "",
            };
            receiptSettings = {
                showLogo: data.receiptSettings?.showLogo ?? true,
                headerText: data.receiptSettings?.headerText || "",
                footerText: data.receiptSettings?.footerText || "",
                termsConditions: data.receiptSettings?.termsConditions || "",
                showCustomerPhone:
                    data.receiptSettings?.showCustomerPhone ?? true,
                showCustomerAddress:
                    data.receiptSettings?.showCustomerAddress ?? false,
                showImei: data.receiptSettings?.showImei ?? false,
                showSparepartDetails:
                    data.receiptSettings?.showSparepartDetails ?? false,
                showTechnicianName:
                    data.receiptSettings?.showTechnicianName ?? true,
                showWarrantyInfo:
                    data.receiptSettings?.showWarrantyInfo ?? true,
                printerType: data.receiptSettings?.printerType || "thermal",
                paperSize: data.receiptSettings?.paperSize || "58mm",
                printCopies: data.receiptSettings?.printCopies || 1,
            };
            serviceSettings = {
                numberFormat:
                    data.serviceSettings?.numberFormat || "SRV-{YYYY}-{XXX}",
                resetCounterYearly:
                    data.serviceSettings?.resetCounterYearly ?? true,
                defaultStatus: data.serviceSettings?.defaultStatus || "antrian",
                autoNotifyOnStatusChange:
                    data.serviceSettings?.autoNotifyOnStatusChange ?? false,
                warrantyPresets: data.serviceSettings?.warrantyPresets || [],
                defaultWarrantyDays:
                    data.serviceSettings?.defaultWarrantyDays || 7,
                gracePeriodDays: data.serviceSettings?.gracePeriodDays || 3,
                autoCloseAfterDays:
                    data.serviceSettings?.autoCloseAfterDays || 30,
                reminderBeforePickup:
                    data.serviceSettings?.reminderBeforePickup ?? true,
                reminderDays: data.serviceSettings?.reminderDays || 7,
            };
            whatsappSettings = {
                enabled: data.whatsappSettings?.enabled ?? false,
                phoneNumber: data.whatsappSettings?.phoneNumber || "",
                newServiceTemplate:
                    data.whatsappSettings?.newServiceTemplate || "",
                statusUpdateTemplate:
                    data.whatsappSettings?.statusUpdateTemplate || "",
                readyForPickupTemplate:
                    data.whatsappSettings?.readyForPickupTemplate || "",
                warrantyReminderTemplate:
                    data.whatsappSettings?.warrantyReminderTemplate || "",
                autoSendOnNewService:
                    data.whatsappSettings?.autoSendOnNewService ?? false,
                autoSendOnStatusChange:
                    data.whatsappSettings?.autoSendOnStatusChange ?? false,
                autoSendOnComplete:
                    data.whatsappSettings?.autoSendOnComplete ?? false,
            };
        }
    });

    $effect(() => {
        const data = paymentMethodsQuery.data;
        if (data) {
            paymentMethods = data as PaymentMethod[];
        }
    });

    // ============================================
    // SAVE FUNCTIONS
    // ============================================

    async function saveStoreInfo() {
        saving = true;
        try {
            await SettingsService.setStoreInfo(storeInfo);
            toast.success("Informasi toko berhasil disimpan");
            queryClient.invalidateQueries({ queryKey: ["settings"] });
        } catch (e) {
            toast.error("Gagal menyimpan informasi toko");
        } finally {
            saving = false;
        }
    }

    async function saveReceiptSettings() {
        saving = true;
        try {
            await SettingsService.setReceiptSettings(receiptSettings);
            toast.success("Pengaturan nota berhasil disimpan");
            queryClient.invalidateQueries({ queryKey: ["settings"] });
        } catch (e) {
            toast.error("Gagal menyimpan pengaturan nota");
        } finally {
            saving = false;
        }
    }

    async function saveServiceSettings() {
        saving = true;
        try {
            await SettingsService.setServiceSettings(serviceSettings);
            toast.success("Pengaturan service berhasil disimpan");
            queryClient.invalidateQueries({ queryKey: ["settings"] });
        } catch (e) {
            toast.error("Gagal menyimpan pengaturan service");
        } finally {
            saving = false;
        }
    }

    async function saveWhatsAppSettings() {
        saving = true;
        try {
            await SettingsService.setWhatsAppSettings(whatsappSettings);
            toast.success("Pengaturan WhatsApp berhasil disimpan");
            queryClient.invalidateQueries({ queryKey: ["settings"] });
        } catch (e) {
            toast.error("Gagal menyimpan pengaturan WhatsApp");
        } finally {
            saving = false;
        }
    }

    // ============================================
    // WARRANTY PRESETS
    // ============================================

    function addPreset() {
        if (!newPresetLabel || newPresetDays < 0) return;
        serviceSettings.warrantyPresets = [
            ...serviceSettings.warrantyPresets,
            { label: newPresetLabel, days: newPresetDays },
        ];
        newPresetLabel = "";
        newPresetDays = 0;
    }

    function removePreset(index: number) {
        serviceSettings.warrantyPresets =
            serviceSettings.warrantyPresets.filter((_, i) => i !== index);
    }

    // ============================================
    // PAYMENT METHODS
    // ============================================

    async function addPaymentMethod() {
        if (!newMethod.name) return;
        saving = true;
        try {
            await PaymentMethodsService.create({
                name: newMethod.name,
                type: newMethod.type,
                icon: newMethod.icon,
            });
            await queryClient.invalidateQueries({
                queryKey: ["payment-methods"],
            });
            newMethod = { name: "", icon: "💳", type: "custom" };
            showAddMethod = false;
            toast.success("Metode pembayaran berhasil ditambahkan");
        } catch (e) {
            toast.error("Gagal menambah metode pembayaran");
        } finally {
            saving = false;
        }
    }

    async function togglePaymentMethod(id: string, enabled: boolean) {
        try {
            await PaymentMethodsService.update(id, { enabled });
            await queryClient.invalidateQueries({
                queryKey: ["payment-methods"],
            });
        } catch (e) {
            toast.error("Gagal mengubah status metode");
        }
    }

    async function removePaymentMethod(id: string) {
        try {
            await PaymentMethodsService.disable(id);
            await queryClient.invalidateQueries({
                queryKey: ["payment-methods"],
            });
            toast.success("Metode pembayaran dinonaktifkan");
        } catch (e) {
            toast.error("Gagal menonaktifkan metode");
        }
    }

    function getNewVariant(methodId: string) {
        if (!newVariantByMethod[methodId]) {
            newVariantByMethod[methodId] = {
                name: "",
                accountNumber: "",
                accountHolder: "",
            };
        }
        return newVariantByMethod[methodId];
    }

    async function addVariant(methodId: string) {
        const variant = newVariantByMethod[methodId];
        if (!variant?.name) return;
        saving = true;
        try {
            await PaymentMethodsService.addVariant(methodId, {
                name: variant.name,
                accountNumber: variant.accountNumber || undefined,
                accountHolder: variant.accountHolder || undefined,
            });
            await queryClient.invalidateQueries({
                queryKey: ["payment-methods"],
            });
            newVariantByMethod[methodId] = {
                name: "",
                accountNumber: "",
                accountHolder: "",
            };
            toast.success("Varian berhasil ditambahkan");
        } catch (e) {
            toast.error("Gagal menambah varian");
        } finally {
            saving = false;
        }
    }

    async function removeVariant(methodId: string, variantId: string) {
        try {
            await PaymentMethodsService.disableVariant(methodId, variantId);
            await queryClient.invalidateQueries({
                queryKey: ["payment-methods"],
            });
            toast.success("Varian dinonaktifkan");
        } catch (e) {
            toast.error("Gagal menonaktifkan varian");
        }
    }

    // ============================================
    // PAPER SIZE OPTIONS
    // ============================================

    let availablePaperSizes = $derived(
        PAPER_SIZES[receiptSettings.printerType as keyof typeof PAPER_SIZES] ||
            PAPER_SIZES.thermal,
    );
</script>

<div class="space-y-6">
    <div>
        <h3 class="text-lg font-medium">Pengaturan</h3>
        <p class="text-sm text-muted-foreground">
            Kelola preferensi aplikasi, informasi toko, dan notifikasi.
        </p>
    </div>
    <Separator />

    <Tabs bind:value={activeTab} class="space-y-4">
        <TabsList
            class="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1"
        >
            <TabsTrigger value="store" class="flex gap-2 min-w-fit">
                <Store class="h-4 w-4" /> Informasi Toko
            </TabsTrigger>
            <TabsTrigger value="receipt" class="flex gap-2 min-w-fit">
                <Receipt class="h-4 w-4" /> Nota & Struk
            </TabsTrigger>
            <TabsTrigger value="service" class="flex gap-2 min-w-fit">
                <Wrench class="h-4 w-4" /> Pengaturan Service
            </TabsTrigger>
            <TabsTrigger value="whatsapp" class="flex gap-2 min-w-fit">
                <MessageCircle class="h-4 w-4" /> WhatsApp
            </TabsTrigger>
            <TabsTrigger value="payment" class="flex gap-2 min-w-fit">
                <CreditCard class="h-4 w-4" /> Pembayaran
            </TabsTrigger>
            <TabsTrigger value="employees" class="flex gap-2 min-w-fit">
                <Users class="h-4 w-4" /> Karyawan
            </TabsTrigger>
            <TabsTrigger value="account" class="flex gap-2 min-w-fit">
                <User class="h-4 w-4" /> Akun Saya
            </TabsTrigger>
        </TabsList>

        <!-- ============================================ -->
        <!-- TAB: INFORMASI TOKO -->
        <!-- ============================================ -->
        <TabsContent value="store">
            <Card>
                <CardHeader>
                    <CardTitle>Profil Toko</CardTitle>
                    <CardDescription>
                        Informasi ini akan ditampilkan pada nota dan laporan.
                    </CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="storeName">Nama Toko</Label>
                            <Input
                                id="storeName"
                                bind:value={storeInfo.name}
                                placeholder="Nama toko Anda"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="storePhone">Nomor Telepon / WA</Label>
                            <Input
                                id="storePhone"
                                bind:value={storeInfo.phone}
                                type="tel"
                                placeholder="0812-xxxx-xxxx"
                            />
                        </div>
                    </div>
                    <div class="space-y-2">
                        <Label for="storeAddress">Alamat Lengkap</Label>
                        <Textarea
                            id="storeAddress"
                            bind:value={storeInfo.address}
                            rows={2}
                            placeholder="Jl. Contoh No. 123, Kota"
                        />
                    </div>
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="storeEmail">Email (Opsional)</Label>
                            <Input
                                id="storeEmail"
                                bind:value={storeInfo.email}
                                type="email"
                                placeholder="toko@email.com"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="storeSocial"
                                >Social Media (Opsional)</Label
                            >
                            <Input
                                id="storeSocial"
                                bind:value={storeInfo.socialMedia}
                                placeholder="@instagram_toko"
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onclick={saveStoreInfo} disabled={saving}>
                        {#if saving}
                            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                        {:else}
                            <Save class="mr-2 h-4 w-4" />
                        {/if}
                        Simpan Perubahan
                    </Button>
                </CardFooter>
            </Card>
        </TabsContent>

        <!-- ============================================ -->
        <!-- TAB: NOTA & STRUK -->
        <!-- ============================================ -->
        <TabsContent value="receipt">
            <Card>
                <CardHeader>
                    <CardTitle>Pengaturan Nota / Struk</CardTitle>
                    <CardDescription>
                        Kustomisasi tampilan nota penjualan dan service.
                    </CardDescription>
                </CardHeader>
                <CardContent class="space-y-6">
                    <!-- Header Settings -->
                    <div class="space-y-4">
                        <h4 class="font-medium flex items-center gap-2">
                            <Receipt class="h-4 w-4" /> Header Nota
                        </h4>
                        <div class="grid gap-4 md:grid-cols-2">
                            <div
                                class="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div>
                                    <Label>Tampilkan Logo</Label>
                                    <p class="text-xs text-muted-foreground">
                                        Logo toko di bagian atas
                                    </p>
                                </div>
                                <Switch
                                    bind:checked={receiptSettings.showLogo}
                                />
                            </div>
                        </div>
                        <div class="space-y-2">
                            <Label>Teks Header Tambahan</Label>
                            <Textarea
                                bind:value={receiptSettings.headerText}
                                placeholder="Teks tambahan di bawah nama toko"
                                rows={2}
                            />
                        </div>
                    </div>

                    <Separator />

                    <!-- Footer Settings -->
                    <div class="space-y-4">
                        <h4 class="font-medium">Footer Nota</h4>
                        <div class="space-y-2">
                            <Label>Catatan Footer</Label>
                            <Textarea
                                bind:value={receiptSettings.footerText}
                                placeholder="Terima kasih atas kepercayaan Anda"
                                rows={2}
                            />
                        </div>
                        <div class="space-y-2">
                            <Label>Syarat & Ketentuan</Label>
                            <Textarea
                                bind:value={receiptSettings.termsConditions}
                                placeholder="Barang yang sudah dibeli tidak dapat dikembalikan"
                                rows={2}
                            />
                        </div>
                    </div>

                    <Separator />

                    <!-- Display Options -->
                    <div class="space-y-4">
                        <h4 class="font-medium">Opsi Tampilan</h4>
                        <div class="grid gap-3 md:grid-cols-2">
                            <div
                                class="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <Label>Tampilkan No. HP Customer</Label>
                                <Switch
                                    bind:checked={
                                        receiptSettings.showCustomerPhone
                                    }
                                />
                            </div>
                            <div
                                class="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <Label>Tampilkan Alamat Customer</Label>
                                <Switch
                                    bind:checked={
                                        receiptSettings.showCustomerAddress
                                    }
                                />
                            </div>
                            <div
                                class="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <Label>Tampilkan IMEI</Label>
                                <Switch
                                    bind:checked={receiptSettings.showImei}
                                />
                            </div>
                            <div
                                class="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div>
                                    <Label>Tampilkan Detail Sparepart</Label>
                                    <p class="text-xs text-muted-foreground">
                                        OFF = Hanya total
                                    </p>
                                </div>
                                <Switch
                                    bind:checked={
                                        receiptSettings.showSparepartDetails
                                    }
                                />
                            </div>
                            <div
                                class="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <Label>Tampilkan Nama Teknisi</Label>
                                <Switch
                                    bind:checked={
                                        receiptSettings.showTechnicianName
                                    }
                                />
                            </div>
                            <div
                                class="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <Label>Tampilkan Info Garansi</Label>
                                <Switch
                                    bind:checked={
                                        receiptSettings.showWarrantyInfo
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <!-- Printer Settings -->
                    <div class="space-y-4">
                        <h4 class="font-medium flex items-center gap-2">
                            <Printer class="h-4 w-4" /> Pengaturan Printer
                        </h4>
                        <div class="grid gap-4 md:grid-cols-3">
                            <div class="space-y-2">
                                <Label>Jenis Printer</Label>
                                <Select
                                    type="single"
                                    bind:value={receiptSettings.printerType}
                                >
                                    <SelectTrigger>
                                        {PRINTER_TYPES.find(
                                            (p) =>
                                                p.id ===
                                                receiptSettings.printerType,
                                        )?.label || "Pilih"}
                                    </SelectTrigger>
                                    <SelectContent>
                                        {#each PRINTER_TYPES as pt}
                                            <SelectItem value={pt.id}
                                                >{pt.label}</SelectItem
                                            >
                                        {/each}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div class="space-y-2">
                                <Label>Ukuran Kertas</Label>
                                <Select
                                    type="single"
                                    bind:value={receiptSettings.paperSize}
                                >
                                    <SelectTrigger>
                                        {receiptSettings.paperSize || "Pilih"}
                                    </SelectTrigger>
                                    <SelectContent>
                                        {#each availablePaperSizes as ps}
                                            <SelectItem value={ps.id}
                                                >{ps.label}</SelectItem
                                            >
                                        {/each}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div class="space-y-2">
                                <Label>Jumlah Cetak Default</Label>
                                <Input
                                    type="number"
                                    bind:value={receiptSettings.printCopies}
                                    min={1}
                                    max={5}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onclick={saveReceiptSettings} disabled={saving}>
                        {#if saving}
                            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                        {:else}
                            <Save class="mr-2 h-4 w-4" />
                        {/if}
                        Simpan Pengaturan
                    </Button>
                </CardFooter>
            </Card>
        </TabsContent>

        <!-- ============================================ -->
        <!-- TAB: PENGATURAN SERVICE -->
        <!-- ============================================ -->
        <TabsContent value="service">
            <Card>
                <CardHeader>
                    <CardTitle>Pengaturan Service</CardTitle>
                    <CardDescription>
                        Konfigurasi workflow, penomoran, dan garansi service.
                    </CardDescription>
                </CardHeader>
                <CardContent class="space-y-6">
                    <!-- Numbering -->
                    <div class="space-y-4">
                        <h4 class="font-medium">Penomoran Service</h4>
                        <div class="grid gap-4 md:grid-cols-2">
                            <div class="space-y-2">
                                <Label>Format Nomor</Label>
                                <Input
                                    bind:value={serviceSettings.numberFormat}
                                    placeholder={"SRV-{YYYY}-{XXX}"}
                                />
                                <p class="text-xs text-muted-foreground">
                                    Gunakan {"{YYYY}"} untuk tahun, {"{XXX}"} untuk
                                    counter
                                </p>
                            </div>
                            <div
                                class="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div>
                                    <Label>Reset Counter Tiap Tahun</Label>
                                    <p class="text-xs text-muted-foreground">
                                        Counter dimulai dari 001 setiap tahun
                                        baru
                                    </p>
                                </div>
                                <Switch
                                    bind:checked={
                                        serviceSettings.resetCounterYearly
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <!-- Workflow -->
                    <div class="space-y-4">
                        <h4 class="font-medium">Workflow</h4>
                        <div class="grid gap-4 md:grid-cols-2">
                            <div class="space-y-2">
                                <Label>Status Default Service Baru</Label>
                                <Select
                                    type="single"
                                    bind:value={serviceSettings.defaultStatus}
                                >
                                    <SelectTrigger>
                                        {serviceSettings.defaultStatus ===
                                        "antrian"
                                            ? "Antrian"
                                            : "Proses"}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="antrian"
                                            >Antrian</SelectItem
                                        >
                                        <SelectItem value="proses"
                                            >Proses</SelectItem
                                        >
                                    </SelectContent>
                                </Select>
                            </div>
                            <div
                                class="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div>
                                    <Label
                                        >Auto-Notify Saat Status Berubah</Label
                                    >
                                    <p class="text-xs text-muted-foreground">
                                        Kirim notifikasi otomatis
                                    </p>
                                </div>
                                <Switch
                                    bind:checked={
                                        serviceSettings.autoNotifyOnStatusChange
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <!-- Warranty Presets -->
                    <div class="space-y-4">
                        <h4 class="font-medium">Opsi Garansi</h4>
                        <div class="border rounded-lg p-4 space-y-4">
                            <div class="grid gap-2 md:grid-cols-3">
                                <div class="space-y-1">
                                    <Label class="text-xs">Label</Label>
                                    <Input
                                        bind:value={newPresetLabel}
                                        placeholder="Garansi 1 Minggu"
                                    />
                                </div>
                                <div class="space-y-1">
                                    <Label class="text-xs">Durasi (Hari)</Label>
                                    <Input
                                        type="number"
                                        bind:value={newPresetDays}
                                        placeholder="7"
                                    />
                                </div>
                                <div class="flex items-end">
                                    <Button
                                        variant="secondary"
                                        onclick={addPreset}
                                        class="w-full"
                                    >
                                        <Plus class="mr-2 h-4 w-4" /> Tambah
                                    </Button>
                                </div>
                            </div>
                            <div class="space-y-2">
                                {#each serviceSettings.warrantyPresets as preset, i}
                                    <div
                                        class="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                                    >
                                        <span
                                            >{preset.label} ({preset.days} Hari)</span
                                        >
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            class="h-6 w-6 text-red-500"
                                            onclick={() => removePreset(i)}
                                        >
                                            <MinusCircle class="h-4 w-4" />
                                        </Button>
                                    </div>
                                {/each}
                            </div>
                        </div>
                        <div class="grid gap-4 md:grid-cols-2">
                            <div class="space-y-2">
                                <Label>Garansi Default (Hari)</Label>
                                <Input
                                    type="number"
                                    bind:value={
                                        serviceSettings.defaultWarrantyDays
                                    }
                                />
                            </div>
                            <div class="space-y-2">
                                <Label>Masa Tenggang Klaim (Hari)</Label>
                                <Input
                                    type="number"
                                    bind:value={serviceSettings.gracePeriodDays}
                                />
                                <p class="text-xs text-muted-foreground">
                                    Setelah garansi berakhir
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <!-- Automation -->
                    <div class="space-y-4">
                        <h4 class="font-medium">Otomatisasi</h4>
                        <div class="grid gap-4 md:grid-cols-2">
                            <div class="space-y-2">
                                <Label>Auto-Close Setelah (Hari)</Label>
                                <Input
                                    type="number"
                                    bind:value={
                                        serviceSettings.autoCloseAfterDays
                                    }
                                />
                                <p class="text-xs text-muted-foreground">
                                    Tutup otomatis service yang sudah selesai
                                </p>
                            </div>
                            <div
                                class="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div>
                                    <Label>Reminder Pengambilan</Label>
                                    <p class="text-xs text-muted-foreground">
                                        Ingatkan customer mengambil barang
                                    </p>
                                </div>
                                <Switch
                                    bind:checked={
                                        serviceSettings.reminderBeforePickup
                                    }
                                />
                            </div>
                        </div>
                        {#if serviceSettings.reminderBeforePickup}
                            <div class="space-y-2 max-w-xs">
                                <Label>Ingatkan Setelah (Hari)</Label>
                                <Input
                                    type="number"
                                    bind:value={serviceSettings.reminderDays}
                                />
                            </div>
                        {/if}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onclick={saveServiceSettings} disabled={saving}>
                        {#if saving}
                            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                        {:else}
                            <Save class="mr-2 h-4 w-4" />
                        {/if}
                        Simpan Pengaturan
                    </Button>
                </CardFooter>
            </Card>
        </TabsContent>

        <!-- ============================================ -->
        <!-- TAB: WHATSAPP -->
        <!-- ============================================ -->
        <TabsContent value="whatsapp">
            <Card>
                <CardHeader>
                    <div class="flex items-center justify-between">
                        <div>
                            <CardTitle>Integrasi WhatsApp</CardTitle>
                            <CardDescription>
                                Kirim notifikasi otomatis ke customer via
                                WhatsApp.
                            </CardDescription>
                        </div>
                        <div class="flex items-center gap-2">
                            <Label>Aktifkan</Label>
                            <Switch bind:checked={whatsappSettings.enabled} />
                        </div>
                    </div>
                </CardHeader>
                {#if whatsappSettings.enabled}
                    <CardContent class="space-y-6">
                        <!-- Phone Number -->
                        <div class="space-y-2 max-w-md">
                            <Label>Nomor WhatsApp Toko</Label>
                            <Input
                                bind:value={whatsappSettings.phoneNumber}
                                placeholder="6281234567890"
                            />
                            <p class="text-xs text-muted-foreground">
                                Format internasional tanpa + (contoh:
                                6281234567890)
                            </p>
                        </div>

                        <Separator />

                        <!-- Templates -->
                        <div class="space-y-4">
                            <h4 class="font-medium">Template Pesan</h4>
                            <p class="text-sm text-muted-foreground">
                                Gunakan placeholder: {"{customer}"}, {"{serviceNo}"},
                                {"{status}"}, {"{total}"}, {"{days}"}
                            </p>
                            <div class="space-y-4">
                                <div class="space-y-2">
                                    <Label>Service Baru</Label>
                                    <Textarea
                                        bind:value={
                                            whatsappSettings.newServiceTemplate
                                        }
                                        rows={3}
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Label>Update Status</Label>
                                    <Textarea
                                        bind:value={
                                            whatsappSettings.statusUpdateTemplate
                                        }
                                        rows={3}
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Label>Siap Diambil</Label>
                                    <Textarea
                                        bind:value={
                                            whatsappSettings.readyForPickupTemplate
                                        }
                                        rows={3}
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Label>Reminder Garansi</Label>
                                    <Textarea
                                        bind:value={
                                            whatsappSettings.warrantyReminderTemplate
                                        }
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <!-- Auto-Send Options -->
                        <div class="space-y-4">
                            <h4 class="font-medium">Kirim Otomatis</h4>
                            <div class="grid gap-3 md:grid-cols-3">
                                <div
                                    class="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <Label class="text-sm"
                                        >Saat Service Baru</Label
                                    >
                                    <Switch
                                        bind:checked={
                                            whatsappSettings.autoSendOnNewService
                                        }
                                    />
                                </div>
                                <div
                                    class="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <Label class="text-sm"
                                        >Saat Status Berubah</Label
                                    >
                                    <Switch
                                        bind:checked={
                                            whatsappSettings.autoSendOnStatusChange
                                        }
                                    />
                                </div>
                                <div
                                    class="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <Label class="text-sm">Saat Selesai</Label>
                                    <Switch
                                        bind:checked={
                                            whatsappSettings.autoSendOnComplete
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            onclick={saveWhatsAppSettings}
                            disabled={saving}
                        >
                            {#if saving}
                                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                            {:else}
                                <Save class="mr-2 h-4 w-4" />
                            {/if}
                            Simpan Pengaturan
                        </Button>
                    </CardFooter>
                {:else}
                    <CardContent>
                        <div class="text-center py-8 text-muted-foreground">
                            <MessageCircle
                                class="h-12 w-12 mx-auto mb-4 opacity-50"
                            />
                            <p>
                                Aktifkan integrasi WhatsApp untuk mengirim
                                notifikasi ke customer.
                            </p>
                        </div>
                    </CardContent>
                {/if}
            </Card>
        </TabsContent>

        <!-- ============================================ -->
        <!-- TAB: PEMBAYARAN -->
        <!-- ============================================ -->
        <TabsContent value="payment">
            <Card>
                <CardHeader class="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Metode Pembayaran</CardTitle>
                        <CardDescription>
                            Atur metode pembayaran yang tersedia.
                        </CardDescription>
                    </div>
                    <Button size="sm" onclick={() => (showAddMethod = true)}>
                        <Plus class="h-4 w-4 mr-1" /> Tambah Metode
                    </Button>
                </CardHeader>
                <CardContent>
                    {#if paymentMethodsQuery.isLoading}
                        <div class="flex items-center justify-center py-8">
                            <Loader2 class="h-6 w-6 animate-spin" />
                        </div>
                    {:else}
                        <div class="space-y-4">
                            {#each paymentMethods as method}
                                <div class="border rounded-lg p-4">
                                    <div
                                        class="flex items-center justify-between mb-3"
                                    >
                                        <div class="flex items-center gap-3">
                                            <span class="text-2xl"
                                                >{method.icon}</span
                                            >
                                            <div>
                                                <h4 class="font-medium">
                                                    {method.name}
                                                </h4>
                                                <Badge
                                                    variant="outline"
                                                    class="text-xs"
                                                    >{method.type}</Badge
                                                >
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <Switch
                                                checked={method.enabled}
                                                onCheckedChange={(checked) =>
                                                    togglePaymentMethod(
                                                        method.id,
                                                        checked,
                                                    )}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                class="text-red-500"
                                                onclick={() =>
                                                    removePaymentMethod(
                                                        method.id,
                                                    )}
                                            >
                                                <Trash2 class="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {#if method.type !== "cash"}
                                        <!-- Variants -->
                                        <div class="pl-10 space-y-2">
                                            {#if method.variants && method.variants.length > 0}
                                                {#each method.variants.filter((v) => v.enabled) as variant}
                                                    <div
                                                        class="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                                                    >
                                                        <div>
                                                            <span
                                                                class="font-medium"
                                                                >{variant.name}</span
                                                            >
                                                            {#if variant.accountNumber}
                                                                <span
                                                                    class="text-muted-foreground ml-2"
                                                                    >{variant.accountNumber}</span
                                                                >
                                                            {/if}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            class="h-6 w-6 text-red-500"
                                                            onclick={() =>
                                                                removeVariant(
                                                                    method.id,
                                                                    variant.id,
                                                                )}
                                                        >
                                                            <MinusCircle
                                                                class="h-4 w-4"
                                                            />
                                                        </Button>
                                                    </div>
                                                {/each}
                                            {/if}
                                            <!-- Add Variant Form -->
                                            <div
                                                class="grid gap-2 md:grid-cols-4 pt-2"
                                            >
                                                <Input
                                                    value={newVariantByMethod[
                                                        method.id
                                                    ]?.name || ""}
                                                    oninput={(e) => {
                                                        if (
                                                            !newVariantByMethod[
                                                                method.id
                                                            ]
                                                        ) {
                                                            newVariantByMethod[
                                                                method.id
                                                            ] = {
                                                                name: "",
                                                                accountNumber:
                                                                    "",
                                                                accountHolder:
                                                                    "",
                                                            };
                                                        }
                                                        newVariantByMethod[
                                                            method.id
                                                        ].name =
                                                            e.currentTarget.value;
                                                    }}
                                                    placeholder="Nama (BCA, Mandiri...)"
                                                />
                                                <Input
                                                    value={newVariantByMethod[
                                                        method.id
                                                    ]?.accountNumber || ""}
                                                    oninput={(e) => {
                                                        if (
                                                            !newVariantByMethod[
                                                                method.id
                                                            ]
                                                        ) {
                                                            newVariantByMethod[
                                                                method.id
                                                            ] = {
                                                                name: "",
                                                                accountNumber:
                                                                    "",
                                                                accountHolder:
                                                                    "",
                                                            };
                                                        }
                                                        newVariantByMethod[
                                                            method.id
                                                        ].accountNumber =
                                                            e.currentTarget.value;
                                                    }}
                                                    placeholder="No. Rekening"
                                                />
                                                <Input
                                                    value={newVariantByMethod[
                                                        method.id
                                                    ]?.accountHolder || ""}
                                                    oninput={(e) => {
                                                        if (
                                                            !newVariantByMethod[
                                                                method.id
                                                            ]
                                                        ) {
                                                            newVariantByMethod[
                                                                method.id
                                                            ] = {
                                                                name: "",
                                                                accountNumber:
                                                                    "",
                                                                accountHolder:
                                                                    "",
                                                            };
                                                        }
                                                        newVariantByMethod[
                                                            method.id
                                                        ].accountHolder =
                                                            e.currentTarget.value;
                                                    }}
                                                    placeholder="Nama Pemilik"
                                                />
                                                <Button
                                                    variant="secondary"
                                                    onclick={() =>
                                                        addVariant(method.id)}
                                                >
                                                    <Plus
                                                        class="h-4 w-4 mr-1"
                                                    /> Tambah
                                                </Button>
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {/if}
                </CardContent>
            </Card>

            <!-- Add Method Dialog -->
            <Dialog bind:open={showAddMethod}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Metode Pembayaran</DialogTitle>
                        <DialogDescription
                            >Buat metode pembayaran baru.</DialogDescription
                        >
                    </DialogHeader>
                    <div class="grid gap-4 py-4">
                        <div class="space-y-2">
                            <Label>Nama Metode</Label>
                            <Input
                                bind:value={newMethod.name}
                                placeholder="Contoh: GoPay, OVO, BCA"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label>Tipe</Label>
                            <select
                                class="w-full h-10 px-3 rounded-md border bg-background text-sm"
                                bind:value={newMethod.type}
                            >
                                {#each PAYMENT_TYPES as pt}
                                    <option value={pt.id}>{pt.label}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="space-y-2">
                            <Label>Pilih Ikon</Label>
                            <div class="flex flex-wrap gap-2">
                                {#each PAYMENT_ICONS as pi}
                                    <button
                                        type="button"
                                        class="p-3 text-2xl rounded-lg border-2 transition-all {newMethod.icon ===
                                        pi.icon
                                            ? 'border-primary bg-primary/10'
                                            : 'border-transparent bg-muted/50 hover:bg-muted'}"
                                        onclick={() =>
                                            (newMethod.icon = pi.icon)}
                                        title={pi.label}
                                    >
                                        {pi.icon}
                                    </button>
                                {/each}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onclick={addPaymentMethod} disabled={saving}>
                            {#if saving}
                                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                            {/if}
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TabsContent>

        <!-- ============================================ -->
        <!-- TAB: KARYAWAN -->
        <!-- ============================================ -->
        <TabsContent value="employees">
            <Card>
                <CardHeader class="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Daftar Karyawan</CardTitle>
                        <CardDescription>
                            Kelola akses pengguna aplikasi.
                        </CardDescription>
                    </div>
                    <Button
                        size="sm"
                        onclick={() =>
                            toast.info(
                                "Fitur tambah karyawan akan segera hadir",
                            )}
                    >
                        <Plus class="mr-2 h-4 w-4" /> Tambah Karyawan
                    </Button>
                </CardHeader>
                <CardContent>
                    {#if usersQuery.isLoading}
                        <div class="flex items-center justify-center py-8">
                            <Loader2 class="h-6 w-6 animate-spin" />
                        </div>
                    {:else}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {#each usersQuery.data || [] as user}
                                    <TableRow>
                                        <TableCell class="font-medium"
                                            >{user.name}</TableCell
                                        >
                                        <TableCell>{user.username}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline"
                                                >{user.role}</Badge
                                            >
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                class={user.isActive
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"}
                                            >
                                                {user.isActive
                                                    ? "Aktif"
                                                    : "Nonaktif"}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                {/each}
                            </TableBody>
                        </Table>
                    {/if}
                </CardContent>
            </Card>
        </TabsContent>

        <!-- ============================================ -->
        <!-- TAB: AKUN SAYA -->
        <!-- ============================================ -->
        <TabsContent value="account">
            <Card>
                <CardHeader>
                    <CardTitle>Akun Saya</CardTitle>
                    <CardDescription>
                        Informasi login dan keamanan akun.
                    </CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="text-center py-8 text-muted-foreground">
                        <User class="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Edit profil akun akan segera hadir.</p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
</div>
