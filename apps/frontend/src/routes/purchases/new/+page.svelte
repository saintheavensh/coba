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
        ShoppingBag,
        History,
        Package,
    } from "lucide-svelte";
    import { Badge } from "$lib/components/ui/badge";
    import { Separator } from "$lib/components/ui/separator";
    import Combobox from "$lib/components/ui/combobox.svelte";
    import DateTimePicker from "$lib/components/custom/date-time-picker.svelte";
    import CurrencyInput from "$lib/components/custom/currency-input.svelte";
    import { InventoryService } from "$lib/services/inventory.service";
    import { fade, fly } from "svelte/transition";

    let suppliers = $state<any[]>([]);
    let products = $state<any[]>([]);
    let categories = $state<any[]>([]);
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
            variantId?: string;
            variantName?: string;
            isNewVariant?: boolean;
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
                variantId: "",
                variantName: "",
                qty: 1,
                buyPrice: 0,
                sellPrice: 0,
            },
        ];
    }

    function removeItem(index: number) {
        items = items.filter((_, i) => i !== index);
    }

    // Cache prioritized variant IDs for current supplier
    let supplierPrioritizedIds = $state<string[]>([]);

    async function loadPriorities(supplierId: string) {
        if (!supplierId) return;
        try {
            const data = await InventoryService.getSupplierVariants(supplierId);
            supplierPrioritizedIds = Array.isArray(data) ? data : [];
        } catch (e) {
            console.error("Failed to load priorities", e);
            supplierPrioritizedIds = [];
        }
    }

    async function loadData() {
        try {
            const [supData, prodData, catData] = await Promise.all([
                InventoryService.getSuppliers(),
                InventoryService.getProducts(),
                InventoryService.getCategories(),
            ]);
            suppliers = supData;
            products = prodData;
            categories = catData;
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat data");
        }
    }

    async function loadRecentHistory() {
        try {
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

    async function onSupplierChange() {
        items = [
            {
                productId: "",
                productName: "",
                variantId: "",
                variantName: "",
                qty: 1,
                buyPrice: 0,
                sellPrice: 0,
            },
        ];
        if (selectedSupplierId) {
            await loadPriorities(selectedSupplierId);
        }
    }

    let productVariantsMap = $state<Record<string, any[]>>({});

    let allSearchOptions = $derived.by(() => {
        const prioritySet = new Set(supplierPrioritizedIds);
        const supplierCategoryVariants: Record<string, Set<string>> = {};

        if (selectedSupplierId) {
            for (const cat of categories) {
                const variants = cat.variantTemplates || [];
                for (const v of variants) {
                    if (v.supplierId === selectedSupplierId) {
                        if (!supplierCategoryVariants[cat.id]) {
                            supplierCategoryVariants[cat.id] = new Set();
                        }
                        supplierCategoryVariants[cat.id].add(v.name);
                    }
                }
            }
        }

        if (!selectedSupplierId) {
            return products
                .map((p) => ({
                    value: p.id,
                    label: `${p.category?.name || ""} - ${p.name}`.trim(),
                    type: "product",
                    product: p,
                    isPriority: false,
                }))
                .sort((a, b) => a.label.localeCompare(b.label));
        }

        const options: any[] = [];

        for (const p of products) {
            const categoryId = p.categoryId;
            const categoryName = p.category?.name || "";
            const allowedVariants = supplierCategoryVariants[categoryId];

            if (allowedVariants && allowedVariants.size > 0) {
                for (const variantName of allowedVariants) {
                    const matchingVariant = p.variants?.find(
                        (v: any) => v.name === variantName,
                    );

                    const value = matchingVariant
                        ? `${p.id}::${matchingVariant.id}`
                        : `${p.id}::new::${variantName}`;

                    options.push({
                        value,
                        label: `${categoryName} - ${p.name} - ${variantName}`,
                        type: "variant",
                        product: p,
                        variant: matchingVariant || { name: variantName },
                        variantName: variantName,
                        isPriority: matchingVariant
                            ? prioritySet.has(matchingVariant.id)
                            : false,
                    });
                }
            }
        }

        return options.sort((a, b) => {
            if (a.isPriority && !b.isPriority) return -1;
            if (!a.isPriority && b.isPriority) return 1;
            return a.label.localeCompare(b.label);
        });
    });

    function getSearchOptionsForRow(rowIndex: number) {
        const otherSelectedValues = new Set<string>();
        for (let i = 0; i < items.length; i++) {
            if (i === rowIndex) continue;
            const item = items[i];
            if (item.productId) {
                if (item.variantId) {
                    otherSelectedValues.add(
                        `${item.productId}::${item.variantId}`,
                    );
                } else if (item.variantName && item.isNewVariant) {
                    otherSelectedValues.add(
                        `${item.productId}::new::${item.variantName}`,
                    );
                } else {
                    otherSelectedValues.add(item.productId);
                }
            }
        }

        return allSearchOptions.filter(
            (opt: any) => !otherSelectedValues.has(opt.value),
        );
    }

    function onUnifiedSelect(index: number, selectedValue: string) {
        if (!selectedValue) return;

        const parts = selectedValue.split("::");
        const productId = parts[0];
        const isNewVariant = parts[1] === "new";
        const isExistingVariant = parts.length === 2 && !isNewVariant;

        const prod = products.find((p) => p.id === productId);
        if (!prod) return;

        items[index].productId = productId;
        items[index].productName = prod.name;

        if (isNewVariant && parts.length >= 3) {
            const variantName = parts.slice(2).join("::");
            items[index].variantId = "";
            items[index].variantName = variantName;
            items[index].isNewVariant = true;
        } else if (isExistingVariant) {
            const variantId = parts[1];
            const variant = prod.variants?.find((v: any) => v.id === variantId);
            items[index].variantId = variantId;
            items[index].variantName = variant?.name || "";
            items[index].isNewVariant = false;
            if (variant?.defaultPrice)
                items[index].sellPrice = variant.defaultPrice;
        } else {
            items[index].variantId = "";
            items[index].variantName = "";
            items[index].isNewVariant = false;
        }

        if (!items[index].sellPrice) {
            items[index].buyPrice = 0;
            items[index].sellPrice = 0;
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
                    variantId: i.variantId || undefined,
                    variant: i.variantName,
                    qty: i.qty,
                    buyPrice: i.buyPrice,
                    sellPrice: i.sellPrice,
                })),
            };

            await api("/purchases", { method: "POST", data: payload });
            toast.success("Pembelian Berhasil Disimpan!");
            goto("/purchases");
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
                variantId: "",
                variantName: "",
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

    $effect(() => {
        if (date) {
            loadRecentHistory();
        }
    });

    let selectedSupplier = $derived(
        suppliers.find((s) => s.id === selectedSupplierId),
    );
</script>

<div class="min-h-screen space-y-8 p-6 pb-20">
    <!-- Header with Gradient -->
    <div
        class="relative bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl p-8 text-white overflow-hidden shadow-2xl"
    >
        <div
            class="absolute inset-0 bg-white/10 opacity-20 pattern-dots pointer-events-none"
        ></div>
        <div
            class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
            <div>
                <Button
                    href="/purchases"
                    variant="ghost"
                    size="sm"
                    class="text-white/80 hover:text-white hover:bg-white/10 p-0 h-auto mb-2 font-normal"
                >
                    <ArrowLeft class="mr-1 h-4 w-4" /> Kembali
                </Button>
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <ShoppingBag class="h-6 w-6 text-white" />
                    </div>
                    <h1 class="text-3xl font-bold tracking-tight text-white">
                        Buat Pembelian Baru
                    </h1>
                </div>
            </div>

            <div class="flex gap-3">
                <Button
                    variant="secondary"
                    size="lg"
                    onclick={handleSubmit}
                    disabled={loading}
                    class="bg-white text-violet-600 hover:bg-violet-50 border-0 shadow-lg font-bold"
                >
                    {#if loading}
                        Menyimpan...
                    {:else}
                        <Save class="mr-2 h-4 w-4" /> Simpan Transaksi
                    {/if}
                </Button>
            </div>
        </div>
    </div>

    <!-- Main Content Grid -->
    <div in:fade={{ duration: 500 }} class="grid gap-6 lg:grid-cols-3">
        <!-- Left Column: Settings -->
        <div class="space-y-6 lg:col-span-1">
            <!-- Supplier Selection -->
            <Card
                class="bg-card/80 backdrop-blur-sm border-violet-100 dark:border-violet-900/30 shadow-md"
            >
                <CardHeader class="bg-violet-50/50 dark:bg-violet-900/10 pb-4">
                    <CardTitle
                        class="text-lg flex items-center gap-2 text-violet-700 dark:text-violet-400"
                    >
                        <Store class="h-5 w-5" /> Informasi Supplier
                    </CardTitle>
                </CardHeader>
                <CardContent class="p-6 space-y-4">
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
                            class="w-full"
                        />
                    </div>

                    {#if selectedSupplier}
                        <div
                            in:fly={{ y: 20, duration: 300 }}
                            class="rounded-xl border bg-background p-4 shadow-sm space-y-3"
                        >
                            <div class="flex items-start gap-3 border-b pb-3">
                                <div
                                    class="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-lg"
                                >
                                    {selectedSupplier.name[0]}
                                </div>
                                <div>
                                    <div class="font-bold">
                                        {selectedSupplier.name}
                                    </div>
                                    <div class="text-xs text-muted-foreground">
                                        {selectedSupplier.code || "SUP-????"}
                                    </div>
                                </div>
                            </div>
                            <div class="grid gap-2 text-sm">
                                <div
                                    class="flex items-center gap-2 text-muted-foreground"
                                >
                                    <Phone class="h-3.5 w-3.5" />
                                    {selectedSupplier.phone || "-"}
                                </div>
                                <div
                                    class="flex items-center gap-2 text-muted-foreground"
                                >
                                    <MapPin class="h-3.5 w-3.5" />
                                    <span class="truncate"
                                        >{selectedSupplier.address || "-"}</span
                                    >
                                </div>
                            </div>
                        </div>
                    {:else}
                        <div
                            class="p-6 text-center text-muted-foreground text-sm border-2 border-dashed rounded-xl bg-muted/20"
                        >
                            Pilih supplier untuk memulai input barang.
                        </div>
                    {/if}
                </CardContent>
            </Card>

            <!-- Invoice Details -->
            <Card class="bg-card/80 backdrop-blur-sm shadow-md">
                <CardHeader class="pb-4">
                    <CardTitle class="text-lg flex items-center gap-2">
                        <Package class="h-5 w-5" /> Detail Faktur
                    </CardTitle>
                </CardHeader>
                <CardContent class="p-6 space-y-4">
                    <div class="space-y-2">
                        <Label>No. Faktur / Referensi</Label>
                        <div class="flex gap-2">
                            <Input
                                bind:value={notes}
                                placeholder="Contoh: INV/2024/001"
                                class="bg-background/50"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onclick={() =>
                                    (notes = generateInvoiceNumber())}
                                title="Generate Invoice Otomatis"
                                class="shrink-0"
                            >
                                <Wand2 class="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <Label>Waktu Transaksi</Label>
                        <DateTimePicker bind:value={date} />
                    </div>
                </CardContent>
            </Card>
        </div>

        <!-- Right Column: Items -->
        <div class="lg:col-span-2 space-y-6">
            <Card
                class="bg-card/80 backdrop-blur-sm shadow-md border-t-4 border-t-violet-500"
            >
                <CardHeader
                    class="flex flex-row items-center justify-between pb-2 bg-muted/20"
                >
                    <CardTitle class="text-lg">Daftar Barang</CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onclick={addItem}
                        class="bg-background shadow-sm hover:bg-violet-50"
                    >
                        <Plus class="mr-2 h-4 w-4" /> Tambah Baris
                    </Button>
                </CardHeader>
                <CardContent class="p-0">
                    <div class="overflow-visible">
                        <table class="w-full text-sm">
                            <thead
                                class="bg-muted/50 border-y text-xs uppercase text-muted-foreground"
                            >
                                <tr class="text-left">
                                    <th class="p-4 font-semibold w-[40%]"
                                        >Produk & Varian</th
                                    >
                                    <th
                                        class="p-4 font-semibold text-center w-[12%]"
                                        >Qty</th
                                    >
                                    <th class="p-4 font-semibold w-[18%]"
                                        >Harga Beli</th
                                    >
                                    <th class="p-4 font-semibold w-[18%]"
                                        >Harga Jual</th
                                    >
                                    <th class="p-4 font-semibold w-[30px]"></th>
                                </tr>
                            </thead>
                            <tbody class="divide-y">
                                {#each items as item, i}
                                    <tr
                                        class="group hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors"
                                    >
                                        <td class="p-3 align-top">
                                            <Combobox
                                                items={getSearchOptionsForRow(
                                                    i,
                                                )}
                                                value={item.variantId
                                                    ? `${item.productId}::${item.variantId}`
                                                    : item.productId}
                                                placeholder="Cari Produk..."
                                                disabled={!selectedSupplierId}
                                                onSelect={(item) =>
                                                    onUnifiedSelect(
                                                        i,
                                                        item?.value,
                                                    )}
                                                class="w-full h-9"
                                            />
                                            {#if item.productId && !item.variantId}
                                                <div in:fade class="mt-2">
                                                    <Input
                                                        class="h-8 text-xs bg-muted/30"
                                                        placeholder="Varian Baru (Opsional)"
                                                        bind:value={
                                                            item.variantName
                                                        }
                                                    />
                                                </div>
                                            {/if}
                                        </td>
                                        <td class="p-3 align-top">
                                            <Input
                                                type="number"
                                                class="h-9 text-center"
                                                min="1"
                                                bind:value={item.qty}
                                                disabled={!selectedSupplierId ||
                                                    !item.productId}
                                            />
                                        </td>
                                        <td class="p-3 align-top">
                                            <CurrencyInput
                                                bind:value={item.buyPrice}
                                                disabled={!selectedSupplierId ||
                                                    !item.productId}
                                                class="h-9"
                                                placeholder="0"
                                            />
                                            <div
                                                class="text-[10px] text-muted-foreground mt-1 text-right"
                                            >
                                                Total: {formatRp(
                                                    item.qty * item.buyPrice,
                                                )}
                                            </div>
                                        </td>
                                        <td class="p-3 align-top">
                                            <CurrencyInput
                                                bind:value={item.sellPrice}
                                                disabled={!selectedSupplierId ||
                                                    !item.productId}
                                                class="h-9 {item.sellPrice >
                                                    0 &&
                                                item.sellPrice < item.buyPrice
                                                    ? 'border-red-500 bg-red-50'
                                                    : ''}"
                                                placeholder="0"
                                            />
                                            {#if item.buyPrice > 0 && item.sellPrice > 0}
                                                {@const margin =
                                                    ((item.sellPrice -
                                                        item.buyPrice) /
                                                        item.buyPrice) *
                                                    100}
                                                <div
                                                    class="text-[10px] mt-1 text-right font-medium {margin <
                                                    0
                                                        ? 'text-red-500'
                                                        : 'text-green-600'}"
                                                >
                                                    {margin < 0
                                                        ? "Loss"
                                                        : "Profit"}: {Math.round(
                                                        margin,
                                                    )}%
                                                </div>
                                            {/if}
                                        </td>
                                        <td class="p-3 align-top text-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                class="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                                onclick={() => removeItem(i)}
                                                disabled={items.length <= 1}
                                            >
                                                <Trash2 class="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                            <tfoot
                                class="bg-violet-50/50 dark:bg-violet-900/20"
                            >
                                <tr>
                                    <td colspan="5" class="p-4">
                                        <div
                                            class="flex justify-end items-center gap-4"
                                        >
                                            <span
                                                class="text-sm font-medium text-muted-foreground"
                                                >Total Estimasi:</span
                                            >
                                            <span
                                                class="text-xl font-bold text-violet-700 dark:text-violet-400 font-mono"
                                            >
                                                {formatRp(totalAmount)}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <!-- Recent Input History -->
            <div class="space-y-2">
                <h3
                    class="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider pl-1"
                >
                    <History class="h-4 w-4" /> Riwayat Input (Sesi Ini)
                </h3>

                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {#if recentPurchases.length === 0}
                        <div
                            class="col-span-full p-8 text-center border-2 border-dashed rounded-xl bg-muted/10 opacity-70"
                        >
                            <p class="text-sm text-muted-foreground">
                                Belum ada transaksi yang disimpan sesi ini.
                            </p>
                        </div>
                    {:else}
                        {#each recentPurchases as p}
                            <Card class="bg-card/50 backdrop-blur">
                                <CardContent class="p-4">
                                    <div
                                        class="flex justify-between items-start mb-2"
                                    >
                                        <Badge
                                            variant="outline"
                                            class="font-mono text-[10px]"
                                            >{p.notes || "-"}</Badge
                                        >
                                        <span
                                            class="text-xs text-muted-foreground"
                                        >
                                            {new Date(
                                                p.date,
                                            ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                    <div class="font-bold text-sm truncate">
                                        {p.supplier?.name}
                                    </div>
                                    <div
                                        class="flex justify-between items-end mt-2 pt-2 border-t"
                                    >
                                        <span
                                            class="text-xs text-muted-foreground"
                                            >{p.items?.length || 0} items</span
                                        >
                                        <span
                                            class="font-mono font-bold text-sm"
                                            >{formatRp(p.totalAmount)}</span
                                        >
                                    </div>
                                </CardContent>
                            </Card>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
