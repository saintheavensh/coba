<script lang="ts">
    import { onMount } from "svelte";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
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
    import {
        Search,
        Plus,
        Trash2,
        Loader2,
        Calendar,
        Wallet,
        TrendingUp,
        Receipt,
        ArrowUpRight,
    } from "lucide-svelte";
    import {
        OperationalCostsService,
        type OperationalCost,
    } from "$lib/services/operational-costs.service";
    import { api } from "$lib/api";
    import { toast } from "svelte-sonner";
    import DateTimePicker from "$lib/components/custom/date-time-picker.svelte";
    import CurrencyInput from "$lib/components/custom/currency-input.svelte";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { fade, fly } from "svelte/transition";
    import { formatCurrency } from "$lib/utils";

    let costs = $state<OperationalCost[]>([]);
    let accounts = $state<any[]>([]);
    let isLoading = $state(false);
    let searchQuery = $state("");

    // Dialog State
    let isDialogOpen = $state(false);
    let isSaving = $state(false);

    // Form State
    let formData = $state({
        category: "Lainnya",
        amount: 0,
        date: getCurrentLocalISO(),
        description: "",
        sourceAccountId: "1-1001", // Default to Kas Toko
        expenseAccountId: "",
    });

    const categories = [
        "Listrik",
        "Air",
        "Internet",
        "Sewa Ruko",
        "Gaji Karyawan",
        "Bonus Teknisi",
        "Konsumsi",
        "ATK",
        "Perawatan Toko",
        "Marketing",
        "Lainnya",
    ];

    function getCurrentLocalISO() {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000; // offset in milliseconds
        const local = new Date(now.getTime() - offset);
        return local.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
    }

    onMount(() => {
        loadData();
        fetchAccounts();
    });

    async function fetchAccounts() {
        try {
            const res = await api.get("/accounting/accounts");
            accounts = res.data;
        } catch (error) {
            console.error("Failed to fetch accounts", error);
        }
    }

    // Smart Auto-fill Logic
    function handleCategoryChange() {
        if (!accounts.length) return;

        const category = formData.category.toLowerCase();
        let targetCode = "";

        // Map categories to likely account codes/names
        if (category.includes("listrik"))
            targetCode = "5100"; // adjust based on actual data
        else if (category.includes("air")) targetCode = "5200";
        else if (category.includes("gaji")) targetCode = "5204";
        else if (category.includes("sewa")) targetCode = "5203";
        else if (category.includes("internet")) targetCode = "5202";
        else targetCode = "5200"; // Fallback to Beban Operasional

        // Find account that matches specific code or name
        // We look for strict code match first
        let found = accounts.find(
            (a) =>
                a.name.toLowerCase().includes(category) &&
                a.typeId === "EXPENSE",
        );

        // If specific text match fails, try hardcoded map
        if (!found) {
            if (category === "listrik")
                found = accounts.find((a) =>
                    a.name.toLowerCase().includes("listrik"),
                );
            if (category === "air")
                found = accounts.find(
                    (a) =>
                        a.name.toLowerCase().includes("air") ||
                        a.name.toLowerCase().includes("pam"),
                );
            if (category === "internet")
                found = accounts.find(
                    (a) =>
                        a.name.toLowerCase().includes("internet") ||
                        a.name.toLowerCase().includes("wifi"),
                );
            if (category === "sewa ruko")
                found = accounts.find((a) =>
                    a.name.toLowerCase().includes("sewa"),
                );
            if (category === "gaji karyawan")
                found = accounts.find((a) =>
                    a.name.toLowerCase().includes("gaji"),
                );
        }

        if (found) {
            formData.expenseAccountId = found.id;
        } else {
            // Fallback to general operational expense if exists
            const general = accounts.find(
                (a) =>
                    a.name.toLowerCase() === "beban operasional" ||
                    a.code === "5200",
            );
            if (general) formData.expenseAccountId = general.id;
        }
    }

    async function loadData() {
        try {
            isLoading = true;
            costs = await OperationalCostsService.getAll();
        } catch (error) {
            toast.error("Gagal memuat data biaya operasional");
        } finally {
            isLoading = false;
        }
    }

    function resetForm() {
        formData = {
            category: "Lainnya",
            amount: 0,
            date: getCurrentLocalISO(),
            description: "",
            sourceAccountId: "1-1001",
            expenseAccountId: "",
        };
    }

    function openAddDialog() {
        resetForm();
        isDialogOpen = true;
    }

    async function saveCost() {
        if (!formData.amount || formData.amount <= 0) {
            toast.error("Jumlah harus lebih dari 0");
            return;
        }

        try {
            isSaving = true;
            await OperationalCostsService.create(formData);
            toast.success("Pengeluaran berhasil dicatat");
            isDialogOpen = false;
            loadData();
        } catch (error) {
            toast.error("Gagal menyimpan data");
        } finally {
            isSaving = false;
        }
    }

    async function deleteCost(id: number) {
        if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

        try {
            await OperationalCostsService.delete(id);
            toast.success("Data berhasil dihapus");
            loadData();
        } catch (error) {
            toast.error("Gagal menghapus data");
        }
    }

    let filteredCosts = $derived(
        costs.filter(
            (c) =>
                c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.description &&
                    c.description
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())),
        ),
    );

    function formatDate(date: string | Date) {
        return new Date(date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    // Sort by date (newest first)
    let sortedCosts = $derived(
        [...filteredCosts].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    );

    // Stats Calculation
    let totalExpenses = $derived(
        costs.reduce((sum, item) => sum + item.amount, 0),
    );
    let currentMonthExpenses = $derived(
        costs
            .filter((c) => {
                const date = new Date(c.date);
                const now = new Date();
                return (
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear()
                );
            })
            .reduce((sum, item) => sum + item.amount, 0),
    );

    let assetAccounts = $derived(
        accounts.filter(
            (a) =>
                a.typeId === "ASSET" &&
                (a.code.startsWith("10") || a.code.startsWith("11")),
        ),
    ); // Simple filter for Cash/Bank if structure known, or just ASSET
    // Better to filter by what seems like Cash/Bank.
    // Based on seed: 1-1000 Kas & Bank, 1-1001 Kas Toko, 1-1002 Bank BCA.
    // So filtering by code starting with "10" (mapped from 1-10xx) or just showing all ASSETS is safer but maybe too many?
    // Let's filter by typeId="ASSET" and maybe name/description keywords?
    // Or just all ASSET for flexibility. The user might pay with "Piutang" (rare)?
    // Let's assume strict Cash/Bank usually starts with certain codes.
    // Seed says: 1-1000, 1-1001.
    // Let's use filter: typeId === 'ASSET'

    let cashBankAccounts = $derived(
        accounts.filter(
            (a) =>
                a.typeId === "ASSET" &&
                (a.name.toLowerCase().includes("kas") ||
                    a.name.toLowerCase().includes("bank")),
        ),
    );
    let expenseAccounts = $derived(
        accounts.filter((a) => a.typeId === "EXPENSE"),
    );
</script>

<div class="min-h-screen space-y-8 p-6 pb-20">
    <!-- Header with Gradient -->
    <div
        class="relative bg-gradient-to-r from-red-600 to-rose-600 rounded-3xl p-8 text-white overflow-hidden shadow-2xl"
    >
        <div
            class="absolute inset-0 bg-white/10 opacity-20 pattern-dots pointer-events-none"
        ></div>
        <div
            class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
            <div>
                <div class="flex items-center gap-3 mb-2">
                    <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Wallet class="h-6 w-6 text-white" />
                    </div>
                    <h1 class="text-3xl font-bold tracking-tight text-white">
                        Biaya Operasional
                    </h1>
                </div>
                <p class="text-white/80 max-w-xl text-lg font-light">
                    Kelola pengeluaran dan operasional toko agar keuangan tetap
                    sehat.
                </p>
            </div>
            <Button
                onclick={openAddDialog}
                size="lg"
                class="bg-white text-red-600 hover:bg-white/90 shadow-lg font-bold"
            >
                <Plus class="mr-2 h-5 w-5" />
                Catat Pengeluaran
            </Button>
        </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-4 md:grid-cols-3">
        <Card
            class="bg-card/50 backdrop-blur border-l-4 border-l-red-500 shadow-sm"
        >
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium text-muted-foreground"
                    >Total Pengeluaran (Semua)</CardTitle
                >
                <Wallet class="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold text-red-600">
                    {formatCurrency(totalExpenses)}
                </div>
                <p class="text-xs text-muted-foreground mt-1">
                    Akumulasi semua data
                </p>
            </CardContent>
        </Card>

        <Card
            class="bg-card/50 backdrop-blur border-l-4 border-l-rose-500 shadow-sm"
        >
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium text-muted-foreground"
                    >Pengeluaran Bulan Ini</CardTitle
                >
                <Calendar class="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold text-rose-600">
                    {formatCurrency(currentMonthExpenses)}
                </div>
                <p class="text-xs text-muted-foreground mt-1">
                    {new Date().toLocaleDateString("id-ID", {
                        month: "long",
                        year: "numeric",
                    })}
                </p>
            </CardContent>
        </Card>

        <Card
            class="bg-card/50 backdrop-blur border-l-4 border-l-orange-500 shadow-sm"
        >
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium text-muted-foreground"
                    >Transaksi Terakhir</CardTitle
                >
                <Receipt class="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
                {#if sortedCosts.length > 0}
                    <div class="text-lg font-bold truncate">
                        {sortedCosts[0].category}
                    </div>
                    <p class="text-xs text-muted-foreground mt-1">
                        {formatCurrency(sortedCosts[0].amount)} • {new Date(
                            sortedCosts[0].date,
                        ).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                        })}
                    </p>
                {:else}
                    <div class="text-sm text-muted-foreground italic">
                        Belum ada data
                    </div>
                {/if}
            </CardContent>
        </Card>
    </div>

    <!-- Main Content -->
    <div class="space-y-4">
        <!-- Toolbar -->
        <div
            class="flex items-center gap-4 bg-background/50 p-1 rounded-xl backdrop-blur-sm"
        >
            <div class="relative flex-1 max-w-sm">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                />
                <Input
                    placeholder="Cari berdasarkan kategori atau keterangan..."
                    class="pl-9 bg-card border-none shadow-sm focus-visible:ring-1 focus-visible:ring-red-500"
                    bind:value={searchQuery}
                />
            </div>
        </div>

        <!-- Table -->
        <div
            class="rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden"
        >
            <Table>
                <TableHeader class="bg-muted/50">
                    <TableRow>
                        <TableHead class="w-[200px]">Tanggal</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead class="text-right">Jumlah</TableHead>
                        <TableHead class="text-right w-[100px]">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {#if isLoading}
                        <TableRow>
                            <TableCell colspan={5} class="h-32 text-center">
                                <div
                                    class="flex flex-col items-center justify-center gap-2 text-muted-foreground"
                                >
                                    <Loader2 class="h-6 w-6 animate-spin" />
                                    <p class="text-xs">Memuat data...</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    {:else if sortedCosts.length === 0}
                        <TableRow>
                            <TableCell
                                colspan={5}
                                class="h-32 text-center text-muted-foreground"
                            >
                                <div
                                    class="flex flex-col items-center justify-center gap-2 opacity-50"
                                >
                                    <Wallet class="h-8 w-8" />
                                    <p>Belum ada data biaya operasional.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    {:else}
                        {#each sortedCosts as cost (cost.id)}
                            <TableRow
                                class="hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors"
                            >
                                <TableCell>
                                    <div
                                        class="flex items-center gap-2 font-medium"
                                    >
                                        <div
                                            class="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400"
                                        >
                                            <Calendar class="h-4 w-4" />
                                        </div>
                                        {formatDate(cost.date)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span
                                        class="inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold border-transparent bg-secondary text-secondary-foreground"
                                    >
                                        {cost.category}
                                    </span>
                                </TableCell>
                                <TableCell
                                    class="text-muted-foreground max-w-[300px] truncate"
                                    title={cost.description}
                                >
                                    {cost.description || "-"}
                                </TableCell>
                                <TableCell
                                    class="text-right font-bold font-mono text-base"
                                >
                                    {formatCurrency(cost.amount)}
                                </TableCell>
                                <TableCell class="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        class="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                        onclick={() => deleteCost(cost.id)}
                                    >
                                        <Trash2 class="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        {/each}
                    {/if}
                </TableBody>
            </Table>
        </div>
    </div>
</div>

<Dialog bind:open={isDialogOpen}>
    <DialogContent
        class="sm:max-w-[500px] p-0 overflow-hidden gap-0 rounded-2xl"
    >
        <DialogHeader
            class="p-6 bg-gradient-to-r from-red-600 to-rose-600 text-white"
        >
            <DialogTitle class="flex items-center gap-2 text-xl">
                <Receipt class="h-5 w-5" /> Catat Pengeluaran
            </DialogTitle>
            <p class="text-red-100 text-sm mt-1">
                Masukkan detail biaya operasional baru.
            </p>
        </DialogHeader>

        <div class="grid gap-5 p-6 bg-background">
            <div class="grid grid-cols-2 gap-4">
                <div class="grid gap-2">
                    <Label>Tanggal</Label>
                    <DateTimePicker bind:value={formData.date} />
                </div>
                <div class="grid gap-2">
                    <Label>Kategori</Label>
                    <Select
                        type="single"
                        bind:value={formData.category}
                        onValueChange={handleCategoryChange}
                    >
                        <SelectTrigger class="w-full">
                            {formData.category}
                        </SelectTrigger>
                        <SelectContent class="max-h-[300px]">
                            {#each categories as cat}
                                <SelectItem value={cat}>{cat}</SelectItem>
                            {/each}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <!-- Dynamic Account Selection -->
            {#if accounts.length > 0}
                <div
                    class="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2"
                >
                    <div class="grid gap-2">
                        <Label>Sumber Dana (Kredit)</Label>
                        <Select
                            type="single"
                            bind:value={formData.sourceAccountId}
                        >
                            <SelectTrigger class="w-full">
                                {accounts.find(
                                    (a) => a.id === formData.sourceAccountId,
                                )?.name || "Pilih Akun"}
                            </SelectTrigger>
                            <SelectContent class="max-h-[300px]">
                                {#each cashBankAccounts as account}
                                    <SelectItem
                                        value={account.id}
                                        label={account.name}
                                    >
                                        <span class="font-medium"
                                            >{account.code}</span
                                        >
                                        - {account.name}
                                    </SelectItem>
                                {/each}
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="grid gap-2">
                        <Label>Akun Biaya (Debit)</Label>
                        <Select
                            type="single"
                            bind:value={formData.expenseAccountId}
                        >
                            <SelectTrigger class="w-full">
                                {accounts.find(
                                    (a) => a.id === formData.expenseAccountId,
                                )?.name || "Pilih Akun"}
                            </SelectTrigger>
                            <SelectContent class="max-h-[300px]">
                                {#each expenseAccounts as account}
                                    <SelectItem
                                        value={account.id}
                                        label={account.name}
                                    >
                                        <span class="font-medium"
                                            >{account.code}</span
                                        >
                                        - {account.name}
                                    </SelectItem>
                                {/each}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            {/if}

            <div class="grid gap-2">
                <Label>Jumlah (Rp)</Label>
                <div class="relative">
                    <CurrencyInput
                        bind:value={formData.amount}
                        class="pl-10 text-lg font-bold"
                    />
                    <div
                        class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold"
                    >
                        Rp
                    </div>
                </div>
            </div>

            <div class="grid gap-2">
                <Label for="description">Keterangan</Label>
                <Textarea
                    id="description"
                    bind:value={formData.description}
                    placeholder="Contoh: Pembayaran listrik bulan Januari..."
                    class="resize-none h-[100px]"
                />
            </div>
        </div>

        <DialogFooter class="p-4 bg-muted/20 border-t">
            <Button variant="ghost" onclick={() => (isDialogOpen = false)}
                >Batal</Button
            >
            <Button
                onclick={saveCost}
                disabled={isSaving}
                class="bg-red-600 hover:bg-red-700 text-white"
            >
                {#if isSaving}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                {:else}
                    <ArrowUpRight class="mr-2 h-4 w-4" />
                    Simpan Pengeluaran
                {/if}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
