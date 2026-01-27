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
    import { Search, Plus, Trash2, Edit, Loader2 } from "lucide-svelte";
    import {
        ServiceToolsService,
        type ServiceTool,
    } from "$lib/services/service-tools.service";
    import { toast } from "svelte-sonner";
    import DateTimePicker from "$lib/components/custom/date-time-picker.svelte";
    import CurrencyInput from "$lib/components/custom/currency-input.svelte";

    let tools = $state<ServiceTool[]>([]);
    let isLoading = $state(false);
    let searchQuery = $state("");

    // Dialog State
    let isDialogOpen = $state(false);
    let isEditing = $state(false);
    let isSaving = $state(false);

    // Form State
    let formData = $state({
        id: "",
        name: "",
        brand: "",
        qty: 1,
        condition: "good" as "good" | "damaged" | "lost",
        purchaseDate: getCurrentLocalISO(),
        price: 0,
        notes: "",
    });

    const conditionOptions = [
        { value: "good", label: "Baik" },
        { value: "damaged", label: "Rusak" },
        { value: "lost", label: "Hilang" },
    ];

    function getCurrentLocalISO() {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const local = new Date(now.getTime() - offset);
        return local.toISOString().slice(0, 16);
    }

    onMount(() => {
        loadData();
    });

    async function loadData() {
        try {
            isLoading = true;
            tools = await ServiceToolsService.getAll();
        } catch (error) {
            toast.error("Gagal memuat data alat");
        } finally {
            isLoading = false;
        }
    }

    function resetForm() {
        formData = {
            id: "",
            name: "",
            brand: "",
            qty: 1,
            condition: "good",
            purchaseDate: getCurrentLocalISO(),
            price: 0,
            notes: "",
        };
        isEditing = false;
    }

    function openAddDialog() {
        resetForm();
        isDialogOpen = true;
    }

    function openEditDialog(tool: ServiceTool) {
        formData = {
            id: tool.id,
            name: tool.name,
            brand: tool.brand || "",
            qty: tool.qty,
            condition: tool.condition,
            purchaseDate: tool.purchaseDate
                ? new Date(tool.purchaseDate).toISOString().split("T")[0]
                : "",
            price: tool.price || 0,
            notes: tool.notes || "",
        };
        isEditing = true;
        isDialogOpen = true;
    }

    async function saveTool() {
        if (!formData.name) {
            toast.error("Nama alat wajib diisi");
            return;
        }

        try {
            isSaving = true;
            // Create a payload that strictly matches Partial<ServiceTool>
            const payload: Partial<ServiceTool> = {
                name: formData.name,
                brand: formData.brand,
                qty: formData.qty,
                condition: formData.condition,
                purchaseDate: formData.purchaseDate,
                price: formData.price,
                notes: formData.notes,
            };

            if (isEditing) {
                await ServiceToolsService.update(formData.id, payload);
                toast.success("Alat berhasil diperbarui");
            } else {
                await ServiceToolsService.create(payload);
                toast.success("Alat berhasil ditambahkan");
            }
            isDialogOpen = false;
            loadData();
        } catch (error) {
            toast.error("Gagal menyimpan data");
        } finally {
            isSaving = false;
        }
    }

    async function deleteTool(id: string) {
        if (!confirm("Apakah Anda yakin ingin menghapus alat ini?")) return;

        try {
            await ServiceToolsService.delete(id);
            toast.success("Alat berhasil dihapus");
            loadData();
        } catch (error) {
            toast.error("Gagal menghapus alat");
        }
    }

    // Modern Svelte 5 derived state
    let filteredTools = $derived(
        tools.filter(
            (t) =>
                t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.brand &&
                    t.brand.toLowerCase().includes(searchQuery.toLowerCase())),
        ),
    );

    function formatPrice(amount: number) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(amount);
    }
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold tracking-tight">Alat Service</h2>
            <p class="text-muted-foreground">
                Inventaris peralatan dan tools service.
            </p>
        </div>
        <Button onclick={openAddDialog}>
            <Plus class="mr-2 h-4 w-4" />
            Tambah Alat
        </Button>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center gap-4">
        <div class="relative flex-1 max-w-sm">
            <Search
                class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            />
            <Input
                placeholder="Cari alat..."
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
                    <TableHead>ID</TableHead>
                    <TableHead>Nama Alat</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Kondisi</TableHead>
                    <TableHead>Harga Beli</TableHead>
                    <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#if isLoading}
                    <TableRow>
                        <TableCell colspan={7} class="h-24 text-center">
                            <div class="flex justify-center items-center">
                                <Loader2
                                    class="h-6 w-6 animate-spin text-muted-foreground"
                                />
                            </div>
                        </TableCell>
                    </TableRow>
                {:else if filteredTools.length === 0}
                    <TableRow>
                        <TableCell
                            colspan={7}
                            class="h-24 text-center text-muted-foreground"
                        >
                            Belum ada data alat service.
                        </TableCell>
                    </TableRow>
                {:else}
                    {#each filteredTools as tool}
                        <TableRow>
                            <TableCell>{tool.id}</TableCell>
                            <TableCell class="font-medium"
                                >{tool.name}</TableCell
                            >
                            <TableCell>{tool.brand || "-"}</TableCell>
                            <TableCell>{tool.qty}</TableCell>
                            <TableCell>
                                <span
                                    class={tool.condition === "good"
                                        ? "text-green-600 font-medium"
                                        : tool.condition === "damaged"
                                          ? "text-red-600 font-medium"
                                          : "text-orange-600 font-medium"}
                                >
                                    {conditionOptions.find(
                                        (c) => c.value === tool.condition,
                                    )?.label || tool.condition}
                                </span>
                            </TableCell>
                            <TableCell>{formatPrice(tool.price || 0)}</TableCell
                            >
                            <TableCell class="text-right">
                                <div class="flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onclick={() => openEditDialog(tool)}
                                    >
                                        <Edit class="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        class="text-red-500 hover:text-red-600"
                                        onclick={() => deleteTool(tool.id)}
                                    >
                                        <Trash2 class="h-4 w-4" />
                                    </Button>
                                </div>
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
            <DialogTitle
                >{isEditing ? "Edit Alat" : "Tambah Alat Baru"}</DialogTitle
            >
        </DialogHeader>

        <div class="grid gap-4 py-4">
            <div class="grid gap-2">
                <Label for="name"
                    >Nama Alat <span class="text-red-500">*</span></Label
                >
                <Input
                    id="name"
                    bind:value={formData.name}
                    placeholder="Contoh: Solder Station"
                />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="grid gap-2">
                    <Label for="brand">Merk / Brand</Label>
                    <Input
                        id="brand"
                        bind:value={formData.brand}
                        placeholder="Contoh: Mechanic"
                    />
                </div>
                <div class="grid gap-2">
                    <Label>Jumlah</Label>
                    <CurrencyInput bind:value={formData.qty} min={1} />
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="grid gap-2">
                    <Label>Kondisi</Label>
                    <Select type="single" bind:value={formData.condition}>
                        <SelectTrigger class="w-full">
                            {conditionOptions.find(
                                (c) => c.value === formData.condition,
                            )?.label || "Pilih"}
                        </SelectTrigger>
                        <SelectContent>
                            {#each conditionOptions as option}
                                <SelectItem value={option.value}
                                    >{option.label}</SelectItem
                                >
                            {/each}
                        </SelectContent>
                    </Select>
                </div>
                <div class="grid gap-2">
                    <Label>Harga Beli</Label>
                    <CurrencyInput bind:value={formData.price} />
                </div>
            </div>

            <div class="grid gap-2">
                <Label>Tanggal Pembelian</Label>
                <DateTimePicker bind:value={formData.purchaseDate} />
            </div>

            <div class="grid gap-2">
                <Label for="notes">Catatan</Label>
                <Textarea
                    id="notes"
                    bind:value={formData.notes}
                    placeholder="Keterangan tambahan..."
                />
            </div>
        </div>

        <DialogFooter>
            <Button variant="outline" onclick={() => (isDialogOpen = false)}
                >Batal</Button
            >
            <Button onclick={saveTool} disabled={isSaving}>
                {#if isSaving}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                {/if}
                Simpan
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
