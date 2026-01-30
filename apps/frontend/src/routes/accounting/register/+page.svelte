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
    } from "$lib/components/ui/dialog";
    import {
        Wallet,
        ChevronRight,
        Loader2,
        DollarSign,
        ArrowDownLeft,
        ArrowUpRight,
        Clock,
        CheckCircle2,
        AlertCircle,
    } from "lucide-svelte";
    import { api } from "$lib/api";

    let loading = $state(true);
    let register = $state<any>(null);
    let status = $state<any>(null);
    let showOpenDialog = $state(false);
    let showCloseDialog = $state(false);
    let submitting = $state(false);

    let openingBalance = $state(0);
    let actualClosing = $state(0);
    let closingNotes = $state("");

    // Reservation State
    let accounts = $state<any[]>([]);
    let doReserve = $state(true);
    let reserveAmount = $state(0);
    let targetAccountId = $state("");

    async function fetchAccounts() {
        const res = await api.get("/accounting/accounts");
        accounts = res.data;
        // Pre-select first "Dana Cadangan" account if any
        const pref = accounts.find((a) =>
            a.name.toLowerCase().includes("cadangan"),
        );
        if (pref) targetAccountId = pref.id;
    }

    async function fetchData() {
        try {
            loading = true;
            const [regRes, statusRes] = await Promise.all([
                api.get("/accounting/register/current"),
                api.get("/accounting/register/status"),
            ]);
            register = regRes.data;
            status = statusRes.data;
        } catch (e) {
            console.error("Failed to fetch register data", e);
        } finally {
            loading = false;
        }
    }

    async function openRegister() {
        try {
            submitting = true;
            await api.post("/accounting/register/open", { openingBalance });
            showOpenDialog = false;
            await fetchData();
        } catch (e: any) {
            alert(e.response?.data?.error || "Gagal membuka kas");
        } finally {
            submitting = false;
        }
    }

    async function closeRegister() {
        try {
            submitting = true;
            await api.post("/accounting/register/close", {
                actualClosing,
                notes: closingNotes,
                reserveAmount: doReserve ? reserveAmount : 0,
                targetAccountId: doReserve ? targetAccountId : undefined,
            });
            showCloseDialog = false;
            await fetchData();
        } catch (e: any) {
            alert(e.response?.data?.error || "Gagal menutup kas");
        } finally {
            submitting = false;
        }
    }

    onMount(() => {
        fetchData();
        fetchAccounts();
    });

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);

    const formatTime = (date: string) =>
        new Date(date).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
        });

    let difference = $derived(
        register?.status === "closed"
            ? (register.actualClosing || 0) - (register.expectedClosing || 0)
            : 0,
    );
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
                <span class="text-slate-900 font-medium">Kas Harian</span>
            </div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
                Cash Register
            </h1>
        </div>
    </div>

    {#if loading}
        <div class="flex items-center justify-center py-20">
            <Loader2 class="h-8 w-8 animate-spin text-blue-600" />
        </div>
    {:else}
        <!-- Register Status Card -->
        <Card
            class="border-0 shadow-lg rounded-3xl overflow-hidden {status?.isOpen
                ? 'bg-gradient-to-br from-green-600 to-emerald-700'
                : 'bg-gradient-to-br from-slate-600 to-slate-700'} text-white"
        >
            <CardContent class="p-8">
                <div class="flex flex-col lg:flex-row justify-between gap-8">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-4">
                            <div class="p-3 bg-white/20 rounded-xl">
                                <Wallet class="h-6 w-6" />
                            </div>
                            <div>
                                <span class="text-sm opacity-80"
                                    >Status Kas</span
                                >
                                <div class="text-xl font-bold">
                                    {status?.isOpen ? "BUKA" : "TUTUP"}
                                </div>
                            </div>
                        </div>

                        {#if status?.isOpen}
                            <div class="space-y-4">
                                <div>
                                    <p class="text-sm opacity-80">Saldo Awal</p>
                                    <p class="text-2xl font-bold">
                                        {formatCurrency(
                                            status.openingBalance || 0,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p class="text-sm opacity-80">
                                        Saldo Saat Ini (Expecting)
                                    </p>
                                    <p class="text-3xl font-bold">
                                        {formatCurrency(
                                            status.expectedClosing || 0,
                                        )}
                                    </p>
                                </div>
                            </div>
                        {:else}
                            <p class="text-lg opacity-80">
                                Kas belum dibuka untuk hari ini
                            </p>
                        {/if}
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-4">
                        {#if status?.isOpen}
                            <Button
                                variant="secondary"
                                size="lg"
                                class="bg-white text-green-700 hover:bg-green-50"
                                onclick={() => {
                                    actualClosing = status.expectedClosing || 0;
                                    reserveAmount = status.dailyBreakeven || 0;
                                    showCloseDialog = true;
                                }}
                            >
                                Tutup Kas
                            </Button>
                        {:else}
                            <Button
                                size="lg"
                                class="bg-white text-slate-700 hover:bg-slate-100"
                                onclick={() => (showOpenDialog = true)}
                            >
                                Buka Kas
                            </Button>
                        {/if}
                    </div>
                </div>

                <!-- Stats Row -->
                {#if status?.isOpen}
                    <div
                        class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/20"
                    >
                        <div class="text-center">
                            <p class="text-sm opacity-80">Transaksi</p>
                            <p class="text-xl font-bold">
                                {status.transactionCount || 0}
                            </p>
                        </div>
                        <div class="text-center">
                            <p class="text-sm opacity-80">Penjualan</p>
                            <p class="text-xl font-bold">
                                {formatCurrency(status.salesTotal || 0)}
                            </p>
                        </div>
                        <div class="text-center">
                            <p class="text-sm opacity-80">Service</p>
                            <p class="text-xl font-bold">
                                {formatCurrency(status.serviceTotal || 0)}
                            </p>
                        </div>
                        <div class="text-center">
                            <p class="text-sm opacity-80">Pengeluaran</p>
                            <p class="text-xl font-bold">
                                {formatCurrency(status.expenseTotal || 0)}
                            </p>
                        </div>
                    </div>
                {/if}
            </CardContent>
        </Card>

        <!-- Last Closed Register -->
        {#if register && register.status === "closed"}
            <Card class="border-0 shadow-md rounded-2xl">
                <CardHeader>
                    <CardTitle class="text-lg">Kas Terakhir Ditutup</CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p class="text-sm text-slate-500">Tanggal</p>
                            <p class="font-medium">
                                {new Date(register.date).toLocaleDateString(
                                    "id-ID",
                                )}
                            </p>
                        </div>
                        <div>
                            <p class="text-sm text-slate-500">Expected</p>
                            <p class="font-medium">
                                {formatCurrency(register.expectedClosing)}
                            </p>
                        </div>
                        <div>
                            <p class="text-sm text-slate-500">Aktual</p>
                            <p class="font-medium">
                                {formatCurrency(register.actualClosing)}
                            </p>
                        </div>
                        <div>
                            <p class="text-sm text-slate-500">Selisih</p>
                            <p
                                class="font-bold {difference >= 0
                                    ? 'text-green-600'
                                    : 'text-red-600'}"
                            >
                                {difference >= 0 ? "+" : ""}{formatCurrency(
                                    difference,
                                )}
                            </p>
                        </div>
                    </div>
                    {#if register.notes}
                        <div class="p-3 bg-slate-50 rounded-lg">
                            <p class="text-sm text-slate-600">
                                {register.notes}
                            </p>
                        </div>
                    {/if}
                </CardContent>
            </Card>
        {/if}
    {/if}
</div>

<!-- Open Register Dialog -->
<Dialog bind:open={showOpenDialog}>
    <DialogContent class="max-w-md">
        <DialogHeader>
            <DialogTitle>Buka Kas Harian</DialogTitle>
        </DialogHeader>
        <form
            onsubmit={(e) => {
                e.preventDefault();
                openRegister();
            }}
            class="space-y-4"
        >
            <div class="space-y-2">
                <Label>Saldo Awal (Kas di tangan)</Label>
                <Input
                    type="number"
                    bind:value={openingBalance}
                    placeholder="0"
                    min="0"
                />
            </div>
            <div class="flex justify-end gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onclick={() => (showOpenDialog = false)}
                >
                    Batal
                </Button>
                <Button type="submit" disabled={submitting}>
                    {#if submitting}
                        <Loader2 class="h-4 w-4 animate-spin mr-2" />
                    {/if}
                    Buka Kas
                </Button>
            </div>
        </form>
    </DialogContent>
</Dialog>

<!-- Close Register Dialog -->
<Dialog bind:open={showCloseDialog}>
    <DialogContent class="max-w-md">
        <DialogHeader>
            <DialogTitle>Tutup Kas Harian</DialogTitle>
        </DialogHeader>
        <form
            onsubmit={(e) => {
                e.preventDefault();
                closeRegister();
            }}
            class="space-y-4"
        >
            <div class="p-4 bg-blue-50 rounded-lg">
                <p class="text-sm text-blue-700">
                    Expected closing: <strong
                        >{formatCurrency(status?.expectedClosing || 0)}</strong
                    >
                </p>
            </div>

            <div class="space-y-2">
                <Label>Jumlah Kas Aktual</Label>
                <Input
                    type="number"
                    bind:value={actualClosing}
                    placeholder="0"
                    min="0"
                />
                {#if actualClosing !== (status?.expectedClosing || 0)}
                    <p
                        class="text-sm {actualClosing >
                        (status?.expectedClosing || 0)
                            ? 'text-green-600'
                            : 'text-red-600'}"
                    >
                        Selisih: {actualClosing > (status?.expectedClosing || 0)
                            ? "+"
                            : ""}{formatCurrency(
                            actualClosing - (status?.expectedClosing || 0),
                        )}
                    </p>
                {/if}
            </div>

            <div class="space-y-2">
                <Label>Catatan</Label>
                <Input
                    bind:value={closingNotes}
                    placeholder="Catatan penutupan kas..."
                />
            </div>

            <div class="pt-4 border-t space-y-4">
                <div class="flex items-center justify-between">
                    <Label class="text-xs font-bold text-slate-500 uppercase"
                        >Sisihkan Dana Cadangan</Label
                    >
                    <input
                        type="checkbox"
                        bind:checked={doReserve}
                        class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                    />
                </div>

                {#if doReserve}
                    <div
                        class="space-y-3 animate-in slide-in-from-top-2 duration-300"
                    >
                        <div
                            class="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-3"
                        >
                            <ArrowUpRight
                                class="h-5 w-5 text-amber-600 shrink-0"
                            />
                            <div
                                class="text-[11px] text-amber-800 leading-normal"
                            >
                                <p class="font-bold">Pemindahan Otomatis</p>
                                <p>
                                    Sistem menyarankan nominal berdasarkan Beban
                                    Operasional + Penyusutan harian Anda.
                                </p>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <Label class="text-xs"
                                >Nominal yang Disisihkan</Label
                            >
                            <Input
                                type="number"
                                bind:value={reserveAmount}
                                class="h-9 font-medium"
                            />
                        </div>

                        <div class="space-y-2">
                            <Label class="text-xs">Tujuan Dana</Label>
                            <select
                                bind:value={targetAccountId}
                                class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="" disabled
                                    >Pilih Akun Cadangan</option
                                >
                                {#each accounts.filter((a) => a.typeId === "ASSET") as acc}
                                    <option value={acc.id}
                                        >{acc.name} ({acc.code})</option
                                    >
                                {/each}
                            </select>
                        </div>
                    </div>
                {/if}
            </div>

            <div class="flex justify-end gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onclick={() => (showCloseDialog = false)}
                >
                    Batal
                </Button>
                <Button type="submit" disabled={submitting}>
                    {#if submitting}
                        <Loader2 class="h-4 w-4 animate-spin mr-2" />
                    {/if}
                    Tutup Kas
                </Button>
            </div>
        </form>
    </DialogContent>
</Dialog>
