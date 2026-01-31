<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
    } from "$lib/components/ui/dialog";
    import { Label } from "$lib/components/ui/label";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";
    import {
        AlertTriangle,
        Settings,
        Check,
        ArrowRight,
        ChevronLeft,
    } from "lucide-svelte";
    import {
        SettingsService,
        type GeneralSettings,
        type AccountMappingSettings,
    } from "$lib/services/settings.service";
    import { api } from "$lib/api";
    import { toast } from "svelte-sonner";

    interface Props {
        open: boolean;
        onClose: () => void;
        onComplete: () => void;
    }

    let { open = $bindable(), onClose, onComplete }: Props = $props();

    let step = $state<"choice" | "custom">("choice");
    let configChoice = $state<"default" | "custom">("default");
    let saving = $state(false);
    let accounts = $state<any[]>([]);
    let mappings = $state<AccountMappingSettings | null>(null);

    // Essential accounts for Pro Mode
    const essentialMappings = [
        { type: "default_cash", label: "Kas Utama", group: "Kas & Bank" },
        {
            type: "sales_revenue",
            label: "Pendapatan Penjualan",
            group: "Pendapatan",
        },
        {
            type: "service_revenue",
            label: "Pendapatan Service",
            group: "Pendapatan",
        },
        { type: "cogs_sales", label: "HPP Penjualan", group: "HPP" },
        { type: "cogs_service", label: "HPP Service", group: "HPP" },
        {
            type: "accounts_payable",
            label: "Hutang Usaha",
            group: "Hutang/Piutang",
        },
        {
            type: "accounts_receivable",
            label: "Piutang Usaha",
            group: "Hutang/Piutang",
        },
    ];

    async function loadData() {
        try {
            const [accountsRes, mappingsRes] = await Promise.all([
                api.get("/accounting/accounts"),
                SettingsService.getAccountMappings(),
            ]);
            accounts = accountsRes.data;
            mappings = mappingsRes;
        } catch (e) {
            console.error("Failed to load data", e);
        }
    }

    function getAccountForType(type: string): string {
        const mapping = mappings?.mappings.find((m) => m.type === type);
        return mapping?.accountId ?? "";
    }

    function getAccountLabel(type: string): string {
        const accountId = getAccountForType(type);
        if (!accountId) return "Pilih akun...";
        const account = accounts.find((a) => a.id === accountId);
        return account ? `${account.code} - ${account.name}` : "Pilih akun...";
    }

    function updateMapping(type: string, accountId: string) {
        if (!mappings) return;
        const idx = mappings.mappings.findIndex((m) => m.type === type);
        if (idx >= 0) {
            mappings.mappings[idx].accountId = accountId;
        }
    }

    async function handleContinue() {
        if (configChoice === "default") {
            await enableProMode();
        } else {
            step = "custom";
        }
    }

    async function enableProMode() {
        try {
            saving = true;

            // Save mappings if custom
            if (configChoice === "custom" && mappings) {
                await SettingsService.setAccountMappings(mappings);
            }

            // Enable Pro Mode
            const settings: GeneralSettings = {
                accountingMode: "professional",
                accountingSetupComplete: true,
            };
            await SettingsService.setGeneralSettings(settings);

            toast.success("Mode Profesional berhasil diaktifkan!");
            onComplete();
        } catch (e) {
            console.error("Failed to enable Pro Mode", e);
            toast.error("Gagal mengaktifkan Mode Profesional");
        } finally {
            saving = false;
        }
    }

    function handleClose() {
        step = "choice";
        configChoice = "default";
        onClose();
    }

    $effect(() => {
        if (open) {
            loadData();
        }
    });

    // Group accounts by type for easier selection
    let groupedAccounts = $derived({
        cash: accounts.filter(
            (a) =>
                a.typeId === "ASSET" &&
                (a.name.toLowerCase().includes("kas") ||
                    a.name.toLowerCase().includes("bank")),
        ),
        revenue: accounts.filter((a) => a.typeId === "REVENUE"),
        expense: accounts.filter(
            (a) => a.typeId === "EXPENSE" || a.typeId === "COGS",
        ),
        liability: accounts.filter((a) => a.typeId === "LIABILITY"),
        receivable: accounts.filter(
            (a) =>
                a.typeId === "ASSET" &&
                a.name.toLowerCase().includes("piutang"),
        ),
    });
</script>

<Dialog bind:open onOpenChange={(isOpen) => !isOpen && handleClose()}>
    <DialogContent class="max-w-lg">
        {#if step === "choice"}
            <DialogHeader>
                <div class="flex items-center gap-3">
                    <div class="p-2.5 rounded-xl bg-amber-100 text-amber-600">
                        <AlertTriangle class="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle class="text-lg"
                            >Mode Profesional</DialogTitle
                        >
                        <DialogDescription class="mt-0.5">
                            Fitur akuntansi lengkap
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            <div class="space-y-4 py-4">
                <div
                    class="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800"
                >
                    <p class="font-semibold mb-2">
                        ⚠️ Mode ini membutuhkan pemahaman akuntansi dasar.
                    </p>
                    <ul class="list-disc list-inside space-y-1 text-amber-700">
                        <li>Chart of Accounts & Jurnal Umum</li>
                        <li>Neraca & Laporan Arus Kas</li>
                        <li>Penyusutan Aset Otomatis</li>
                    </ul>
                </div>

                <div class="space-y-3">
                    <Label
                        class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                    >
                        Pilih Konfigurasi Akun
                    </Label>

                    <button
                        type="button"
                        class="w-full p-4 rounded-xl border-2 transition-all text-left {configChoice ===
                        'default'
                            ? 'border-blue-500 bg-blue-50/50'
                            : 'border-slate-200 hover:border-slate-300'}"
                        onclick={() => (configChoice = "default")}
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="h-5 w-5 rounded-full border-2 flex items-center justify-center {configChoice ===
                                'default'
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-slate-300'}"
                            >
                                {#if configChoice === "default"}
                                    <Check class="h-3 w-3 text-white" />
                                {/if}
                            </div>
                            <div>
                                <p class="font-semibold text-sm">
                                    Gunakan Default
                                </p>
                                <p class="text-xs text-muted-foreground">
                                    Akun sudah di-setup otomatis sesuai standar
                                </p>
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        class="w-full p-4 rounded-xl border-2 transition-all text-left {configChoice ===
                        'custom'
                            ? 'border-blue-500 bg-blue-50/50'
                            : 'border-slate-200 hover:border-slate-300'}"
                        onclick={() => (configChoice = "custom")}
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="h-5 w-5 rounded-full border-2 flex items-center justify-center {configChoice ===
                                'custom'
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-slate-300'}"
                            >
                                {#if configChoice === "custom"}
                                    <Check class="h-3 w-3 text-white" />
                                {/if}
                            </div>
                            <div>
                                <p class="font-semibold text-sm">Kustomisasi</p>
                                <p class="text-xs text-muted-foreground">
                                    Atur akun sesuai kebutuhan bisnis Anda
                                </p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <div class="flex justify-end gap-3 pt-2">
                <Button variant="outline" onclick={handleClose}>Batal</Button>
                <Button onclick={handleContinue} disabled={saving}>
                    {saving ? "Menyimpan..." : "Lanjutkan"}
                    <ArrowRight class="ml-2 h-4 w-4" />
                </Button>
            </div>
        {:else if step === "custom"}
            <DialogHeader>
                <div class="flex items-center gap-3">
                    <div class="p-2.5 rounded-xl bg-blue-100 text-blue-600">
                        <Settings class="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle class="text-lg"
                            >Konfigurasi Akun</DialogTitle
                        >
                        <DialogDescription class="mt-0.5">
                            Atur akun penting agar laporan tidak error
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            <div class="space-y-4 py-4 max-h-[400px] overflow-y-auto">
                {#each ["Kas & Bank", "Pendapatan", "HPP", "Hutang/Piutang"] as group}
                    <div class="space-y-2">
                        <Label
                            class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                        >
                            {group}
                        </Label>
                        {#each essentialMappings.filter((m) => m.group === group) as mapping}
                            <div class="flex items-center gap-3">
                                <Label class="w-32 text-sm shrink-0"
                                    >{mapping.label}</Label
                                >
                                <Select
                                    type="single"
                                    value={getAccountForType(mapping.type)}
                                    onValueChange={(v) =>
                                        updateMapping(mapping.type, v)}
                                >
                                    <SelectTrigger class="flex-1">
                                        {getAccountLabel(mapping.type)}
                                    </SelectTrigger>
                                    <SelectContent>
                                        {#each accounts as account}
                                            <SelectItem value={account.id}>
                                                {account.code} - {account.name}
                                            </SelectItem>
                                        {/each}
                                    </SelectContent>
                                </Select>
                            </div>
                        {/each}
                    </div>
                {/each}
            </div>

            <div class="flex justify-between gap-3 pt-2">
                <Button variant="outline" onclick={() => (step = "choice")}>
                    <ChevronLeft class="mr-1 h-4 w-4" />
                    Kembali
                </Button>
                <Button onclick={enableProMode} disabled={saving}>
                    {saving ? "Menyimpan..." : "Simpan & Aktifkan"}
                </Button>
            </div>
        {/if}
    </DialogContent>
</Dialog>
