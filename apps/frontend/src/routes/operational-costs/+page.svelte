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
    import { Search, Plus, Trash2, Loader2, Calendar } from "lucide-svelte";
    import {
        OperationalCostsService,
        type OperationalCost,
    } from "$lib/services/operational-costs.service";
    import { toast } from "svelte-sonner";
    import DateTimePicker from "$lib/components/custom/date-time-picker.svelte";
    import CurrencyInput from "$lib/components/custom/currency-input.svelte";

    let costs = $state<OperationalCost[]>([]);
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
    });

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

    function formatPrice(amount: number) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(amount);
    }

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
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold tracking-tight">Biaya Operasional</h2>
            <p class="text-muted-foreground">
                Catat dan kelola pengeluaran operasional toko.
            </p>
        </div>
        <Button onclick={openAddDialog}>
            <Plus class="mr-2 h-4 w-4" />
            Catat Pengeluaran
        </Button>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center gap-4">
        <div class="relative flex-1 max-w-sm">
            <Search
                class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            />
            <Input
                placeholder="Cari pengeluaran..."
                class="pl-8"
                bind:value={searchQuery}
            />
        </div>
    </div>

    <!-- Content -->
    <div class="rounded-md border">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead class="text-right">Jumlah</TableHead>
                    <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#if isLoading}
                    <TableRow>
                        <TableCell colspan={5} class="h-24 text-center">
                            <div class="flex justify-center items-center">
                                <Loader2
                                    class="h-6 w-6 animate-spin text-muted-foreground"
                                />
                            </div>
                        </TableCell>
                    </TableRow>
                {:else if sortedCosts.length === 0}
                    <TableRow>
                        <TableCell
                            colspan={5}
                            class="h-24 text-center text-muted-foreground"
                        >
                            Belum ada data biaya operasional.
                        </TableCell>
                    </TableRow>
                {:else}
                    {#each sortedCosts as cost}
                        <TableRow>
                            <TableCell>
                                <div class="flex items-center gap-2">
                                    <Calendar
                                        class="h-4 w-4 text-muted-foreground"
                                    />
                                    {formatDate(cost.date)}
                                </div>
                            </TableCell>
                            <TableCell>
                                <span
                                    class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                >
                                    {cost.category}
                                </span>
                            </TableCell>
                            <TableCell>{cost.description || "-"}</TableCell>
                            <TableCell class="text-right font-medium"
                                >{formatPrice(cost.amount)}</TableCell
                            >
                            <TableCell class="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="text-red-500 hover:text-red-600"
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

<Dialog bind:open={isDialogOpen}>
    <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
            <DialogTitle>Catat Pengeluaran Baru</DialogTitle>
        </DialogHeader>

        <div class="grid gap-4 py-4">
            <div class="grid gap-2">
                <Label>Tanggal</Label>
                <DateTimePicker bind:value={formData.date} />
            </div>

            <div class="grid gap-2">
                <Label>Kategori</Label>
                <Select type="single" bind:value={formData.category}>
                    <SelectTrigger class="w-full">
                        {formData.category}
                    </SelectTrigger>
                    <SelectContent>
                        {#each categories as cat}
                            <SelectItem value={cat}>{cat}</SelectItem>
                        {/each}
                    </SelectContent>
                </Select>
            </div>

            <div class="grid gap-2">
                <Label>Jumlah (Rp)</Label>
                <CurrencyInput bind:value={formData.amount} />
            </div>

            <div class="grid gap-2">
                <Label for="description">Keterangan</Label>
                <Textarea
                    id="description"
                    bind:value={formData.description}
                    placeholder="Detail pengeluaran..."
                />
            </div>
        </div>

        <DialogFooter>
            <Button variant="outline" onclick={() => (isDialogOpen = false)}
                >Batal</Button
            >
            <Button onclick={saveCost} disabled={isSaving}>
                {#if isSaving}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                {/if}
                Simpan
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
