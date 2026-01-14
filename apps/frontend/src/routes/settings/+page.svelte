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
        Pencil,
    } from "lucide-svelte";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
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
    import { settingsStore } from "$lib/stores/settings-store.svelte";
    import { AuthService } from "$lib/services/auth.service";
    import { browser } from "$app/environment";
    import QRCode from "qrcode";

    const queryClient = useQueryClient();

    // ============================================
    // STATE
    // ============================================

    let activeTab = $state("store");
    let saving = $state(false);
    let qrCodeDataUrl = $state("");

    $effect(() => {
        QRCode.toDataURL("SRV-2026-001", { width: 100, margin: 0 })
            .then((url) => (qrCodeDataUrl = url))
            .catch((err) => console.error(err));
    });

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
        showBarcode: false,
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

    // Employees State
    let showUserDialog = $state(false);
    let editingUser = $state<any>(null);
    let userForm = $state({
        username: "",
        password: "",
        name: "",
        role: "teknisi",
    });

    // Confirmation Dialog State
    let confirmDialog = $state({
        open: false,
        title: "",
        description: "",
        actionLabel: "",
        variant: "destructive" as "default" | "destructive",
        onConfirm: async () => {},
        isLoading: false,
    });

    function openConfirmDialog(
        title: string,
        description: string,
        actionLabel: string,
        onConfirm: () => Promise<void>,
        variant: "default" | "destructive" = "destructive",
    ) {
        confirmDialog = {
            open: true,
            title,
            description,
            actionLabel,
            variant,
            onConfirm,
            isLoading: false,
        };
    }

    async function handleConfirm() {
        confirmDialog.isLoading = true;
        try {
            await confirmDialog.onConfirm();
            confirmDialog.open = false;
        } finally {
            confirmDialog.isLoading = false;
        }
    }

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
                showBarcode: data.receiptSettings?.showBarcode ?? false,
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
            await settingsStore.refresh(); // Refresh global store
        } catch (e) {
            toast.error("Gagal menyimpan informasi toko");
        } finally {
            saving = false;
        }
    }

    function handleLogoUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                storeInfo.logo = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    async function saveReceiptSettings() {
        saving = true;
        try {
            await SettingsService.setReceiptSettings(receiptSettings);
            toast.success("Pengaturan nota berhasil disimpan");
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            await settingsStore.refresh(); // Refresh global store
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
            await settingsStore.refresh(); // Refresh global store
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
            await settingsStore.refresh(); // Refresh global store
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
    // EMPLOYEES
    // ============================================

    function openAddUser() {
        editingUser = null;
        userForm = { username: "", password: "", name: "", role: "teknisi" };
        showUserDialog = true;
    }

    function openEditUser(user: any) {
        editingUser = user;
        userForm = {
            username: user.username,
            password: "", // Leave blank if not changing
            name: user.name,
            role: user.role,
        };
        showUserDialog = true;
    }

    async function deleteUser(id: string) {
        openConfirmDialog(
            "Hapus Karyawan",
            "Apakah Anda yakin ingin menghapus karyawan ini? Tindakan ini tidak dapat dibatalkan.",
            "Hapus",
            async () => {
                try {
                    await AuthService.deleteUser(id);
                    toast.success("Karyawan berhasil dihapus");
                    queryClient.invalidateQueries({ queryKey: ["users"] });
                } catch (e) {
                    toast.error("Gagal menghapus karyawan: " + String(e));
                }
            },
        );
    }

    async function resetPassword() {
        if (!editingUser) return;
        openConfirmDialog(
            "Reset Password",
            "Apakah Anda yakin ingin mereset password user ini menjadi '12345'?",
            "Reset Password",
            async () => {
                try {
                    await AuthService.updateUser(editingUser.id, {
                        password: "12345",
                    });
                    toast.success("Password berhasil direset ke 12345");
                } catch (e) {
                    toast.error("Gagal mereset password: " + String(e));
                }
            },
        );
    }

    async function saveUser() {
        if (!userForm.username || !userForm.name) {
            toast.error("Please fill all required fields");
            return;
        }

        saving = true;
        try {
            if (editingUser) {
                // Update
                const data: any = {
                    name: userForm.name,
                    role: userForm.role,
                };
                await AuthService.updateUser(editingUser.id, data);
                if (userForm.password) {
                    // TODO: Separate password update if needed, currently API might not support it or handles it different
                    // Assuming updateUser endpoint might accept password in future or needs separate endpoint.
                    // For now just update info.
                }
                toast.success("User updated successfully");
            } else {
                // Create
                if (!userForm.password) {
                    toast.error("Password is required for new user");
                    return;
                }
                await AuthService.register(userForm);
                toast.success("User created successfully");
            }
            showUserDialog = false;
            queryClient.invalidateQueries({ queryKey: ["users"] });
        } catch (e) {
            toast.error("Failed to save user: " + String(e));
        } finally {
            saving = false;
        }
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

    // Track previous printer type to detect changes
    let previousPrinterType = $state<"thermal" | "inkjet" | "dotmatrix">(
        "thermal",
    );

    // Reset paper size when printer type changes
    $effect(() => {
        if (receiptSettings.printerType !== previousPrinterType) {
            previousPrinterType = receiptSettings.printerType;
            const sizes =
                PAPER_SIZES[
                    receiptSettings.printerType as keyof typeof PAPER_SIZES
                ] || PAPER_SIZES.thermal;
            if (sizes.length > 0) {
                receiptSettings.paperSize = sizes[0].id;
            }
        }
    });
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
                    <div class="space-y-2">
                        <Label for="storeLogo">Logo Toko</Label>
                        <div class="flex items-center gap-4">
                            {#if storeInfo.logo}
                                <div
                                    class="relative w-20 h-20 border rounded overflow-hidden"
                                >
                                    <img
                                        src={storeInfo.logo}
                                        alt="Store Logo"
                                        class="w-full h-full object-contain"
                                    />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        class="absolute top-0 right-0 h-5 w-5 rounded-full"
                                        onclick={() => (storeInfo.logo = "")}
                                    >
                                        <Trash2 class="h-3 w-3" />
                                    </Button>
                                </div>
                            {/if}
                            <Input
                                id="storeLogo"
                                type="file"
                                accept="image/*"
                                onchange={handleLogoUpload}
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
                            <div
                                class="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div>
                                    <Label>Tampilkan QR Code</Label>
                                    <p class="text-xs text-muted-foreground">
                                        QR Code nomor service
                                    </p>
                                </div>
                                <Switch
                                    bind:checked={receiptSettings.showBarcode}
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

                    <Separator />

                    <!-- Receipt Preview -->
                    <div class="space-y-4">
                        <h4 class="font-medium flex items-center gap-2">
                            <Receipt class="h-4 w-4" /> Preview Nota
                        </h4>
                        <p class="text-sm text-muted-foreground">
                            Tampilan perkiraan struk berdasarkan jenis printer
                            dan kertas yang dipilih.
                        </p>

                        <div
                            class="flex justify-center p-6 bg-muted/30 rounded-lg border-2 border-dashed"
                        >
                            {#if receiptSettings.printerType === "thermal"}
                                <!-- Thermal Printer Preview (58mm/80mm) -->
                                <div
                                    class="bg-white shadow-lg transition-all duration-300 font-mono text-xs leading-tight"
                                    style="width: {receiptSettings.paperSize ===
                                    '80mm'
                                        ? '280px'
                                        : '200px'}; padding: 12px 8px;"
                                >
                                    <!-- Header -->
                                    {#if receiptSettings.showLogo}
                                        <div
                                            class="text-center mb-2 border-b border-dashed border-gray-400 pb-2"
                                        >
                                            <div
                                                class="w-8 h-8 mx-auto mb-1 bg-gray-200 rounded flex items-center justify-center text-[8px] text-gray-500"
                                            >
                                                LOGO
                                            </div>
                                        </div>
                                    {/if}
                                    <div class="text-center mb-2">
                                        <div class="font-bold text-sm">
                                            {storeInfo.name || "NAMA TOKO ANDA"}
                                        </div>
                                        <div class="text-[10px] text-gray-600">
                                            {storeInfo.address ||
                                                "Jl. Contoh No. 123, Kota"}
                                        </div>
                                        <div class="text-[10px] text-gray-600">
                                            {storeInfo.phone ||
                                                "0812-xxxx-xxxx"}
                                        </div>
                                        {#if receiptSettings.headerText}
                                            <div
                                                class="text-[10px] text-gray-500 mt-1"
                                            >
                                                {receiptSettings.headerText}
                                            </div>
                                        {/if}
                                    </div>

                                    <div
                                        class="border-t border-dashed border-gray-400 my-2"
                                    ></div>

                                    <!-- Transaction Info -->
                                    <div class="text-[10px] space-y-0.5">
                                        <div class="flex justify-between">
                                            <span>No:</span>
                                            <span>SRV-2026-001</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span>Tanggal:</span>
                                            <span>14/01/2026 07:00</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span>Customer:</span>
                                            <span>John Doe</span>
                                        </div>
                                        {#if receiptSettings.showCustomerPhone}
                                            <div class="flex justify-between">
                                                <span>HP:</span>
                                                <span>0812-3456-7890</span>
                                            </div>
                                        {/if}
                                        {#if receiptSettings.showCustomerAddress}
                                            <div class="flex justify-between">
                                                <span>Alamat:</span>
                                                <span
                                                    class="text-right max-w-[100px] truncate"
                                                    >Jl. Sample</span
                                                >
                                            </div>
                                        {/if}
                                        {#if receiptSettings.showTechnicianName}
                                            <div class="flex justify-between">
                                                <span>Teknisi:</span>
                                                <span>Ahmad</span>
                                            </div>
                                        {/if}
                                    </div>

                                    <div
                                        class="border-t border-dashed border-gray-400 my-2"
                                    ></div>

                                    <!-- Items -->
                                    <div class="text-[10px] space-y-1">
                                        <div>
                                            <div class="font-medium">
                                                iPhone 12 - Ganti LCD
                                            </div>
                                            {#if receiptSettings.showImei}
                                                <div class="text-gray-500">
                                                    IMEI: 35XXXXXX
                                                </div>
                                            {/if}
                                            {#if receiptSettings.showSparepartDetails}
                                                <div
                                                    class="flex justify-between pl-2"
                                                >
                                                    <span>Biaya Service</span>
                                                    <span>Rp 150.000</span>
                                                </div>
                                                <div
                                                    class="flex justify-between text-gray-600 pl-2"
                                                >
                                                    <span>Sparepart</span>
                                                    <span>Rp 850.000</span>
                                                </div>
                                            {:else}
                                                <div
                                                    class="flex justify-between"
                                                >
                                                    <span></span>
                                                    <span>Rp 1.000.000</span>
                                                </div>
                                            {/if}
                                        </div>
                                    </div>

                                    <div
                                        class="border-t border-dashed border-gray-400 my-2"
                                    ></div>

                                    <!-- Total -->
                                    <div class="text-[10px] space-y-0.5">
                                        <div
                                            class="flex justify-between font-bold"
                                        >
                                            <span>TOTAL</span>
                                            <span>Rp 1.000.000</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span>Bayar</span>
                                            <span>Rp 1.000.000</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span>Kembali</span>
                                            <span>Rp 0</span>
                                        </div>
                                    </div>

                                    {#if receiptSettings.showWarrantyInfo}
                                        <div
                                            class="border-t border-dashed border-gray-400 my-2"
                                        ></div>
                                        <div
                                            class="text-[10px] text-center text-gray-600"
                                        >
                                            <div class="font-medium">
                                                GARANSI: 30 HARI
                                            </div>
                                            <div>Berlaku s/d 14/02/2026</div>
                                        </div>
                                    {/if}

                                    {#if receiptSettings.showBarcode && qrCodeDataUrl}
                                        <div class="flex justify-center my-2">
                                            <div class="text-center">
                                                <img
                                                    src={qrCodeDataUrl}
                                                    alt="QR Code"
                                                    class="w-16 h-16 mx-auto"
                                                />
                                                <div
                                                    class="text-[9px] text-gray-600 mt-1 font-mono"
                                                >
                                                    SRV-2026-001
                                                </div>
                                            </div>
                                        </div>
                                    {/if}

                                    <div
                                        class="border-t border-dashed border-gray-400 my-2"
                                    ></div>

                                    <!-- Footer -->
                                    <div
                                        class="text-center text-[9px] text-gray-500 space-y-1"
                                    >
                                        {#if receiptSettings.footerText}
                                            <div>
                                                {receiptSettings.footerText}
                                            </div>
                                        {:else}
                                            <div>
                                                Terima kasih atas kepercayaan
                                                Anda
                                            </div>
                                        {/if}
                                        {#if receiptSettings.termsConditions}
                                            <div class="text-[8px]">
                                                {receiptSettings.termsConditions}
                                            </div>
                                        {:else}
                                            <div class="text-[8px]">
                                                Barang yang sudah dibeli tidak
                                                dapat dikembalikan
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            {:else if receiptSettings.printerType === "inkjet"}
                                <!-- Inkjet Printer Preview (A4/A5/Letter) -->
                                <div
                                    class="bg-white shadow-lg transition-all duration-300 text-sm"
                                    style="width: {receiptSettings.paperSize ===
                                    'A5'
                                        ? '320px'
                                        : '400px'}; padding: 24px;"
                                >
                                    <!-- Header -->
                                    <div
                                        class="flex items-start justify-between mb-4 pb-4 border-b-2 border-gray-800"
                                    >
                                        <div class="flex items-center gap-4">
                                            {#if receiptSettings.showLogo}
                                                <div
                                                    class="w-14 h-14 bg-gray-100 border rounded flex items-center justify-center text-xs text-gray-400"
                                                >
                                                    LOGO
                                                </div>
                                            {/if}
                                            <div>
                                                <div class="font-bold text-lg">
                                                    {storeInfo.name ||
                                                        "NAMA TOKO ANDA"}
                                                </div>
                                                <div
                                                    class="text-xs text-gray-600"
                                                >
                                                    {storeInfo.address ||
                                                        "Jl. Contoh No. 123, Kota"}
                                                </div>
                                                <div
                                                    class="text-xs text-gray-600"
                                                >
                                                    {storeInfo.phone ||
                                                        "0812-xxxx-xxxx"}
                                                    {storeInfo.email
                                                        ? `| ${storeInfo.email}`
                                                        : ""}
                                                </div>
                                            </div>
                                        </div>
                                        <div class="text-right text-xs">
                                            <div class="font-bold text-base">
                                                NOTA SERVICE
                                            </div>
                                            <div class="text-gray-600">
                                                No: SRV-2026-001
                                            </div>
                                            <div class="text-gray-600">
                                                14 Jan 2026
                                            </div>
                                        </div>
                                    </div>

                                    {#if receiptSettings.headerText}
                                        <div
                                            class="text-center text-sm text-gray-600 mb-4 italic"
                                        >
                                            {receiptSettings.headerText}
                                        </div>
                                    {/if}

                                    <!-- Customer Info -->
                                    <div
                                        class="grid grid-cols-2 gap-4 mb-4 text-sm"
                                    >
                                        <div class="bg-gray-50 p-3 rounded">
                                            <div
                                                class="font-medium text-gray-700 mb-1"
                                            >
                                                Informasi Customer
                                            </div>
                                            <div>John Doe</div>
                                            {#if receiptSettings.showCustomerPhone}
                                                <div class="text-gray-600">
                                                    HP: 0812-3456-7890
                                                </div>
                                            {/if}
                                            {#if receiptSettings.showCustomerAddress}
                                                <div class="text-gray-600">
                                                    Jl. Sample No. 123
                                                </div>
                                            {/if}
                                        </div>
                                        <div class="bg-gray-50 p-3 rounded">
                                            <div
                                                class="font-medium text-gray-700 mb-1"
                                            >
                                                Informasi Device
                                            </div>
                                            <div>iPhone 12 Pro Max</div>
                                            {#if receiptSettings.showImei}
                                                <div class="text-gray-600">
                                                    IMEI: 35XXXXXXXXXX001
                                                </div>
                                            {/if}
                                            <div class="text-gray-600">
                                                Keluhan: LCD Rusak
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Items Table -->
                                    <table class="w-full text-sm mb-4">
                                        <thead>
                                            <tr
                                                class="border-y border-gray-300"
                                            >
                                                <th
                                                    class="text-left py-2 font-medium"
                                                    >Deskripsi</th
                                                >
                                                <th
                                                    class="text-right py-2 font-medium"
                                                    >Harga</th
                                                >
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr
                                                class="border-b border-gray-200 bg-gray-50"
                                            >
                                                <td
                                                    class="py-2 font-medium"
                                                    colspan="2"
                                                    >iPhone 12 - Ganti LCD</td
                                                >
                                            </tr>
                                            {#if receiptSettings.showSparepartDetails}
                                                <tr
                                                    class="border-b border-gray-200"
                                                >
                                                    <td
                                                        class="py-2 pl-4 text-gray-600"
                                                        >Biaya Service</td
                                                    >
                                                    <td class="text-right py-2"
                                                        >Rp 150.000</td
                                                    >
                                                </tr>
                                                <tr
                                                    class="border-b border-gray-200"
                                                >
                                                    <td
                                                        class="py-2 pl-4 text-gray-600"
                                                        >Sparepart</td
                                                    >
                                                    <td class="text-right py-2"
                                                        >Rp 850.000</td
                                                    >
                                                </tr>
                                            {:else}
                                                <tr
                                                    class="border-b border-gray-200"
                                                >
                                                    <td class="py-2 pl-4"></td>
                                                    <td class="text-right py-2"
                                                        >Rp 1.000.000</td
                                                    >
                                                </tr>
                                            {/if}
                                        </tbody>
                                        <tfoot>
                                            <tr class="font-bold">
                                                <td class="py-2">TOTAL</td>
                                                <td class="text-right py-2"
                                                    >Rp 1.000.000</td
                                                >
                                            </tr>
                                        </tfoot>
                                    </table>

                                    <!-- Payment & Warranty -->
                                    <div
                                        class="grid grid-cols-2 gap-4 mb-4 text-sm"
                                    >
                                        <div>
                                            <div class="font-medium mb-1">
                                                Pembayaran
                                            </div>
                                            <div class="text-gray-600">
                                                Transfer Bank BCA
                                            </div>
                                            <div class="text-gray-600">
                                                Lunas: Rp 1.000.000
                                            </div>
                                        </div>
                                        {#if receiptSettings.showWarrantyInfo}
                                            <div>
                                                <div class="font-medium mb-1">
                                                    Garansi
                                                </div>
                                                <div class="text-gray-600">
                                                    30 Hari
                                                </div>
                                                <div class="text-gray-600">
                                                    Berlaku: 14/01/2026 -
                                                    14/02/2026
                                                </div>
                                            </div>
                                        {/if}
                                    </div>

                                    {#if receiptSettings.showTechnicianName}
                                        <div class="text-sm text-gray-600 mb-4">
                                            Ditangani oleh: <span
                                                class="font-medium"
                                                >Ahmad (Teknisi)</span
                                            >
                                        </div>
                                    {/if}

                                    {#if receiptSettings.showBarcode && qrCodeDataUrl}
                                        <!-- QR Code -->
                                        <div class="flex justify-center mb-4">
                                            <div class="text-center">
                                                <div
                                                    class="bg-white p-2 border inline-block"
                                                >
                                                    <img
                                                        src={qrCodeDataUrl}
                                                        alt="QR Code"
                                                        class="w-16 h-16"
                                                    />
                                                    <div
                                                        class="text-[10px] text-gray-600 mt-1 font-mono"
                                                    >
                                                        SRV-2026-001
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    {/if}

                                    <!-- Footer -->
                                    <div
                                        class="border-t-2 border-gray-800 pt-3 text-center text-xs text-gray-500"
                                    >
                                        {#if receiptSettings.footerText}
                                            <div class="mb-1">
                                                {receiptSettings.footerText}
                                            </div>
                                        {:else}
                                            <div class="mb-1">
                                                Terima kasih atas kepercayaan
                                                Anda
                                            </div>
                                        {/if}
                                        {#if receiptSettings.termsConditions}
                                            <div class="text-[10px]">
                                                {receiptSettings.termsConditions}
                                            </div>
                                        {:else}
                                            <div class="text-[10px]">
                                                Barang yang sudah diambil tidak
                                                dapat dikembalikan
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            {:else if receiptSettings.printerType === "dotmatrix"}
                                <!-- Dot Matrix Printer Preview -->
                                <div
                                    class="bg-[#FFFEF0] shadow-lg transition-all duration-300 font-mono text-xs border-t-4 border-b-4 border-dashed border-gray-400"
                                    style="width: {receiptSettings.paperSize ===
                                    'A4'
                                        ? '400px'
                                        : '360px'}; padding: 16px 20px; background-image: repeating-linear-gradient(transparent, transparent 11px, rgba(0,0,0,0.03) 11px, rgba(0,0,0,0.03) 12px);"
                                >
                                    <!-- Perforation holes on sides -->
                                    <div
                                        class="absolute left-0 top-0 bottom-0 w-4 flex flex-col justify-around items-center opacity-30"
                                    >
                                        {#each Array(10) as _}
                                            <div
                                                class="w-2 h-2 rounded-full bg-gray-400"
                                            ></div>
                                        {/each}
                                    </div>

                                    <!-- Header -->
                                    <div
                                        class="text-center mb-3"
                                        style="letter-spacing: 0.5px;"
                                    >
                                        <div
                                            class="text-base font-bold tracking-wider"
                                        >
                                            {(
                                                storeInfo.name ||
                                                "NAMA TOKO ANDA"
                                            ).toUpperCase()}
                                        </div>
                                        <div class="text-[11px]">
                                            {storeInfo.address ||
                                                "Jl. Contoh No. 123, Kota"}
                                        </div>
                                        <div class="text-[11px]">
                                            Telp: {storeInfo.phone ||
                                                "0812-xxxx-xxxx"}
                                        </div>
                                        {#if receiptSettings.showLogo}
                                            <div
                                                class="text-[10px] text-gray-500 mt-1"
                                            >
                                                [LOGO]
                                            </div>
                                        {/if}
                                        {#if receiptSettings.headerText}
                                            <div class="text-[10px] mt-1">
                                                {receiptSettings.headerText}
                                            </div>
                                        {/if}
                                    </div>

                                    <div
                                        class="border-t border-gray-400 my-2"
                                        style="border-style: dashed;"
                                    ></div>
                                    <div
                                        class="text-center text-[11px] font-bold mb-2"
                                    >
                                        NOTA SERVICE
                                    </div>
                                    <div
                                        class="border-b border-gray-400 my-2"
                                        style="border-style: dashed;"
                                    ></div>

                                    <!-- Transaction details -->
                                    <div
                                        class="space-y-0.5 text-[11px]"
                                        style="letter-spacing: 0.3px;"
                                    >
                                        <div class="flex">
                                            <span class="w-24">No. Nota</span>
                                            <span>: SRV-2026-001</span>
                                        </div>
                                        <div class="flex">
                                            <span class="w-24">Tanggal</span>
                                            <span>: 14/01/2026 07:00</span>
                                        </div>
                                        <div class="flex">
                                            <span class="w-24">Customer</span>
                                            <span>: John Doe</span>
                                        </div>
                                        {#if receiptSettings.showCustomerPhone}
                                            <div class="flex">
                                                <span class="w-24">No. HP</span>
                                                <span>: 0812-3456-7890</span>
                                            </div>
                                        {/if}
                                        {#if receiptSettings.showCustomerAddress}
                                            <div class="flex">
                                                <span class="w-24">Alamat</span>
                                                <span>: Jl. Sample No. 123</span
                                                >
                                            </div>
                                        {/if}
                                        <div class="flex">
                                            <span class="w-24">Device</span>
                                            <span>: iPhone 12 Pro Max</span>
                                        </div>
                                        {#if receiptSettings.showImei}
                                            <div class="flex">
                                                <span class="w-24">IMEI</span>
                                                <span>: 35XXXXXXXXXX001</span>
                                            </div>
                                        {/if}
                                        <div class="flex">
                                            <span class="w-24">Keluhan</span>
                                            <span>: LCD Rusak/Pecah</span>
                                        </div>
                                        {#if receiptSettings.showTechnicianName}
                                            <div class="flex">
                                                <span class="w-24">Teknisi</span
                                                >
                                                <span>: Ahmad</span>
                                            </div>
                                        {/if}
                                    </div>

                                    <div
                                        class="my-3"
                                        style="border-top: 1px dashed #888;"
                                    ></div>

                                    <!-- Items -->
                                    <div
                                        class="text-[11px]"
                                        style="letter-spacing: 0.3px;"
                                    >
                                        <div
                                            class="flex justify-between font-bold mb-1"
                                        >
                                            <span>DESKRIPSI</span>
                                            <span>HARGA</span>
                                        </div>
                                        <div
                                            class="border-b border-gray-400 mb-1"
                                            style="border-style: dotted;"
                                        ></div>
                                        <div class="font-bold mb-1">
                                            iPhone 12 - Ganti LCD
                                        </div>
                                        {#if receiptSettings.showSparepartDetails}
                                            <div class="flex justify-between">
                                                <span> Biaya Service</span>
                                                <span>150.000</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span> Sparepart</span>
                                                <span>850.000</span>
                                            </div>
                                        {:else}
                                            <div class="flex justify-between">
                                                <span></span>
                                                <span>1.000.000</span>
                                            </div>
                                        {/if}
                                        <div
                                            class="border-t border-gray-400 mt-1 mb-1"
                                            style="border-style: dotted;"
                                        ></div>
                                        <div
                                            class="flex justify-between font-bold"
                                        >
                                            <span>TOTAL</span>
                                            <span>Rp 1.000.000</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span>BAYAR</span>
                                            <span>Rp 1.000.000</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span>KEMBALI</span>
                                            <span>Rp 0</span>
                                        </div>
                                    </div>

                                    {#if receiptSettings.showBarcode && qrCodeDataUrl}
                                        <div
                                            class="my-3"
                                            style="border-top: 1px dashed #888;"
                                        ></div>
                                        <div class="text-center my-2">
                                            <div
                                                class="inline-block bg-white p-1 border border-gray-300"
                                            >
                                                <img
                                                    src={qrCodeDataUrl}
                                                    alt="QR Code"
                                                    class="w-12 h-12 grayscale"
                                                />
                                                <div
                                                    class="text-[9px] font-bold mt-1 tracking-widest"
                                                >
                                                    SRV-2026-001
                                                </div>
                                            </div>
                                        </div>
                                    {/if}

                                    {#if receiptSettings.showWarrantyInfo}
                                        <div
                                            class="my-3"
                                            style="border-top: 1px dashed #888;"
                                        ></div>
                                        <div class="text-center text-[11px]">
                                            <div class="font-bold">
                                                *** GARANSI 30 HARI ***
                                            </div>
                                            <div>Berlaku s/d: 14/02/2026</div>
                                        </div>
                                    {/if}

                                    <div
                                        class="my-3"
                                        style="border-top: 1px dashed #888;"
                                    ></div>

                                    <!-- Footer -->
                                    <div class="text-center text-[10px]">
                                        {#if receiptSettings.footerText}
                                            <div>
                                                {receiptSettings.footerText}
                                            </div>
                                        {:else}
                                            <div>
                                                Terima kasih atas kepercayaan
                                                Anda
                                            </div>
                                        {/if}
                                        {#if receiptSettings.termsConditions}
                                            <div class="mt-1">
                                                {receiptSettings.termsConditions}
                                            </div>
                                        {:else}
                                            <div class="mt-1">
                                                Barang yg sudah diambil tidak
                                                dpt dikembalikan
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            {/if}
                        </div>

                        <!-- Printer type indicator -->
                        <div
                            class="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                        >
                            <Badge variant="outline">
                                {PRINTER_TYPES.find(
                                    (p) => p.id === receiptSettings.printerType,
                                )?.label || receiptSettings.printerType}
                            </Badge>
                            <span>•</span>
                            <Badge variant="outline">
                                {receiptSettings.paperSize}
                            </Badge>
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
                                                            {#if variant.accountHolder}
                                                                <span
                                                                    class="text-muted-foreground ml-2"
                                                                    >a.n. {variant.accountHolder}</span
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
                    <Button size="sm" onclick={openAddUser}>
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
                                    <TableHead class="text-right"
                                        >Aksi</TableHead
                                    >
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
                                        <TableCell class="text-right">
                                            <div class="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onclick={() =>
                                                        openEditUser(user)}
                                                >
                                                    <Pencil class="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    class="text-red-500"
                                                    onclick={() =>
                                                        deleteUser(user.id)}
                                                >
                                                    <Trash2 class="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                {/each}
                            </TableBody>
                        </Table>
                    {/if}
                </CardContent>
            </Card>

            <!-- User Dialog -->
            <Dialog bind:open={showUserDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle
                            >{editingUser
                                ? "Edit Karyawan"
                                : "Tambah Karyawan"}</DialogTitle
                        >
                        <DialogDescription>
                            {editingUser
                                ? "Perbarui data karyawan."
                                : "Tambahkan karyawan baru."}
                        </DialogDescription>
                    </DialogHeader>
                    <div class="grid gap-4 py-4">
                        <div class="space-y-2">
                            <Label>Nama Lengkap</Label>
                            <Input
                                bind:value={userForm.name}
                                placeholder="Nama Karyawan"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label>Username</Label>
                            <Input
                                bind:value={userForm.username}
                                placeholder="Username login"
                                disabled={!!editingUser}
                            />
                        </div>
                        {#if !editingUser}
                            <div class="space-y-2">
                                <Label>Password</Label>
                                <Input
                                    type="password"
                                    bind:value={userForm.password}
                                    placeholder="Password"
                                />
                            </div>
                        {/if}
                        <div class="space-y-2">
                            <Label>Role</Label>
                            <Select type="single" bind:value={userForm.role}>
                                <SelectTrigger>
                                    {userForm.role
                                        ? userForm.role
                                              .charAt(0)
                                              .toUpperCase() +
                                          userForm.role.slice(1)
                                        : "Pilih Role"}
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="teknisi"
                                        >Teknisi</SelectItem
                                    >
                                    <SelectItem value="kasir">Kasir</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter class="sm:justify-between">
                        {#if editingUser}
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onclick={resetPassword}
                                disabled={saving}>Reset Password</Button
                            >
                        {:else}
                            <div></div>
                        {/if}
                        <div class="flex gap-2">
                            <Button
                                variant="outline"
                                onclick={() => (showUserDialog = false)}
                                disabled={saving}>Batal</Button
                            >
                            <Button onclick={saveUser} disabled={saving}>
                                {#if saving}
                                    <Loader2
                                        class="mr-2 h-4 w-4 animate-spin"
                                    />
                                {/if}
                                Simpan
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <!-- Global Confirmation Dialog -->
            <AlertDialog.Root bind:open={confirmDialog.open}>
                <AlertDialog.Content>
                    <AlertDialog.Header>
                        <AlertDialog.Title
                            >{confirmDialog.title}</AlertDialog.Title
                        >
                        <AlertDialog.Description>
                            {confirmDialog.description}
                        </AlertDialog.Description>
                    </AlertDialog.Header>
                    <AlertDialog.Footer>
                        <AlertDialog.Cancel disabled={confirmDialog.isLoading}
                            >Batal</AlertDialog.Cancel
                        >
                        <AlertDialog.Action
                            onclick={handleConfirm}
                            disabled={confirmDialog.isLoading}
                            class={confirmDialog.variant === "destructive"
                                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                : ""}
                        >
                            {#if confirmDialog.isLoading}
                                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                            {/if}
                            {confirmDialog.actionLabel}
                        </AlertDialog.Action>
                    </AlertDialog.Footer>
                </AlertDialog.Content>
            </AlertDialog.Root>
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
                <CardContent class="space-y-6">
                    {#if browser}
                        {@const currentUser = AuthService.getUser()}
                        {#if currentUser}
                            <div
                                class="flex items-center gap-4 p-4 border rounded-lg bg-muted/30"
                            >
                                <div
                                    class="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary"
                                >
                                    {currentUser.name
                                        ?.charAt(0)
                                        ?.toUpperCase() || "U"}
                                </div>
                                <div>
                                    <h3 class="text-xl font-semibold">
                                        {currentUser.name}
                                    </h3>
                                    <Badge variant="outline" class="mt-1"
                                        >{currentUser.role}</Badge
                                    >
                                </div>
                            </div>
                            <Separator />
                            <div class="space-y-4">
                                <div class="grid gap-4 md:grid-cols-2">
                                    <div class="space-y-2">
                                        <Label>User ID</Label>
                                        <Input
                                            value={currentUser.id}
                                            disabled
                                        />
                                    </div>
                                    <div class="space-y-2">
                                        <Label>Role</Label>
                                        <Input
                                            value={currentUser.role}
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div
                                class="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/30"
                            >
                                <p
                                    class="text-sm text-amber-700 dark:text-amber-300"
                                >
                                    <strong>Info:</strong> Fitur ubah password dan
                                    edit profil akan segera hadir.
                                </p>
                            </div>
                        {:else}
                            <div class="text-center py-8 text-muted-foreground">
                                <User
                                    class="h-12 w-12 mx-auto mb-4 opacity-50"
                                />
                                <p>
                                    Tidak ada data user. Silakan login kembali.
                                </p>
                            </div>
                        {/if}
                    {:else}
                        <div class="text-center py-8 text-muted-foreground">
                            <Loader2
                                class="h-8 w-8 mx-auto mb-4 animate-spin"
                            />
                            <p>Memuat...</p>
                        </div>
                    {/if}
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
</div>
