<script lang="ts">
    import { onMount } from "svelte";
    import { fly, fade } from "svelte/transition";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
    import * as Card from "$lib/components/ui/card";
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
        Edit,
        Loader2,
        Wrench,
        Package,
        AlertTriangle,
        CheckCircle,
        Filter,
        Wallet,
        Calendar,
        History,
        Tag,
        PenTool,
        ClipboardList,
        MoreHorizontal,
        Info,
    } from "lucide-svelte";
    import {
        ServiceToolsService,
        type ServiceTool,
    } from "$lib/services/service-tools.service";
    import { toast } from "svelte-sonner";
    import DateTimePicker from "$lib/components/custom/date-time-picker.svelte";
    import CurrencyInput from "$lib/components/custom/currency-input.svelte";
    import { Badge } from "$lib/components/ui/badge";

    let tools = $state<ServiceTool[]>([]);
    let isLoading = $state(false);
    let searchQuery = $state("");
    let conditionFilter = $state<string>("all");

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
        {
            value: "good",
            label: "Baik",
            color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
            icon: CheckCircle,
        },
        {
            value: "damaged",
            label: "Rusak",
            color: "text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
            icon: AlertTriangle,
        },
        {
            value: "lost",
            label: "Hilang",
            color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
            icon: History,
        },
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

    // Derived State
    let filteredTools = $derived(
        tools.filter((t) => {
            const matchesSearch =
                t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.brand &&
                    t.brand.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCondition =
                conditionFilter === "all" || t.condition === conditionFilter;
            return matchesSearch && matchesCondition;
        }),
    );

    let stats = $derived({
        totalTools: tools.reduce((acc, t) => acc + t.qty, 0),
        totalValue: tools.reduce((acc, t) => acc + (t.price || 0) * t.qty, 0),
        goodCondition: tools
            .filter((t) => t.condition === "good")
            .reduce((acc, t) => acc + t.qty, 0),
        issueCondition: tools
            .filter((t) => t.condition !== "good")
            .reduce((acc, t) => acc + t.qty, 0),
    });

    function formatPrice(amount: number) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    }
</script>

<div class="min-h-screen space-y-8 p-6 pb-20">
    <!-- Header Section -->
    <div
        class="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white overflow-hidden shadow-2xl"
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
                        <Wrench class="h-6 w-6 text-white" />
                    </div>
                    <h1 class="text-3xl font-bold tracking-tight text-white">
                        Alat Service
                    </h1>
                </div>
                <p class="text-blue-100 max-w-xl text-lg">
                    Manajemen inventaris peralatan service dan aset bengkel.
                </p>
            </div>
            <Button
                onclick={openAddDialog}
                size="lg"
                class="bg-white text-blue-600 hover:bg-blue-50 border-0 shadow-lg font-semibold"
            >
                <Plus class="mr-2 h-5 w-5" />
                Tambah Alat Baru
            </Button>
        </div>
    </div>

    <!-- Stats Grid -->
    <div
        in:fade={{ duration: 400, delay: 200 }}
        class="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
        <Card.Root
            class="bg-card/50 backdrop-blur border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-all"
        >
            <Card.Content class="p-5">
                <div class="flex justify-between items-start">
                    <div>
                        <p
                            class="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                        >
                            Total Alat
                        </p>
                        <h3 class="text-2xl font-bold mt-1 text-foreground">
                            {stats.totalTools}
                            <span
                                class="text-sm font-normal text-muted-foreground"
                                >Unit</span
                            >
                        </h3>
                    </div>
                    <div class="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Wrench class="h-5 w-5 text-blue-600" />
                    </div>
                </div>
            </Card.Content>
        </Card.Root>

        <Card.Root
            class="bg-card/50 backdrop-blur border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-all"
        >
            <Card.Content class="p-5">
                <div class="flex justify-between items-start">
                    <div>
                        <p
                            class="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                        >
                            Estimasi Aset
                        </p>
                        <h3 class="text-2xl font-bold mt-1 text-foreground">
                            {formatPrice(stats.totalValue)}
                        </h3>
                    </div>
                    <div
                        class="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg"
                    >
                        <Wallet class="h-5 w-5 text-green-600" />
                    </div>
                </div>
            </Card.Content>
        </Card.Root>

        <Card.Root
            class="bg-card/50 backdrop-blur border-l-4 border-l-emerald-500 shadow-lg hover:shadow-xl transition-all"
        >
            <Card.Content class="p-5">
                <div class="flex justify-between items-start">
                    <div>
                        <p
                            class="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                        >
                            Kondisi Baik
                        </p>
                        <h3 class="text-2xl font-bold mt-1 text-foreground">
                            {stats.goodCondition}
                            <span
                                class="text-sm font-normal text-muted-foreground"
                                >Unit</span
                            >
                        </h3>
                    </div>
                    <div
                        class="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg"
                    >
                        <CheckCircle class="h-5 w-5 text-emerald-600" />
                    </div>
                </div>
            </Card.Content>
        </Card.Root>

        <Card.Root
            class="bg-card/50 backdrop-blur border-l-4 border-l-red-500 shadow-lg hover:shadow-xl transition-all"
        >
            <Card.Content class="p-5">
                <div class="flex justify-between items-start">
                    <div>
                        <p
                            class="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                        >
                            Perlu Perhatian
                        </p>
                        <h3 class="text-2xl font-bold mt-1 text-foreground">
                            {stats.issueCondition}
                            <span
                                class="text-sm font-normal text-muted-foreground"
                                >Unit</span
                            >
                        </h3>
                    </div>
                    <div class="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                        <AlertTriangle class="h-5 w-5 text-red-600" />
                    </div>
                </div>
            </Card.Content>
        </Card.Root>
    </div>

    <!-- Toolbar & Content -->
    <div in:fade={{ duration: 500, delay: 300 }} class="grid gap-6">
        <div
            class="flex flex-col md:flex-row items-center justify-between gap-4 bg-card/40 backdrop-blur-sm p-2 rounded-xl border"
        >
            <div class="relative flex-1 w-full md:max-w-md">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                />
                <Input
                    placeholder="Cari nama alat / brand..."
                    class="pl-9 bg-transparent border-0 focus-visible:ring-0 placeholder:text-muted-foreground"
                    bind:value={searchQuery}
                />
            </div>
            <div class="h-8 w-[1px] bg-border hidden md:block"></div>
            <div class="flex w-full md:w-auto items-center gap-2 pr-2">
                <Filter class="h-4 w-4 text-muted-foreground ml-2" />
                <Select type="single" bind:value={conditionFilter}>
                    <SelectTrigger
                        class="w-[180px] bg-transparent border-0 focus:ring-0"
                    >
                        <div class="flex items-center gap-2 truncate">
                            {conditionFilter === "all"
                                ? "Semua Kondisi"
                                : conditionOptions.find(
                                      (c) => c.value === conditionFilter,
                                  )?.label}
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Kondisi</SelectItem>
                        {#each conditionOptions as option}
                            <SelectItem value={option.value}>
                                <div class="flex items-center gap-2">
                                    <div
                                        class={`h-2 w-2 rounded-full ${option.value === "good" ? "bg-emerald-500" : option.value === "damaged" ? "bg-red-500" : "bg-amber-500"}`}
                                    ></div>
                                    {option.label}
                                </div>
                            </SelectItem>
                        {/each}
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div class="bg-card rounded-xl border shadow-sm overflow-hidden">
            <Table>
                <TableHeader class="bg-muted/50">
                    <TableRow class="hover:bg-transparent">
                        <TableHead class="w-[50px] font-semibold">#</TableHead>
                        <TableHead class="font-semibold"
                            >Informasi Alat</TableHead
                        >
                        <TableHead class="font-semibold">Brand / Merk</TableHead
                        >
                        <TableHead class="font-semibold text-center"
                            >Qty</TableHead
                        >
                        <TableHead class="font-semibold">Kondisi</TableHead>
                        <TableHead class="font-semibold">Investasi</TableHead>
                        <TableHead class="text-right font-semibold"
                            >Aksi</TableHead
                        >
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {#if isLoading}
                        {#each Array(5) as _}
                            <TableRow>
                                <TableCell colspan={7} class="h-16 text-center">
                                    <div
                                        class="w-full h-4 bg-muted/20 animate-pulse rounded"
                                    ></div>
                                </TableCell>
                            </TableRow>
                        {/each}
                    {:else if filteredTools.length === 0}
                        <TableRow>
                            <TableCell colspan={7} class="h-64 text-center">
                                <div
                                    class="flex flex-col items-center justify-center gap-3 opacity-60"
                                >
                                    <Package
                                        class="h-12 w-12 text-muted-foreground/50"
                                    />
                                    <p class="text-lg font-medium">
                                        Tidak ada alat ditemukan
                                    </p>
                                    <p class="text-sm">
                                        Silakan tambah alat baru atau sesuaikan
                                        pencarian.
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    {:else}
                        {#each filteredTools as tool, i (tool.id)}
                            <TableRow
                                class="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                            >
                                <TableCell
                                    class="text-muted-foreground text-xs font-mono"
                                    >{i + 1}</TableCell
                                >
                                <TableCell>
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center"
                                        >
                                            <Wrench class="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div
                                                class="font-semibold text-foreground"
                                            >
                                                {tool.name}
                                            </div>
                                            {#if tool.notes}
                                                <div
                                                    class="text-xs text-muted-foreground truncate max-w-[200px]"
                                                    title={tool.notes}
                                                >
                                                    {tool.notes}
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {#if tool.brand}
                                        <Badge
                                            variant="outline"
                                            class="font-normal bg-secondary/30"
                                            >{tool.brand}</Badge
                                        >
                                    {:else}
                                        <span
                                            class="text-muted-foreground text-sm"
                                            >-</span
                                        >
                                    {/if}
                                </TableCell>
                                <TableCell class="text-center">
                                    <Badge variant="secondary" class="font-mono"
                                        >{tool.qty}</Badge
                                    >
                                </TableCell>
                                <TableCell>
                                    {@const status = conditionOptions.find(
                                        (c) => c.value === tool.condition,
                                    )}
                                    <Badge
                                        variant="outline"
                                        class="{status?.color} font-medium border"
                                    >
                                        {#if status?.icon}
                                            <status.icon
                                                class="w-3 h-3 mr-1.5"
                                            />
                                        {/if}
                                        {status?.label}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span class="font-mono text-sm"
                                        >{formatPrice(tool.price || 0)}</span
                                    >
                                </TableCell>
                                <TableCell class="text-right">
                                    <div
                                        class="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                    >
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            class="h-8 w-8 hover:bg-blue-100 hover:text-blue-600"
                                            onclick={() => openEditDialog(tool)}
                                        >
                                            <Edit class="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            class="h-8 w-8 hover:bg-red-100 hover:text-red-600"
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
</div>

<!-- Enhanced Add/Edit Dialog -->
<Dialog bind:open={isDialogOpen}>
    <DialogContent class="sm:max-w-[650px] p-0 gap-0 overflow-hidden">
        <DialogHeader class="px-6 py-4 border-b bg-muted/30">
            <DialogTitle class="text-xl font-bold flex items-center gap-2">
                <div class="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    {#if isEditing}
                        <Edit class="h-5 w-5" />
                    {:else}
                        <Plus class="h-5 w-5" />
                    {/if}
                </div>
                {isEditing ? "Edit Informasi Alat" : "Tambah Alat Baru"}
            </DialogTitle>
            <p class="text-muted-foreground text-sm mt-1">
                Lengkapi detail inventaris di bawah ini.
            </p>
        </DialogHeader>

        <div class="p-6 space-y-6">
            <div class="grid grid-cols-2 gap-6">
                <!-- Left Column: Main Info -->
                <div class="space-y-4">
                    <div
                        class="flex items-center gap-2 text-sm font-semibold text-foreground/80 pb-2 border-b"
                    >
                        <Info class="h-4 w-4 text-blue-500" /> Informasi Utama
                    </div>

                    <div class="space-y-3">
                        <div class="space-y-1.5">
                            <Label for="name" class="text-xs"
                                >Nama Alat <span class="text-red-500">*</span
                                ></Label
                            >
                            <div class="relative">
                                <Wrench
                                    class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                                />
                                <Input
                                    id="name"
                                    bind:value={formData.name}
                                    placeholder="Contoh: Solder Station"
                                    class="pl-9"
                                />
                            </div>
                        </div>

                        <div class="space-y-1.5">
                            <Label for="brand" class="text-xs"
                                >Merk / Brand</Label
                            >
                            <div class="relative">
                                <Tag
                                    class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                                />
                                <Input
                                    id="brand"
                                    bind:value={formData.brand}
                                    placeholder="Contoh: Mechanic"
                                    class="pl-9"
                                />
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div class="space-y-1.5">
                                <Label class="text-xs">Jumlah (Qty)</Label>
                                <CurrencyInput
                                    bind:value={formData.qty}
                                    min={1}
                                    class="text-center font-bold"
                                />
                            </div>
                            <div class="space-y-1.5">
                                <Label class="text-xs">Kondisi</Label>
                                <Select
                                    type="single"
                                    bind:value={formData.condition}
                                >
                                    <SelectTrigger>
                                        <div
                                            class="flex items-center gap-2 text-xs"
                                        >
                                            {#if formData.condition}
                                                <div
                                                    class={`h-2 w-2 rounded-full ${formData.condition === "good" ? "bg-emerald-500" : formData.condition === "damaged" ? "bg-red-500" : "bg-amber-500"}`}
                                                ></div>
                                                {conditionOptions.find(
                                                    (c) =>
                                                        c.value ===
                                                        formData.condition,
                                                )?.label}
                                            {/if}
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {#each conditionOptions as option}
                                            <SelectItem
                                                value={option.value}
                                                class="text-xs"
                                            >
                                                <div
                                                    class="flex items-center gap-2"
                                                >
                                                    <div
                                                        class={`h-2 w-2 rounded-full ${option.color.split(" ")[0].replace("text-", "bg-")}`}
                                                    ></div>
                                                    {option.label}
                                                </div>
                                            </SelectItem>
                                        {/each}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Details -->
                <div class="space-y-4">
                    <div
                        class="flex items-center gap-2 text-sm font-semibold text-foreground/80 pb-2 border-b"
                    >
                        <ClipboardList class="h-4 w-4 text-orange-500" /> Detail
                        Aset
                    </div>

                    <div class="space-y-3">
                        <div class="space-y-1.5">
                            <Label class="text-xs">Harga / Nilai Beli</Label>
                            <div class="relative">
                                <div
                                    class="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground"
                                >
                                    Rp
                                </div>
                                <CurrencyInput
                                    bind:value={formData.price}
                                    class="pl-8 text-right font-mono"
                                />
                            </div>
                        </div>

                        <div class="space-y-1.5">
                            <Label class="text-xs">Tanggal Pembelian</Label>
                            <DateTimePicker
                                bind:value={formData.purchaseDate}
                                showTime={false}
                            />
                        </div>

                        <div class="space-y-1.5">
                            <Label for="notes" class="text-xs">Catatan</Label>
                            <Textarea
                                id="notes"
                                bind:value={formData.notes}
                                placeholder="Keterangan tambahan..."
                                class="resize-none h-[88px] text-xs"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <DialogFooter class="p-4 border-t bg-muted/30">
            <Button variant="outline" onclick={() => (isDialogOpen = false)}
                >Batal</Button
            >
            <Button
                onclick={saveTool}
                disabled={isSaving}
                class="min-w-[120px] bg-blue-600 hover:bg-blue-700"
            >
                {#if isSaving}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                {/if}
                Simpan
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
