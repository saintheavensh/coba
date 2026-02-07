import { toast } from "svelte-sonner";
import {
    SettingsService,
    PaymentMethodsService,
    type StoreInfo,
    type ReceiptSettings,
    type ServiceSettings,
    type WhatsAppSettings,
    type PaymentMethod,
    PAPER_SIZES,
} from "$lib/features/settings/settings.service";
import { createQuery, useQueryClient } from "@tanstack/svelte-query";
import { api } from "$lib/shared/core/api";
import { settingsStore } from "$lib/features/settings/settings-store.svelte";
import { AuthService } from "$lib/features/auth/auth.service";
import QRCode from "qrcode";

export class LegacySettingsController {
    // Active tab
    activeTab = $state("store");
    saving = $state(false);
    qrCodeDataUrl = $state("");

    // Store Info
    storeInfo = $state<StoreInfo>({
        name: "",
        address: "",
        phone: "",
        email: "",
        logo: "",
        socialMedia: "",
    });

    // Receipt Settings
    receiptSettings = $state<ReceiptSettings>({
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
    serviceSettings = $state<ServiceSettings>({
        numberFormat: "SRV-{YYYY}-{XXX}",
        resetCounterYearly: true,
        defaultStatus: "antrian",
        autoNotifyOnStatusChange: false,
        commissionModel: "completion",
        enableVirtualArchive: false,
        archiveExclusions: [],
        enableLiquidation: false,
        warrantyPresets: [],
        defaultWarrantyDays: 7,
        gracePeriodDays: 3,
        autoCloseAfterDays: 30,
        reminderBeforePickup: true,
        reminderDays: 7,
    });

    // WhatsApp Settings
    whatsappSettings = $state<WhatsAppSettings>({
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

    // Warranty preset form
    newPresetLabel = $state("");
    newPresetDays = $state(0);

    // Employees State
    showUserDialog = $state(false);
    editingUser = $state<any>(null);
    userForm = $state({
        username: "",
        password: "",
        name: "",
        role: "teknisi",
    });

    // Confirmation Dialog State
    confirmDialog = $state({
        open: false,
        title: "",
        description: "",
        actionLabel: "",
        variant: "destructive" as "default" | "destructive",
        onConfirm: async () => { },
        isLoading: false,
    });

    // Payment Methods
    paymentMethods = $state<PaymentMethod[]>([]);
    showAddMethod = $state(false);
    newMethod = $state({
        name: "",
        icon: "💳",
        type: "custom" as const,
    });
    newVariantByMethod = $state<
        Record<string, { name: string; accountNumber: string; accountHolder: string }>
    >({});

    // Data tracking
    private initialDataLoaded = $state(false);
    private queryClient = useQueryClient();
    private previousPrinterType = $state<"thermal" | "inkjet" | "dotmatrix">("thermal");

    // Queries
    settingsQuery = createQuery(() => ({
        queryKey: ["settings", "all"],
        queryFn: async () => {
            const all = await SettingsService.getAll();
            return all;
        },
    }));

    paymentMethodsQuery = createQuery(() => ({
        queryKey: ["payment-methods"],
        queryFn: () => PaymentMethodsService.getAll(),
    }));

    usersQuery = createQuery(() => ({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await api.get("/users");
            return res.data.data || [];
        },
    }));

    // Derived
    get availablePaperSizes() {
        return PAPER_SIZES[this.receiptSettings.printerType as keyof typeof PAPER_SIZES] || PAPER_SIZES.thermal;
    }

    constructor() {
        // Generate QR code
        QRCode.toDataURL("SRV-2026-001", { width: 100, margin: 0 })
            .then((url) => (this.qrCodeDataUrl = url))
            .catch((err) => console.error(err));
    }

    // Init - called from $effect in page
    syncSettingsData(data: any) {
        if (data && !this.initialDataLoaded) {
            this.initialDataLoaded = true;
            this.storeInfo = {
                name: data.storeInfo?.name || "",
                address: data.storeInfo?.address || "",
                phone: data.storeInfo?.phone || "",
                email: data.storeInfo?.email || "",
                logo: data.storeInfo?.logo || "",
                socialMedia: data.storeInfo?.socialMedia || "",
            };
            this.receiptSettings = {
                showLogo: data.receiptSettings?.showLogo ?? true,
                headerText: data.receiptSettings?.headerText || "",
                footerText: data.receiptSettings?.footerText || "",
                termsConditions: data.receiptSettings?.termsConditions || "",
                showCustomerPhone: data.receiptSettings?.showCustomerPhone ?? true,
                showCustomerAddress: data.receiptSettings?.showCustomerAddress ?? false,
                showImei: data.receiptSettings?.showImei ?? false,
                showSparepartDetails: data.receiptSettings?.showSparepartDetails ?? false,
                showTechnicianName: data.receiptSettings?.showTechnicianName ?? true,
                showWarrantyInfo: data.receiptSettings?.showWarrantyInfo ?? true,
                printerType: data.receiptSettings?.printerType || "thermal",
                paperSize: data.receiptSettings?.paperSize || "58mm",
                printCopies: data.receiptSettings?.printCopies || 1,
                showBarcode: data.receiptSettings?.showBarcode ?? false,
            };
            this.serviceSettings = {
                numberFormat: data.serviceSettings?.numberFormat || "SRV-{YYYY}-{XXX}",
                resetCounterYearly: data.serviceSettings?.resetCounterYearly ?? true,
                defaultStatus: data.serviceSettings?.defaultStatus || "antrian",
                autoNotifyOnStatusChange: data.serviceSettings?.autoNotifyOnStatusChange ?? false,
                commissionModel: data.serviceSettings?.commissionModel || "completion",
                enableVirtualArchive: data.serviceSettings?.enableVirtualArchive ?? false,
                archiveExclusions: data.serviceSettings?.archiveExclusions || [],
                enableLiquidation: data.serviceSettings?.enableLiquidation ?? false,
                warrantyPresets: data.serviceSettings?.warrantyPresets || [],
                defaultWarrantyDays: data.serviceSettings?.defaultWarrantyDays || 7,
                gracePeriodDays: data.serviceSettings?.gracePeriodDays || 3,
                autoCloseAfterDays: data.serviceSettings?.autoCloseAfterDays || 30,
                reminderBeforePickup: data.serviceSettings?.reminderBeforePickup ?? true,
                reminderDays: data.serviceSettings?.reminderDays || 7,
            };
            this.whatsappSettings = {
                enabled: data.whatsappSettings?.enabled ?? false,
                phoneNumber: data.whatsappSettings?.phoneNumber || "",
                newServiceTemplate: data.whatsappSettings?.newServiceTemplate || "",
                statusUpdateTemplate: data.whatsappSettings?.statusUpdateTemplate || "",
                readyForPickupTemplate: data.whatsappSettings?.readyForPickupTemplate || "",
                warrantyReminderTemplate: data.whatsappSettings?.warrantyReminderTemplate || "",
                autoSendOnNewService: data.whatsappSettings?.autoSendOnNewService ?? false,
                autoSendOnStatusChange: data.whatsappSettings?.autoSendOnStatusChange ?? false,
                autoSendOnComplete: data.whatsappSettings?.autoSendOnComplete ?? false,
            };
        }
    }

    syncPaymentMethods(data: PaymentMethod[] | undefined) {
        if (data) {
            this.paymentMethods = data;
        }
    }

    // Handle printer type change
    handlePrinterTypeChange() {
        if (this.receiptSettings.printerType !== this.previousPrinterType) {
            this.previousPrinterType = this.receiptSettings.printerType;
            const sizes = PAPER_SIZES[this.receiptSettings.printerType as keyof typeof PAPER_SIZES] || PAPER_SIZES.thermal;
            if (sizes.length > 0) {
                this.receiptSettings.paperSize = sizes[0].id;
            }
        }
    }

    // ============================================
    // SAVE FUNCTIONS
    // ============================================

    async saveStoreInfo() {
        this.saving = true;
        try {
            await SettingsService.setStoreInfo(this.storeInfo);
            toast.success("Informasi toko berhasil disimpan");
            this.queryClient.invalidateQueries({ queryKey: ["settings"] });
            await settingsStore.refresh();
        } catch (e) {
            toast.error("Gagal menyimpan informasi toko");
        } finally {
            this.saving = false;
        }
    }

    handleLogoUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                this.storeInfo.logo = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    async saveReceiptSettings() {
        this.saving = true;
        try {
            await SettingsService.setReceiptSettings(this.receiptSettings);
            toast.success("Pengaturan nota berhasil disimpan");
            this.queryClient.invalidateQueries({ queryKey: ["settings"] });
            await settingsStore.refresh();
        } catch (e) {
            toast.error("Gagal menyimpan pengaturan nota");
        } finally {
            this.saving = false;
        }
    }

    async saveServiceSettings() {
        this.saving = true;
        try {
            await SettingsService.setServiceSettings(this.serviceSettings);
            toast.success("Pengaturan service berhasil disimpan");
            this.queryClient.invalidateQueries({ queryKey: ["settings"] });
            await settingsStore.refresh();
        } catch (e) {
            toast.error("Gagal menyimpan pengaturan service");
        } finally {
            this.saving = false;
        }
    }

    async saveWhatsAppSettings() {
        this.saving = true;
        try {
            await SettingsService.setWhatsAppSettings(this.whatsappSettings);
            toast.success("Pengaturan WhatsApp berhasil disimpan");
            this.queryClient.invalidateQueries({ queryKey: ["settings"] });
            await settingsStore.refresh();
        } catch (e) {
            toast.error("Gagal menyimpan pengaturan WhatsApp");
        } finally {
            this.saving = false;
        }
    }

    // ============================================
    // WARRANTY PRESETS
    // ============================================

    addPreset() {
        if (!this.newPresetLabel || this.newPresetDays < 0) return;
        this.serviceSettings.warrantyPresets = [
            ...this.serviceSettings.warrantyPresets,
            { label: this.newPresetLabel, days: this.newPresetDays },
        ];
        this.newPresetLabel = "";
        this.newPresetDays = 0;
    }

    removePreset(index: number) {
        this.serviceSettings.warrantyPresets = this.serviceSettings.warrantyPresets.filter((_, i) => i !== index);
    }

    // ============================================
    // CONFIRMATION DIALOG
    // ============================================

    openConfirmDialog(
        title: string,
        description: string,
        actionLabel: string,
        onConfirm: () => Promise<void>,
        variant: "default" | "destructive" = "destructive"
    ) {
        this.confirmDialog = {
            open: true,
            title,
            description,
            actionLabel,
            variant,
            onConfirm,
            isLoading: false,
        };
    }

    async handleConfirm() {
        this.confirmDialog.isLoading = true;
        try {
            await this.confirmDialog.onConfirm();
            this.confirmDialog.open = false;
        } finally {
            this.confirmDialog.isLoading = false;
        }
    }

    // ============================================
    // EMPLOYEES
    // ============================================

    openAddUser() {
        this.editingUser = null;
        this.userForm = { username: "", password: "", name: "", role: "teknisi" };
        this.showUserDialog = true;
    }

    openEditUser(user: any) {
        this.editingUser = user;
        this.userForm = {
            username: user.username,
            password: "",
            name: user.name,
            role: user.role,
        };
        this.showUserDialog = true;
    }

    async deleteUser(id: string) {
        this.openConfirmDialog(
            "Hapus Karyawan",
            "Apakah Anda yakin ingin menghapus karyawan ini? Tindakan ini tidak dapat dibatalkan.",
            "Hapus",
            async () => {
                try {
                    await AuthService.deleteUser(id);
                    toast.success("Karyawan berhasil dihapus");
                    this.queryClient.invalidateQueries({ queryKey: ["users"] });
                } catch (e) {
                    toast.error("Gagal menghapus karyawan: " + String(e));
                }
            }
        );
    }

    async resetPassword() {
        if (!this.editingUser) return;
        this.openConfirmDialog(
            "Reset Password",
            "Apakah Anda yakin ingin mereset password user ini menjadi '12345'?",
            "Reset Password",
            async () => {
                try {
                    await AuthService.updateUser(this.editingUser.id, { password: "12345" });
                    toast.success("Password berhasil direset ke 12345");
                } catch (e) {
                    toast.error("Gagal mereset password: " + String(e));
                }
            }
        );
    }

    async saveUser() {
        if (!this.userForm.username || !this.userForm.name) {
            toast.error("Please fill all required fields");
            return;
        }

        this.saving = true;
        try {
            if (this.editingUser) {
                const data: any = {
                    name: this.userForm.name,
                    role: this.userForm.role,
                };
                await AuthService.updateUser(this.editingUser.id, data);
                toast.success("User updated successfully");
            } else {
                if (!this.userForm.password) {
                    toast.error("Password is required for new user");
                    return;
                }
                await AuthService.register(this.userForm);
                toast.success("User created successfully");
            }
            this.showUserDialog = false;
            this.queryClient.invalidateQueries({ queryKey: ["users"] });
        } catch (e) {
            toast.error("Failed to save user: " + String(e));
        } finally {
            this.saving = false;
        }
    }

    // ============================================
    // PAYMENT METHODS
    // ============================================

    async addPaymentMethod() {
        if (!this.newMethod.name) return;
        this.saving = true;
        try {
            await PaymentMethodsService.create({
                name: this.newMethod.name,
                type: this.newMethod.type,
                icon: this.newMethod.icon,
            });
            await this.queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
            this.newMethod = { name: "", icon: "💳", type: "custom" };
            this.showAddMethod = false;
            toast.success("Metode pembayaran berhasil ditambahkan");
        } catch (e) {
            toast.error("Gagal menambah metode pembayaran");
        } finally {
            this.saving = false;
        }
    }

    async togglePaymentMethod(id: string, enabled: boolean) {
        try {
            await PaymentMethodsService.update(id, { enabled });
            await this.queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
        } catch (e) {
            toast.error("Gagal mengubah status metode");
        }
    }

    async removePaymentMethod(id: string) {
        try {
            await PaymentMethodsService.disable(id);
            await this.queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
            toast.success("Metode pembayaran dinonaktifkan");
        } catch (e) {
            toast.error("Gagal menonaktifkan metode");
        }
    }

    getNewVariant(methodId: string) {
        if (!this.newVariantByMethod[methodId]) {
            this.newVariantByMethod[methodId] = {
                name: "",
                accountNumber: "",
                accountHolder: "",
            };
        }
        return this.newVariantByMethod[methodId];
    }

    async addVariant(methodId: string) {
        const variant = this.newVariantByMethod[methodId];
        if (!variant?.name) return;
        this.saving = true;
        try {
            await PaymentMethodsService.addVariant(methodId, {
                name: variant.name,
                accountNumber: variant.accountNumber || undefined,
                accountHolder: variant.accountHolder || undefined,
            });
            await this.queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
            this.newVariantByMethod[methodId] = {
                name: "",
                accountNumber: "",
                accountHolder: "",
            };
            toast.success("Varian berhasil ditambahkan");
        } catch (e) {
            toast.error("Gagal menambah varian");
        } finally {
            this.saving = false;
        }
    }

    async removeVariant(methodId: string, variantId: string) {
        try {
            await PaymentMethodsService.disableVariant(methodId, variantId);
            await this.queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
            toast.success("Varian dinonaktifkan");
        } catch (e) {
            toast.error("Gagal menonaktifkan varian");
        }
    }

    removeLogo() {
        this.storeInfo.logo = "";
    }
}
