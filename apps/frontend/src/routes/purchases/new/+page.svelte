<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { toast } from "svelte-sonner";
    import { goto } from "$app/navigation";
    import {
        Plus,
        Trash2,
        Save,
        ArrowLeft,
        Wand2,
        Store,
        Phone,
        MapPin,
        User,
    } from "lucide-svelte";
    import { Badge } from "$lib/components/ui/badge";
    import { Separator } from "$lib/components/ui/separator";
    import Combobox from "$lib/components/custom/combobox.svelte";
    import DateTimePicker from "$lib/components/custom/date-time-picker.svelte";
    import { InventoryService } from "$lib/services/inventory.service";

    let suppliers = $state<any[]>([]);
    let products = $state<any[]>([]);
    let loading = $state(false);
    let recentPurchases = $state<any[]>([]);

    // Form State
    let selectedSupplierId = $state("");
    let notes = $state("");
    // Default to Today YYYY-MM-DDTHH:mm
    const now = new Date();
    // Adjust to local ISO string for datetime-local
    const offset = now.getTimezoneOffset() * 60000;
    let date = $state(
        new Date(now.getTime() - offset).toISOString().slice(0, 16),
    );
    let items = $state<
        Array<{
            productId: string;
            productName: string;
            variant: string;
            qty: number;
            buyPrice: number;
            sellPrice: number;
        }>
    >([]);

    // Helper for adding row
    function addItem() {
        items = [
            ...items,
            {
                productId: "",
                productName: "",
                variant: "",
                qty: 1,
                buyPrice: 0,
                sellPrice: 0,
            },
        ];
    }

    function removeItem(index: number) {
        items = items.filter((_, i) => i !== index);
    }

    // Cache variants for current supplier
    let supplierVariants = $state<string[]>([]);

    async function loadVariants(supplierId: string) {
        if (!supplierId) return;
        try {
            const data = await InventoryService.getSupplierVariants(supplierId);
            supplierVariants = Array.isArray(data) ? data : [];
        } catch (e) {
            console.error("Failed to load variants", e);
            supplierVariants = [];
        }
    }

    async function loadData() {
        try {
            const [supData, prodData] = await Promise.all([
                InventoryService.getSuppliers(),
                InventoryService.getProducts(),
            ]);
            suppliers = supData;
            products = prodData;
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat data");
        }
    }

    async function loadRecentHistory() {
        try {
            // Parse Local Date String to DB UTC Query
            // Since backend is UTC, we need to send the simplified ISO string of the START of the local day
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            const isoStart = d.toISOString();

            const res = await api.get(
                `/purchases?mine=true&startDate=${isoStart}&limit=3`,
            );
            recentPurchases = res.data?.data || [];
        } catch (e) {
            console.error("Failed to load history", e);
        }
    }

    function generateInvoiceNumber() {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const random = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0");
        return `INV/${yyyy}${mm}${dd}/${random}`;
    }

    // Handle Supplier Change
    async function onSupplierChange() {
        // Reset items when supplier changes because variants depend on supplier
        items = [
            {
                productId: "",
                productName: "",
                variant: "Original",
                qty: 1,
                buyPrice: 0,
                sellPrice: 0,
            },
        ];
        supplierVariants = []; // Clear
        if (selectedSupplierId) {
            await loadVariants(selectedSupplierId);
        }
    }

    // Handle Product Selection
    function onProductSelect(index: number, productId: string) {
        const prod = products.find((p) => p.id === productId);
        if (prod) {
            items[index].productId = productId;
            items[index].productName = prod.name;
            items[index].buyPrice = 0;
            items[index].sellPrice = 0;
            items[index].variant = ""; // Reset variant
            // Variants are already loaded by Supplier
        }
        items = items;
    }

    let totalAmount = $derived(
        items.reduce((sum, item) => sum + item.buyPrice * item.qty, 0),
    );

    async function handleSubmit() {
        if (!selectedSupplierId) return toast.error("Pilih Supplier");
        if (items.length === 0) return toast.error("Minimal 1 item");
        for (const item of items) {
            if (!item.productId)
                return toast.error("Pilih produk untuk semua baris");
            if (item.qty < 1) return toast.error("Jumlah minimal 1");
        }

        loading = true;
        try {
            const payload = {
                supplierId: selectedSupplierId,
                notes,
                date,
                items: items.map((i) => ({
                    productId: i.productId,
                    variant: i.variant,
                    qty: i.qty,
                    buyPrice: i.buyPrice,
                    sellPrice: i.sellPrice,
                })),
            };

            await api("/purchases", { method: "POST", data: payload });
            toast.success("Pembelian Berhasil Disimpan!");

            await loadRecentHistory(); // Refresh history
            resetForm();
            // Reload variants (maybe new one added?)
            if (selectedSupplierId) await loadVariants(selectedSupplierId);
        } catch (e: any) {
            console.error(e);
            toast.error(
                e.response?.data?.message || "Gagal menyimpan transaksi",
            );
        } finally {
            loading = false;
        }
    }

    function resetForm() {
        notes = "";
        items = [
            {
                productId: "",
                productName: "",
                variant: "Original",
                qty: 1,
                buyPrice: 0,
                sellPrice: 0,
            },
        ];
    }

    function formatRp(val: number) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(val);
    }

    onMount(() => {
        loadData();
        loadRecentHistory();
        addItem();
    });

    // Refresh history when date changes
    $effect(() => {
        if (date) {
            loadRecentHistory();
        }
    });
</script>

<div class="space-y-6 max-w-4xl mx-auto pb-12">
    <div class="flex items-center gap-4">
        <Button variant="outline" size="icon" href="/purchases">
            <ArrowLeft class="h-4 w-4" />
        </Button>
        <div>
            <h2 class="text-2xl font-bold tracking-tight">
                Buat Pembelian Baru
            </h2>
            <p class="text-muted-foreground">Catat stok masuk dari supplier.</p>
        </div>
    </div>

    <!-- Header Section: Supplier & Date -->
    <Card>
        <CardContent class="p-6">
            <!-- Row 1: Invoice & Date -->
            <div class="grid gap-6 md:grid-cols-2 mb-6">
                <!-- No Faktur (Position 1) -->
                <div class="space-y-2">
                    <Label>No. Faktur / Catatan</Label>
                    <div class="flex gap-2">
                        <Input
                            bind:value={notes}
                            placeholder="Contoh: INV/2024/001"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onclick={() => (notes = generateInvoiceNumber())}
                            title="Generate Invoice Otomatis"
                        >
                            <Wand2 class="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <!-- Tanggal (Position 2) -->
                <div class="space-y-2">
                    <Label>Waktu Pembelian</Label>
                    <DateTimePicker bind:value={date} />
                </div>
            </div>

            <!-- Row 2: Supplier (Position 3) -->
            <div class="space-y-2">
                <Label>Pilih Supplier</Label>
                <Combobox
                    items={suppliers.map((s) => ({
                        value: s.id,
                        label: s.name,
                    }))}
                    placeholder="Cari Supplier..."
                    bind:value={selectedSupplierId}
                    onSelect={onSupplierChange}
                />

                <!-- Supplier Info Card -->
                {#if selectedSupplierId}
                    {@const s = suppliers.find(
                        (x) => x.id === selectedSupplierId,
                    )}
                    <div
                        class="mt-4 border rounded-xl p-4 bg-card text-card-foreground shadow-sm flex items-start gap-4 transition-all"
                    >
                        <div
                            class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
                        >
                            <Store class="h-6 w-6 text-primary" />
                        </div>
                        <div class="flex-1 grid gap-1">
                            <div class="flex items-center justify-between">
                                <h4 class="font-semibold text-lg leading-none">
                                    {s?.name}
                                </h4>
                                <Badge
                                    variant="outline"
                                    class="font-normal text-xs text-muted-foreground"
                                >
                                    {s?.code || "SUP-" + s?.id?.slice(-4)}
                                </Badge>
                            </div>
                            <div
                                class="text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 mt-1"
                            >
                                <div class="flex items-center gap-2">
                                    <Phone class="h-3.5 w-3.5" />
                                    <span>{s?.phone || "-"}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <User class="h-3.5 w-3.5" />
                                    <span>{s?.contact || "-"}</span>
                                </div>
                                <div
                                    class="flex items-center gap-2 col-span-full"
                                >
                                    <MapPin class="h-3.5 w-3.5" />
                                    <span class="truncate"
                                        >{s?.address || "-"}</span
                                    >
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        </CardContent>
    </Card>

    <!-- Items Section -->
    <Card>
        <CardHeader class="pb-3">
            <div class="flex items-center justify-between">
                <CardTitle class="text-lg">Daftar Barang</CardTitle>
                <Button variant="outline" size="sm" onclick={addItem}>
                    <Plus class="mr-2 h-4 w-4" /> Tambah Baris
                </Button>
            </div>
        </CardHeader>
        <CardContent class="p-0">
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-muted/50 border-y">
                        <tr class="text-left">
                            <th class="p-3 font-medium w-[30%]">Produk</th>
                            <th class="p-3 font-medium w-[15%]"
                                >Varian / Kondisi</th
                            >
                            <th class="p-3 font-medium w-[10%] text-center"
                                >Qty</th
                            >
                            <th class="p-3 font-medium w-[15%]"
                                >Harga Beli (@)</th
                            >
                            <th class="p-3 font-medium w-[15%]"
                                >Harga Jual (@)</th
                            >
                            <th class="p-3 font-medium w-[15%] text-right"
                                >Subtotal</th
                            >
                            <th class="p-3 font-medium w-[5%]"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        {#each items as item, i}
                            <tr
                                class="group hover:bg-muted/20 transition-colors"
                            >
                                <td class="p-3">
                                    <select
                                        class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        value={item.productId}
                                        disabled={!selectedSupplierId}
                                        onchange={(e) =>
                                            onProductSelect(
                                                i,
                                                e.currentTarget.value,
                                            )}
                                    >
                                        <option value="">-- Produk --</option>
                                        {#each products as p}
                                            <option value={p.id}
                                                >{p.code
                                                    ? `[${p.code}] `
                                                    : ""}{p.name}</option
                                            >
                                        {/each}
                                    </select>
                                </td>
                                <td class="p-3">
                                    <Combobox
                                        bind:value={item.variant}
                                        options={supplierVariants}
                                        placeholder="Pilih varian..."
                                        allowCreate={true}
                                        disabled={!selectedSupplierId ||
                                            !item.productId}
                                    />
                                </td>
                                <td class="p-3">
                                    <Input
                                        type="number"
                                        class="h-9 text-center"
                                        min="1"
                                        bind:value={item.qty}
                                        disabled={!selectedSupplierId ||
                                            !item.productId}
                                    />
                                </td>
                                <td class="p-3">
                                    <Input
                                        type="number"
                                        class="h-9"
                                        min="0"
                                        bind:value={item.buyPrice}
                                        disabled={!selectedSupplierId ||
                                            !item.productId}
                                    />
                                </td>
                                <td class="p-3">
                                    <Input
                                        type="number"
                                        class="h-9"
                                        min="0"
                                        bind:value={item.sellPrice}
                                        placeholder="Jual"
                                        disabled={!selectedSupplierId ||
                                            !item.productId}
                                    />
                                </td>
                                <td
                                    class="p-3 text-right font-medium text-foreground/80"
                                >
                                    {formatRp(item.qty * item.buyPrice)}
                                </td>
                                <td class="p-3 text-center">
                                    {#if items.length > 1}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            class="h-8 w-8 text-muted-foreground hover:text-red-500"
                                            onclick={() => removeItem(i)}
                                        >
                                            <Trash2 class="h-4 w-4" />
                                        </Button>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                    <tfoot class="bg-muted/50 font-medium">
                        <tr>
                            <td colspan="5" class="p-4 text-right"
                                >Total Pembelian:</td
                            >
                            <td class="p-4 text-right text-lg text-primary"
                                >{formatRp(totalAmount)}</td
                            >
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </CardContent>
    </Card>

    <div class="flex justify-end gap-4">
        <Button variant="outline" href="/purchases">Batal</Button>
        <Button
            size="lg"
            onclick={handleSubmit}
            disabled={loading}
            class="w-full md:w-auto min-w-[150px]"
        >
            {#if loading}Menyimpan...{:else}<Save class="mr-2 h-4 w-4" /> Simpan
                Transaksi{/if}
        </Button>
    </div>

    <!-- Recent Purchases Section -->
    <Separator class="my-8" />

    <div class="space-y-4">
        <div class="flex items-center gap-2">
            <h3 class="text-xl font-semibold tracking-tight">
                Riwayat Input Terbaru
            </h3>
            <Badge variant="outline">Hari Ini</Badge>
        </div>

        <Card>
            <CardContent class="p-0">
                {#if recentPurchases.length === 0}
                    <div
                        class="p-8 text-center text-muted-foreground text-sm italic"
                    >
                        Belum ada input sesi ini. Transaksi yang Anda simpan
                        akan muncul di sini.
                    </div>
                {:else}
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-muted/50 border-b">
                                <tr class="text-left">
                                    <th class="p-3 font-medium">Supplier</th>
                                    <th class="p-3 font-medium">Catatan</th>
                                    <th class="p-3 font-medium text-center"
                                        >Jml Item</th
                                    >
                                    <th class="p-3 font-medium text-right"
                                        >Total</th
                                    >
                                    <th class="p-3 font-medium text-right"
                                        >Waktu</th
                                    >
                                </tr>
                            </thead>
                            <tbody class="divide-y">
                                {#each recentPurchases as p (p.id)}
                                    <tr class="hover:bg-muted/20">
                                        <td class="p-3 font-medium"
                                            >{p.supplier?.name || "Unknown"}</td
                                        >
                                        <td class="p-3 text-muted-foreground"
                                            >{p.notes || "-"}</td
                                        >
                                        <td class="p-3 text-center"
                                            >{p.items?.length || 0}</td
                                        >
                                        <td class="p-3 text-right font-mono"
                                            >{formatRp(p.totalAmount)}</td
                                        >
                                        <td
                                            class="p-3 text-right text-muted-foreground"
                                        >
                                            {new Date(
                                                p.date,
                                            ).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </CardContent>
        </Card>
    </div>
</div>
