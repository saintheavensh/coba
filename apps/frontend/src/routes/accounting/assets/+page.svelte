<script lang="ts">
    import { onMount } from "svelte";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogTrigger,
    } from "$lib/components/ui/dialog";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/components/ui/table";
    import {
        Settings,
        Plus,
        ChevronRight,
        Loader2,
        Wrench,
        Monitor,
        Sofa,
        Car,
        Building,
        Package,
        Calculator,
        Info,
        HelpCircle,
        ExternalLink,
        ShieldQuestion,
        Calendar,
        DollarSign,
        History,
        Tag,
        Banknote,
        Coins,
        Briefcase,
        Wallet,
        ArrowRightLeft,
        Map as MapIcon,
        Activity,
    } from "lucide-svelte";
    import { api } from "$lib/api";
    import { toast } from "svelte-sonner";
    import { Badge } from "$lib/components/ui/badge";

    let loading = $state(true);
    let assets = $state<any[]>([]);
    let accounts = $state<any[]>([]);
    let showAddDialog = $state(false);
    let showDeprDialog = $state(false);
    let submitting = $state(false);
    let processingDepr = $state(false);
    let deprPeriod = $state(new Date().toISOString().slice(0, 7)); // YYYY-MM
    let editingId = $state<string | null>(null);
    let showAccountingHelp = $state(false);

    // Form state
    let form = $state({
        name: "",
        category: "tool" as any,
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchaseCost: 0,
        salvageValue: 0,
        usefulLifeMonths: 24,
        notes: "",
        sourceAccountId: "1-1001", // Default to Kas Toko
        accountId: "1-4001", // Default to Peralatan
    });

    let splitProperty = $state(false);
    let landPortion = $state(0);

    // Depreciation Mode State
    let depreciationMode = $state<"auto" | "manual">("auto");
    let manualMonthlyDepr = $state(0);

    function handleManualDeprChange() {
        if (depreciationMode === "manual" && manualMonthlyDepr > 0) {
            const depreciableAmount = form.purchaseCost - form.salvageValue;
            if (depreciableAmount > 0) {
                const months = depreciableAmount / manualMonthlyDepr;
                form.usefulLifeMonths = Math.max(1, Math.ceil(months));
            }
        }
    }

    async function fetchAssets() {
        try {
            loading = true;
            const res = await api.get("/accounting/assets");
            assets = res.data;
        } catch (e) {
            console.error("Failed to fetch assets", e);
        } finally {
            loading = false;
        }
    }

    async function fetchAccounts() {
        try {
            const res = await api.get("/accounting/accounts");
            accounts = res.data;
        } catch (e) {
            console.error("Failed to fetch accounts", e);
        }
    }

    // Smart Auto-fill for Asset Accounts
    function handleCategoryChange() {
        if (!accounts.length) return;

        // Map categories to asset accounts
        // tool -> 1-4001 Peralatan Service
        // equipment, furniture -> 1-4002 Furniture
        // vehicle -> 1-4003 Kendaraan
        // building -> 1-4004 Bangunan

        let targetCode = "1-4001";

        if (form.category === "tool") targetCode = "1-4001";
        else if (form.category === "equipment" || form.category === "furniture")
            targetCode = "1-4002";
        else if (form.category === "vehicle") targetCode = "1-4003";
        else if (form.category === "building") targetCode = "1-4004";
        else if (form.category === "land") targetCode = "1-4005";
        else if (form.category === "other") targetCode = "1-4090";

        const found = accounts.find(
            (a) =>
                a.id.includes(targetCode) ||
                a.code === targetCode.split("-")[1],
        );
        if (found) {
            form.accountId = found.id;
        }

        // Property Logic
        if (form.category === "property") {
            splitProperty = true;
            // Maybe auto-select building for the main form?
            const building = accounts.find((a) => a.id.includes("1-4004"));
            if (building) form.accountId = building.id;
        } else {
            splitProperty = false;
            landPortion = 0;
        }
    }

    async function handleSubmit() {
        try {
            submitting = true;
            if (editingId) {
                await api.patch(`/accounting/assets/${editingId}`, {
                    ...form,
                    purchaseDate: new Date(form.purchaseDate),
                });
            } else {
                if (
                    form.category === "building" &&
                    splitProperty &&
                    landPortion > 0
                ) {
                    const buildingCost = form.purchaseCost - landPortion;

                    // 1. Create Building
                    await api.post("/accounting/assets", {
                        ...form,
                        name: `${form.name} (Bangunan)`,
                        purchaseCost: buildingCost,
                        purchaseDate: new Date(form.purchaseDate),
                    });

                    // 2. Create Land
                    await api.post("/accounting/assets", {
                        ...form,
                        name: `${form.name} (Tanah)`,
                        category: "land",
                        purchaseCost: landPortion,
                        salvageValue: 0,
                        usefulLifeMonths: 0,
                        purchaseDate: new Date(form.purchaseDate),
                        accountId: accounts.find((a) => a.id.includes("1-4005"))
                            ?.id, // Explicitly set Land account
                    });
                } else {
                    await api.post("/accounting/assets", {
                        ...form,
                        purchaseDate: new Date(form.purchaseDate),
                    });
                }
            }
            showAddDialog = false;
            editingId = null;
            splitProperty = false;
            landPortion = 0;
            form = {
                name: "",
                category: "tool" as any,
                purchaseDate: new Date().toISOString().slice(0, 10),
                purchaseCost: 0,
                salvageValue: 0,
                usefulLifeMonths: 24,
                notes: "",
                sourceAccountId: "1-1001",
                accountId: "1-4001",
            };
            await fetchAssets();
        } catch (e: any) {
            console.error("Failed to save asset", e);
            alert(e.response?.data?.error || "Gagal menyimpan aset");
        } finally {
            submitting = false;
        }
    }

    async function handleProcessDepreciation() {
        try {
            processingDepr = true;
            const res = await api.post(
                "/accounting/assets/depreciation/process-all",
                {
                    period: deprPeriod,
                },
            );
            toast.success(
                `Berhasil! ${res.data.processed} aset diproses, ${res.data.skipped} dilewati.`,
            );
            showDeprDialog = false;
            await fetchAssets();
        } catch (e: any) {
            console.error("Failed to process depreciation", e);
            toast.error(
                e.response?.data?.error || "Gagal memproses penyusutan",
            );
        } finally {
            processingDepr = false;
        }
    }

    // Derived Account Lists
    let assetAccounts = $derived(
        accounts.filter(
            (a) => a.typeId === "ASSET" && !a.code.startsWith("10"),
        ),
    ); // Exclude Cash/Bank usually
    // Actually, let's just show all ASSETS or filter by 1-4xxx for fixed assets if we want to be specific,
    // but "Flexible" means showing more.
    // Let's show all ASSETS that are NOT Cash/Bank (usually 1-1xxx).
    // Or simpler: Just all ASSET type.

    let allAssetAccounts = $derived(
        accounts.filter((a) => a.typeId === "ASSET"),
    );
    let cashBankAccounts = $derived(
        accounts.filter(
            (a) =>
                a.typeId === "ASSET" &&
                (a.name.toLowerCase().includes("kas") ||
                    a.name.toLowerCase().includes("bank")),
        ),
    );
    let liabilityAccounts = $derived(
        accounts.filter((a) => a.typeId === "LIABILITY"),
    );

    // Combine for Source (Cash/Bank OR Liability/Payable)
    let sourceAccounts = $derived([...cashBankAccounts, ...liabilityAccounts]);

    onMount(() => {
        fetchAssets();
        fetchAccounts();
    });

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);

    function getCategoryIcon(cat: string) {
        switch (cat) {
            case "tool":
                return Wrench;
            case "equipment":
                return Monitor;
            case "furniture":
                return Sofa;
            case "vehicle":
                return Car;
            case "building":
                return Building;
            default:
                return Package;
        }
    }

    function getCategoryLabel(cat: string) {
        const labels: Record<string, string> = {
            tool: "Alat Service",
            equipment: "Peralatan",
            furniture: "Furniture",
            vehicle: "Kendaraan",
            building: "Bangunan",
            other: "Lainnya",
        };
        return labels[cat] || cat;
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-700";
            case "disposed":
                return "bg-red-100 text-red-700";
            case "fully_depreciated":
                return "bg-yellow-100 text-yellow-700";
            default:
                return "bg-slate-100 text-slate-700";
        }
    }

    // Calculate preview
    let monthlyDepr = $derived.by(() => {
        if (form.usefulLifeMonths <= 0) return 0;
        const actualCost =
            form.category === "building" && splitProperty
                ? form.purchaseCost - landPortion
                : form.purchaseCost;

        return Math.floor(
            (actualCost - form.salvageValue) / form.usefulLifeMonths,
        );
    });
    let costPerHour = $derived(Math.ceil(monthlyDepr / 160));

    // Grouped accounts for source selection
    // REMOVED: let filteredAccounts = $derived.by(() => { ... });
</script>

<div class="space-y-6 animate-in fade-in duration-500 pb-10">
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
        <div>
            <div class="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <a href="/accounting" class="hover:text-blue-600">Akuntansi</a>
                <ChevronRight class="h-4 w-4" />
                <span class="text-slate-900 font-medium">Aset & Penyusutan</span
                >
            </div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
                Aset Tetap
            </h1>
        </div>

        <div class="flex items-center gap-3">
            <Dialog bind:open={showDeprDialog}>
                <DialogTrigger>
                    <Button
                        variant="outline"
                        class="group/btn gap-2 h-11 px-6 rounded-2xl border-orange-200 hover:border-orange-500 hover:bg-orange-50 text-orange-700 transition-all"
                    >
                        <History
                            class="h-4 w-4 group-hover/btn:rotate-180 transition-transform duration-500"
                        />
                        Proses Penyusutan
                    </Button>
                </DialogTrigger>
                <DialogContent
                    class="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl"
                >
                    <div class="h-1.5 bg-orange-500"></div>
                    <div class="p-8 space-y-6">
                        <div class="space-y-2">
                            <h3
                                class="text-xl font-bold flex items-center gap-2"
                            >
                                <Calculator class="h-5 w-5 text-orange-500" />
                                Posting Penyusutan Bulanan
                            </h3>
                            <p class="text-sm text-slate-500 leading-relaxed">
                                Tindakan ini akan mencatat <strong
                                    >Beban Penyusutan</strong
                                > untuk semua aset aktif pada periode yang dipilih
                                ke dalam jurnal akuntansi.
                            </p>
                        </div>

                        <div class="space-y-2">
                            <Label
                                class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                                >Pilih Periode (Bulan/Tahun)</Label
                            >
                            <Input
                                type="month"
                                bind:value={deprPeriod}
                                class="h-12 rounded-xl border-slate-200 focus:ring-orange-500"
                            />
                        </div>

                        <div
                            class="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-3"
                        >
                            <Info class="h-5 w-5 text-orange-600 shrink-0" />
                            <div
                                class="text-[11px] text-orange-800 leading-normal"
                            >
                                <p class="font-bold mb-1 underline">
                                    Mengapa ini perlu dilakukan?
                                </p>
                                Setiap bulan, nilai aset Anda berkurang karena pemakaian.
                                Proses ini memindahkan sebagian nilai aset menjadi<strong
                                    >Beban (Expense)</strong
                                > agar laporan laba rugi Anda akurat.
                            </div>
                        </div>

                        <div class="flex gap-3">
                            <Button
                                variant="ghost"
                                class="flex-1 rounded-xl h-11"
                                onclick={() => (showDeprDialog = false)}
                            >
                                Batal
                            </Button>
                            <Button
                                disabled={processingDepr}
                                class="flex-1 rounded-xl h-11 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-100"
                                onclick={handleProcessDepreciation}
                            >
                                {#if processingDepr}
                                    <Loader2
                                        class="h-4 w-4 animate-spin mr-2"
                                    />
                                    Memproses...
                                {:else}
                                    Posting Sekarang
                                {/if}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog bind:open={showAddDialog}>
                <DialogTrigger>
                    <Button
                        class="gap-2"
                        onclick={() => {
                            editingId = null;
                            form = {
                                name: "",
                                category: "tool",
                                purchaseDate: new Date()
                                    .toISOString()
                                    .slice(0, 10),
                                purchaseCost: 0,
                                salvageValue: 0,
                                usefulLifeMonths: 24,
                                notes: "",
                                sourceAccountId: "1-1001",
                                accountId: "1-4001",
                            };
                        }}
                    >
                        <Plus class="h-4 w-4" />
                        Tambah Aset
                    </Button>
                </DialogTrigger>
                <DialogContent
                    class="max-w-4xl p-0 border-none shadow-2xl rounded-3xl group max-h-[90vh] flex flex-col gap-0"
                >
                    <!-- Decorative Top Bar -->
                    <div
                        class="h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 shrink-0"
                    ></div>

                    <DialogHeader class="px-8 pt-8 outline-none shrink-0">
                        <div class="flex items-center gap-4">
                            <div
                                class="p-3 bg-blue-50 rounded-2xl text-blue-600 shadow-sm group-hover:scale-110 transition-transform duration-500"
                            >
                                <Briefcase class="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle
                                    class="text-2xl font-extrabold tracking-tight text-slate-900"
                                >
                                    {editingId
                                        ? "Perbarui Aset"
                                        : "Registrasi Aset Baru"}
                                </DialogTitle>
                                <p class="text-slate-500 text-sm">
                                    Kelola aset tetap dan pantau penyusutan
                                    otomatis setiap bulan.
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div class="overflow-y-auto p-8 pt-6">
                        <form
                            onsubmit={(e) => {
                                e.preventDefault();
                                handleSubmit();
                            }}
                            class="space-y-6"
                        >
                            <div
                                class="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-8"
                            >
                                <!-- Left Column: Data Entry -->
                                <div class="space-y-8">
                                    <!-- Section 1: Identitas Aset -->
                                    <div
                                        class="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-6"
                                    >
                                        <div
                                            class="flex items-center gap-3 mb-2"
                                        >
                                            <div
                                                class="h-8 w-1 bg-blue-500 rounded-full"
                                            ></div>
                                            <h3
                                                class="text-sm font-black text-slate-900 uppercase tracking-wider italic"
                                            >
                                                Identitas Aset
                                            </h3>
                                        </div>

                                        <div class="space-y-2">
                                            <Label
                                                class="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"
                                            >
                                                <Tag class="h-3.5 w-3.5" /> Nama
                                                Aset
                                            </Label>
                                            <Input
                                                bind:value={form.name}
                                                placeholder="Nama resmi aset..."
                                                class="h-12 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 rounded-2xl transition-all font-medium text-slate-900"
                                                required
                                            />
                                        </div>

                                        <div class="grid grid-cols-2 gap-6">
                                            <div class="space-y-2">
                                                <Label
                                                    class="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"
                                                >
                                                    <Package
                                                        class="h-3.5 w-3.5"
                                                    /> Kategori
                                                </Label>
                                                <div class="relative">
                                                    <select
                                                        bind:value={
                                                            form.category
                                                        }
                                                        class="w-full h-12 pl-4 pr-10 border border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all appearance-none cursor-pointer font-medium text-slate-700"
                                                        onchange={handleCategoryChange}
                                                    >
                                                        <option value="tool"
                                                            >Alat Service</option
                                                        >
                                                        <option
                                                            value="equipment"
                                                            >Peralatan</option
                                                        >
                                                        <option
                                                            value="furniture"
                                                            >Furniture</option
                                                        >
                                                        <option value="vehicle"
                                                            >Kendaraan</option
                                                        >
                                                        <option value="property"
                                                            >Properti (Tanah &
                                                            Bangunan)</option
                                                        >
                                                        <option value="other"
                                                            >Lainnya</option
                                                        >
                                                    </select>
                                                    <ChevronRight
                                                        class="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90 pointer-events-none"
                                                    />
                                                </div>
                                            </div>

                                            <div class="space-y-2">
                                                <Label
                                                    class="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"
                                                >
                                                    <Calendar
                                                        class="h-3.5 w-3.5"
                                                    />
                                                    Tgl Akuisisi
                                                </Label>
                                                <Input
                                                    type="date"
                                                    bind:value={
                                                        form.purchaseDate
                                                    }
                                                    class="h-12 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 rounded-2xl transition-all font-medium text-slate-700 bg-slate-50/50 focus:bg-white"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <!-- Account Selection -->
                                        {#if accounts.length > 0}
                                            <div
                                                class="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-700 delay-100"
                                            >
                                                <div class="space-y-2">
                                                    <Label
                                                        class="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"
                                                    >
                                                        <Briefcase
                                                            class="h-3.5 w-3.5"
                                                        /> Akun Aset (Debit)
                                                    </Label>
                                                    <div class="relative">
                                                        <select
                                                            bind:value={
                                                                form.accountId
                                                            }
                                                            class="w-full h-12 pl-4 pr-10 border border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all appearance-none cursor-pointer font-medium text-slate-700"
                                                        >
                                                            <option
                                                                value=""
                                                                disabled
                                                                >Pilih Akun Aset</option
                                                            >
                                                            {#each allAssetAccounts as account}
                                                                <option
                                                                    value={account.id}
                                                                    >{account.code}
                                                                    - {account.name}</option
                                                                >
                                                            {/each}
                                                        </select>
                                                        <ChevronRight
                                                            class="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90 pointer-events-none"
                                                        />
                                                    </div>
                                                </div>

                                                <div class="space-y-2">
                                                    <Label
                                                        class="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"
                                                    >
                                                        <Wallet
                                                            class="h-3.5 w-3.5"
                                                        /> Sumber Dana (Kredit)
                                                    </Label>
                                                    <div class="relative">
                                                        <select
                                                            bind:value={
                                                                form.sourceAccountId
                                                            }
                                                            class="w-full h-12 pl-4 pr-10 border border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all appearance-none cursor-pointer font-medium text-slate-700"
                                                        >
                                                            <option
                                                                value=""
                                                                disabled
                                                                >Pilih Sumber
                                                                Dana</option
                                                            >
                                                            {#each sourceAccounts as account}
                                                                <option
                                                                    value={account.id}
                                                                    >{account.code}
                                                                    - {account.name}</option
                                                                >
                                                            {/each}
                                                        </select>
                                                        <ChevronRight
                                                            class="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90 pointer-events-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        {/if}

                                        {#if form.category === "property"}
                                            <div
                                                class="pt-2 animate-in fade-in slide-in-from-top-2 duration-500"
                                            >
                                                <div
                                                    class="flex flex-col gap-1 p-4 border border-blue-100 bg-blue-50/50 rounded-2xl"
                                                >
                                                    <span
                                                        class="text-xs font-black text-blue-900 uppercase tracking-tight"
                                                        >Mode Properti Gabungan</span
                                                    >
                                                    <span
                                                        class="text-[10px] text-blue-600/70 font-medium"
                                                        >Sistem akan otomatis
                                                        memisahkan nilai Tanah
                                                        dan Bangunan menjadi dua
                                                        aset terpisah.</span
                                                    >
                                                </div>
                                            </div>
                                        {/if}
                                    </div>

                                    <!-- Section 2: Sumber Dana -->
                                    <div
                                        class="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-6"
                                    >
                                        <div
                                            class="flex items-center justify-between gap-3 mb-2"
                                        >
                                            <div
                                                class="flex items-center gap-3"
                                            >
                                                <div
                                                    class="h-8 w-1 bg-indigo-500 rounded-full"
                                                ></div>
                                                <h3
                                                    class="text-sm font-black text-slate-900 uppercase tracking-wider italic"
                                                >
                                                    Pembiayaan
                                                </h3>
                                            </div>
                                            <button
                                                type="button"
                                                onclick={() =>
                                                    (showAccountingHelp =
                                                        !showAccountingHelp)}
                                                class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors flex items-center gap-1.5 border border-indigo-100"
                                            >
                                                <HelpCircle class="h-3 w-3" /> Panduan
                                            </button>
                                        </div>

                                        {#if showAccountingHelp}
                                            <div
                                                class="p-5 bg-slate-900 text-slate-300 rounded-3xl text-[11px] leading-relaxed shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-800 space-y-3"
                                            >
                                                <div
                                                    class="flex items-center gap-2 text-white font-bold"
                                                >
                                                    <ShieldQuestion
                                                        class="h-4 w-4 text-indigo-400"
                                                    />
                                                    Logika Akuntansi
                                                </div>
                                                <div
                                                    class="grid grid-cols-1 gap-2 opacity-90"
                                                >
                                                    <div
                                                        class="flex items-start gap-2 p-2 rounded-xl bg-white/5 border border-white/10"
                                                    >
                                                        <span
                                                            class="text-blue-400 font-bold w-12 shrink-0"
                                                            >ASET:</span
                                                        >
                                                        <span
                                                            >Uang langsung
                                                            keluar dari
                                                            kas/bank.</span
                                                        >
                                                    </div>
                                                    <div
                                                        class="flex items-start gap-2 p-2 rounded-xl bg-white/5 border border-white/10"
                                                    >
                                                        <span
                                                            class="text-orange-400 font-bold w-12 shrink-0"
                                                            >HUTANG:</span
                                                        >
                                                        <span
                                                            >Cicilan atau bon
                                                            tempo ke pihak lain.</span
                                                        >
                                                    </div>
                                                    <div
                                                        class="flex items-start gap-2 p-2 rounded-xl bg-white/5 border border-white/10"
                                                    >
                                                        <span
                                                            class="text-green-400 font-bold w-12 shrink-0"
                                                            >MODAL:</span
                                                        >
                                                        <span
                                                            >Uang pribadi atau
                                                            setoran awal
                                                            pemilik.</span
                                                        >
                                                    </div>
                                                </div>
                                            </div>
                                        {/if}
                                    </div>

                                    <!-- Section 3: Catatan -->
                                    <div
                                        class="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-4"
                                    >
                                        <div class="flex items-center gap-3">
                                            <div
                                                class="h-8 w-1 bg-slate-300 rounded-full"
                                            ></div>
                                            <h3
                                                class="text-sm font-black text-slate-900 uppercase tracking-wider italic"
                                            >
                                                Informasi Tambahan
                                            </h3>
                                        </div>
                                        <textarea
                                            bind:value={form.notes}
                                            placeholder="Tuliskan detail lain (lokasi, SN, dll)..."
                                            class="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50/20 focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-500/5 outline-none transition-all h-24 text-sm font-medium text-slate-600 italic placeholder:not-italic"
                                        ></textarea>
                                    </div>
                                </div>

                                <!-- Right Column: Financial Calculation Card -->
                                <div class="space-y-6">
                                    <div
                                        class="p-8 bg-slate-900 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden border border-slate-800"
                                    >
                                        <!-- Background Accents -->
                                        <div
                                            class="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px]"
                                        ></div>

                                        <div
                                            class="relative z-10 space-y-6 text-white"
                                        >
                                            <!-- Price -->
                                            <div class="space-y-3">
                                                <Label
                                                    class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]"
                                                >
                                                    {splitProperty
                                                        ? "Total Transaksi"
                                                        : "Harga Perolehan"}
                                                </Label>
                                                <div
                                                    class="relative group/input"
                                                >
                                                    <div
                                                        class="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2"
                                                    >
                                                        <div
                                                            class="h-4 w-0.5 bg-blue-500/50 rounded-full"
                                                        ></div>
                                                        <span
                                                            class="text-slate-400 font-black text-xs"
                                                            >RP</span
                                                        >
                                                    </div>
                                                    <Input
                                                        type="number"
                                                        bind:value={
                                                            form.purchaseCost
                                                        }
                                                        class="pl-16 h-14 bg-white/5 border-white/10 focus:border-blue-500/50 focus:ring-0 rounded-2xl text-xl font-black text-white hover:bg-white/[0.07] transition-all"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <!-- Split Property Logic -->
                                            {#if splitProperty}
                                                <div
                                                    class="space-y-3 animate-in slide-in-from-right-4 duration-500"
                                                >
                                                    <Label
                                                        class="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]"
                                                        >Porsi Harga Tanah</Label
                                                    >
                                                    <div
                                                        class="relative group/input"
                                                    >
                                                        <div
                                                            class="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 font-black text-xs text-blue-400"
                                                        >
                                                            <MapIcon
                                                                class="h-3 w-3"
                                                            /> RP
                                                        </div>
                                                        <Input
                                                            type="number"
                                                            bind:value={
                                                                landPortion
                                                            }
                                                            class="pl-16 h-14 bg-blue-500/10 border-blue-500/30 focus:border-blue-500 focus:ring-0 rounded-2xl text-xl font-black text-blue-400 hover:bg-blue-500/20 transition-all"
                                                            required
                                                        />
                                                    </div>
                                                    <div
                                                        class="flex justify-between px-2"
                                                    >
                                                        <span
                                                            class="text-[10px] text-slate-500 font-bold uppercase italic"
                                                            >Nilai Bangunan:</span
                                                        >
                                                        <span
                                                            class="text-[10px] text-white font-black"
                                                            >{formatCurrency(
                                                                form.purchaseCost -
                                                                    landPortion,
                                                            )}</span
                                                        >
                                                    </div>
                                                </div>
                                            {/if}

                                            <!-- Residual & Life -->
                                            <div class="grid grid-cols-2 gap-4">
                                                <div class="space-y-3">
                                                    <div
                                                        class="flex items-center h-5"
                                                    >
                                                        <Label
                                                            class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]"
                                                            >Nilai Residu</Label
                                                        >
                                                    </div>
                                                    <div class="relative">
                                                        <Input
                                                            type="number"
                                                            bind:value={
                                                                form.salvageValue
                                                            }
                                                            class="h-12 bg-white/5 border-white/10 focus:border-slate-500 rounded-2xl text-sm font-bold text-white transition-all text-center"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div class="space-y-3">
                                                    <div
                                                        class="flex justify-between items-center h-5"
                                                    >
                                                        <Label
                                                            class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]"
                                                            >Masa Pakai</Label
                                                        >
                                                    </div>
                                                    <div class="relative">
                                                        <Input
                                                            type="number"
                                                            bind:value={
                                                                form.usefulLifeMonths
                                                            }
                                                            class="h-12 bg-white/5 border-white/10 focus:border-slate-500 rounded-2xl text-sm font-bold text-white transition-all text-center"
                                                            min="1"
                                                            required
                                                        />
                                                        <span
                                                            class="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500 uppercase tracking-tighter"
                                                            >Bulan</span
                                                        >
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Depreciation -->
                                            <div
                                                class="pt-6 border-t border-white/5"
                                            >
                                                <div
                                                    class="flex items-center justify-between mb-4"
                                                >
                                                    <div
                                                        class="flex items-center gap-2"
                                                    >
                                                        <div
                                                            class="p-2 bg-blue-500/20 rounded-xl"
                                                        >
                                                            <Calculator
                                                                class="h-4 w-4 text-blue-400"
                                                            />
                                                        </div>
                                                        <div>
                                                            <p
                                                                class="text-[10px] font-black text-white uppercase tracking-widest"
                                                            >
                                                                Estimasi
                                                                Penyusutan
                                                            </p>
                                                            <p
                                                                class="text-[9px] text-slate-500 font-bold uppercase"
                                                            >
                                                                Garis Lurus
                                                                (Straight Line)
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div
                                                        class="flex bg-slate-800 rounded-lg p-1 border border-slate-700"
                                                    >
                                                        <button
                                                            type="button"
                                                            class="px-2 py-1 text-[9px] font-bold rounded-md transition-all {depreciationMode ===
                                                            'auto'
                                                                ? 'bg-blue-500 text-white shadow-sm'
                                                                : 'text-slate-400 hover:text-slate-300'}"
                                                            onclick={() =>
                                                                (depreciationMode =
                                                                    "auto")}
                                                        >
                                                            AUTO
                                                        </button>
                                                        <button
                                                            type="button"
                                                            class="px-2 py-1 text-[9px] font-bold rounded-md transition-all {depreciationMode ===
                                                            'manual'
                                                                ? 'bg-blue-500 text-white shadow-sm'
                                                                : 'text-slate-400 hover:text-slate-300'}"
                                                            onclick={() => {
                                                                depreciationMode =
                                                                    "manual";
                                                                manualMonthlyDepr =
                                                                    monthlyDepr;
                                                            }}
                                                        >
                                                            MANUAL
                                                        </button>
                                                    </div>
                                                </div>

                                                <div
                                                    class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group"
                                                >
                                                    <div
                                                        class="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"
                                                    ></div>
                                                    <p
                                                        class="text-[10px] text-blue-100 font-bold uppercase tracking-wider mb-1"
                                                    >
                                                        Beban per Bulan
                                                    </p>

                                                    {#if depreciationMode === "auto"}
                                                        <h2
                                                            class="text-3xl font-black text-white italic tracking-tighter drop-shadow-lg animate-in slide-in-from-bottom-2"
                                                        >
                                                            {formatCurrency(
                                                                monthlyDepr,
                                                            )}
                                                        </h2>
                                                    {:else}
                                                        <div
                                                            class="relative animate-in slide-in-from-bottom-2"
                                                        >
                                                            <span
                                                                class="absolute left-0 top-1/2 -translate-y-1/2 text-blue-200 font-bold text-lg"
                                                                >Rp</span
                                                            >
                                                            <input
                                                                type="number"
                                                                bind:value={
                                                                    manualMonthlyDepr
                                                                }
                                                                oninput={handleManualDeprChange}
                                                                class="w-full bg-transparent border-b-2 border-white/20 focus:border-white text-3xl font-black text-white italic tracking-tighter outline-none pl-8 py-1 placeholder-white/30"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <p
                                                            class="text-[9px] text-blue-200 mt-2 font-medium"
                                                        >
                                                            <span
                                                                class="text-white font-bold underline"
                                                                >{form.usefulLifeMonths}
                                                                Bulan</span
                                                            > (Otomatis)
                                                        </p>
                                                    {/if}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Validation Card -->
                                    <div
                                        class="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3"
                                    >
                                        <div
                                            class="flex items-center gap-2 text-slate-500"
                                        >
                                            <Activity class="h-3 w-3" />
                                            <span
                                                class="text-[10px] font-bold uppercase tracking-widest leading-none pt-0.5"
                                                >Status Validasi</span
                                            >
                                        </div>
                                        <p
                                            class="text-[11px] text-slate-500 font-medium leading-relaxed"
                                        >
                                            Data ini akan diposting ke Buku
                                            Besar secara otomatis. Pastikan
                                            nominal dan tgl akuisisi sudah
                                            sesuai dengan bukti bayar/invoice.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Footer Guides & Actions -->
                            <div
                                class="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4"
                            >
                                <div
                                    class="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100 animate-pulse"
                                >
                                    <ShieldQuestion
                                        class="h-3.5 w-3.5 text-green-600"
                                    />
                                    <span
                                        class="text-[10px] font-bold text-green-600 uppercase tracking-wide"
                                        >Data Terdistribusi ke Jurnal Umum</span
                                    >
                                </div>

                                <div class="flex gap-3 w-full sm:w-auto">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        class="flex-1 sm:flex-none rounded-xl h-11 text-slate-500 hover:bg-slate-50"
                                        onclick={() => {
                                            showAddDialog = false;
                                            editingId = null;
                                            form = {
                                                name: "",
                                                category: "tool" as any,
                                                purchaseDate: new Date()
                                                    .toISOString()
                                                    .slice(0, 10),
                                                purchaseCost: 0,
                                                salvageValue: 0,
                                                usefulLifeMonths: 24,
                                                notes: "",
                                                sourceAccountId: "1-1001",
                                                accountId: "1-4001",
                                            };
                                            splitProperty = false;
                                            landPortion = 0;
                                        }}
                                    >
                                        Batalkan
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        class="flex-1 sm:flex-none h-11 px-8 rounded-xl bg-slate-900 border-none hover:bg-slate-800 shadow-lg shadow-slate-200"
                                    >
                                        {#if submitting}
                                            <Loader2
                                                class="h-4 w-4 animate-spin mr-2"
                                            />
                                            Menyimpan...
                                        {:else}
                                            Selesaikan Registrasi
                                        {/if}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card class="border-0 shadow-md rounded-xl">
            <CardContent class="p-4">
                <p class="text-sm text-slate-500">Total Aset</p>
                <p class="text-2xl font-bold">{assets.length}</p>
            </CardContent>
        </Card>
        <Card class="border-0 shadow-md rounded-xl">
            <CardContent class="p-4">
                <p class="text-sm text-slate-500">Nilai Buku Total</p>
                <p class="text-2xl font-bold">
                    {formatCurrency(
                        assets.reduce((s, a) => s + (a.currentValue || 0), 0),
                    )}
                </p>
            </CardContent>
        </Card>
        <Card class="border-0 shadow-md rounded-xl">
            <CardContent class="p-4">
                <p class="text-sm text-slate-500">Penyusutan/Bulan</p>
                <p class="text-2xl font-bold">
                    {formatCurrency(
                        assets.reduce(
                            (s, a) => s + (a.monthlyDepreciation || 0),
                            0,
                        ),
                    )}
                </p>
            </CardContent>
        </Card>
    </div>

    <!-- Assets Table -->
    {#if loading}
        <div class="flex items-center justify-center py-20">
            <Loader2 class="h-8 w-8 animate-spin text-blue-600" />
        </div>
    {:else}
        <Card class="border-0 shadow-lg rounded-2xl overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow class="bg-slate-50">
                        <TableHead>Aset</TableHead>
                        <TableHead class="w-28">Kategori</TableHead>
                        <TableHead class="text-right">Nilai Buku</TableHead>
                        <TableHead class="text-right">Penyusutan/Bln</TableHead>
                        <TableHead class="text-right">Biaya/Jam</TableHead>
                        <TableHead class="w-24">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {#each assets as asset}
                        {@const Icon = getCategoryIcon(asset.category)}
                        <TableRow class="hover:bg-slate-50">
                            <TableCell>
                                <div class="flex items-center gap-3">
                                    <div class="p-2 bg-slate-100 rounded-lg">
                                        <Icon class="h-4 w-4 text-slate-600" />
                                    </div>
                                    <div>
                                        <p class="font-medium">{asset.name}</p>
                                        <p class="text-xs text-slate-500">
                                            {asset.id}
                                        </p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell class="text-sm"
                                >{getCategoryLabel(asset.category)}</TableCell
                            >
                            <TableCell class="text-right font-mono">
                                {formatCurrency(asset.currentValue || 0)}
                            </TableCell>
                            <TableCell class="text-right font-mono">
                                {formatCurrency(asset.monthlyDepreciation || 0)}
                            </TableCell>
                            <TableCell
                                class="text-right font-mono text-blue-600"
                            >
                                {formatCurrency(asset.toolCostPerHour || 0)}
                            </TableCell>
                            <TableCell>
                                <span
                                    class="text-xs px-2 py-1 rounded-full {getStatusBadge(
                                        asset.status,
                                    )}"
                                >
                                    {asset.status === "active"
                                        ? "Aktif"
                                        : asset.status === "disposed"
                                          ? "Dibuang"
                                          : "Habis"}
                                </span>
                            </TableCell>
                            <TableCell>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    class="h-8 w-8 p-0"
                                    onclick={() => {
                                        editingId = asset.id;
                                        form = {
                                            name: asset.name,
                                            category: asset.category,
                                            purchaseDate: new Date(
                                                asset.purchaseDate,
                                            )
                                                .toISOString()
                                                .slice(0, 10),
                                            purchaseCost: asset.purchaseCost,
                                            salvageValue: asset.salvageValue,
                                            usefulLifeMonths:
                                                asset.usefulLifeMonths,
                                            notes: asset.notes || "",
                                            sourceAccountId:
                                                asset.sourceAccountId || "",
                                            accountId: asset.accountId || "",
                                        };
                                        showAddDialog = true;
                                    }}
                                >
                                    <span class="sr-only">Edit</span>
                                    <Settings class="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    class="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onclick={async () => {
                                        if (
                                            !confirm(
                                                `Hapus aset "${asset.name}"? Tindakan ini tidak dapat dibatalkan.`,
                                            )
                                        )
                                            return;
                                        try {
                                            loading = true;
                                            await api.delete(
                                                `/accounting/assets/${asset.id}`,
                                            );
                                            await fetchAssets();
                                        } catch (e: any) {
                                            console.error(
                                                "Failed to delete asset",
                                                e,
                                            );
                                            alert(
                                                e.response?.data?.error ||
                                                    "Gagal menghapus aset",
                                            );
                                            loading = false;
                                        }
                                    }}
                                >
                                    <span class="sr-only">Delete</span>
                                    <!-- Use Trash icon if imported, or X, or just text. 
                                         Import Trash from lucide-svelte first? 
                                         Wait, Trash might not be imported. Let's start with 'Dispose' or similar using existing icons? 
                                         Actually, let's fix imports first if needed. 
                                         Checking imports... Trash is NOT imported.
                                         I will use existing 'Settings' or text for now, OR better, add Trash to imports first.
                                         Actually, I can just do a multi-replace to add import + button.
                                         But replace_token is simpler. 
                                         Let's use "X" for now or just text "Hapus" if space permits. 
                                         Table cell is small. 
                                         Let's assume Trash is available or use 'Wrench' temporarily? No bad UX.
                                         I'll revert to adding the button with a text label or existing icon if I can't import easily.
                                         Wait, I can import Trash in a separate step or just assume Lucide names. 
                                         Let's try to add the import in a previous step? No, strictly sequential.
                                         I'll add the button with a 'Trash' icon and if it fails to compile I'll fix imports.
                                         But Svelte will error if component not found.
                                         Let's check imports.
                                         Imports: Settings, Plus, ChevronRight, Loader2, Wrench, Monitor, Sofa, Car, Building, Package, Calculator.
                                         Missing Trash.
                                         I'll use 'Plus' rotated? No. 
                                         I'll use 'Package' as placeholder? No.
                                         I should add Trash to imports.
                                         I'll do a multi-replace to add import AND button.
                                    -->
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        class="h-4 w-4"
                                        ><path d="M3 6h18" /><path
                                            d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
                                        /><path
                                            d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
                                        /><line
                                            x1="10"
                                            x2="10"
                                            y1="11"
                                            y2="17"
                                        /><line
                                            x1="14"
                                            x2="14"
                                            y1="11"
                                            y2="17"
                                        /></svg
                                    >
                                </Button>
                            </TableCell>
                        </TableRow>
                    {:else}
                        <TableRow>
                            <TableCell
                                colspan={6}
                                class="text-center py-10 text-slate-500"
                            >
                                Belum ada aset. Klik "Tambah Aset" untuk
                                menambahkan.
                            </TableCell>
                        </TableRow>
                    {/each}
                </TableBody>
            </Table>
        </Card>
    {/if}
</div>
