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
    import Combobox from "$lib/components/ui/combobox.svelte";
    import DateTimePicker from "$lib/components/custom/date-time-picker.svelte";
    import CurrencyInput from "$lib/components/custom/currency-input.svelte";
    import { InventoryService } from "$lib/services/inventory.service";

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
            variantId?: string; // ID of the variant (if selected)
            variantName?: string; // Display name of variant (or free text for legacy/new)
            isNewVariant?: boolean; // If true, we need to create it on submit? Or maybe just handle inline?
            // For now, let's stick to: if variantId is present, it's an existing variant.
            // If variantName is present but variantId is null, it might be a free text fallback (which we want to discourage but maybe support for simplicity first, or strict mode).
            // The plan says "Unified Search".
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
        // Reset items when supplier changes because price history might depend on supplier
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

    // Unified Search Data
    // We need to fetch variants for ALL products to build the unified list.
    // Optimization: We could fetch variants on demand, but for a smooth "Unified Search" UX,
    // having them pre-calculated is better if the catalog isn't massive.
    // Or we can just fetch all variants once.
    let productVariantsMap = $state<Record<string, any[]>>({});

    // Fetch variants for a product when needed or pre-fetch all?
    // Let's modify loadData to fetch all variants or fetch on interaction.
    // For now, let's fetch ALL variants (might be heavy, but safest for "Unified Search" without complex async filter).
    // Actually, InventoryService.getAllProducts() returns products. checking if it includes variants.
    // The previous schema update added `variants: true` to findAll repo.
    // So `products` state ALREADY contains variants!

    // Let's flatten the list for the Combobox
    // Smart Filter: When supplier is selected, only show products with variants linked to that supplier
    // Base options without any selection filtering
    let allSearchOptions = $derived.by(() => {
        const prioritySet = new Set(supplierPrioritizedIds);

        // Build a map of categoryId -> variant names for the selected supplier
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

        // If no supplier selected, show all products (master only)
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

        // When supplier is selected, only show products with matching category variants
        const options: any[] = [];

        for (const p of products) {
            const categoryId = p.categoryId;
            const categoryName = p.category?.name || "";
            const allowedVariants = supplierCategoryVariants[categoryId];

            if (allowedVariants && allowedVariants.size > 0) {
                // Only show variants that belong to this supplier
                for (const variantName of allowedVariants) {
                    // Find matching product variant by name
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
            // Sort Logic: Priority First, then Alphabetical
            if (a.isPriority && !b.isPriority) return -1;
            if (!a.isPriority && b.isPriority) return 1;
            return a.label.localeCompare(b.label);
        });
    });

    // Function to get options for a specific row, excluding selections from OTHER rows
    function getSearchOptionsForRow(rowIndex: number) {
        // Build a set of values selected in OTHER rows (not this row)
        const otherSelectedValues = new Set<string>();
        for (let i = 0; i < items.length; i++) {
            if (i === rowIndex) continue; // Skip current row
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

        // Filter out items selected in other rows
        return allSearchOptions.filter(
            (opt: any) => !otherSelectedValues.has(opt.value),
        );
    }

    function onUnifiedSelect(index: number, selectedValue: string) {
        if (!selectedValue) return;

        // Check if it's a variant compound ID
        const parts = selectedValue.split("::");
        const productId = parts[0];
        const isNewVariant = parts[1] === "new"; // Format: productId::new::variantName
        const isExistingVariant = parts.length === 2 && !isNewVariant;

        const prod = products.find((p) => p.id === productId);
        if (!prod) return;

        items[index].productId = productId;
        items[index].productName = prod.name;

        if (isNewVariant && parts.length >= 3) {
            // New variant from category template that doesn't exist as product variant yet
            const variantName = parts.slice(2).join("::"); // In case variant name contains ::
            items[index].variantId = ""; // Will be created on submit
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
            // Master/Product selected (no supplier selected mode)
            items[index].variantId = "";
            items[index].variantName = "";
            items[index].isNewVariant = false;
        }

        // Reset prices if not already set
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
                    variantId: i.variantId || undefined, // Backend needs to know it's a variant
                    variant: i.variantName, // Snapshot name
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

    // Refresh history when date changes
    $effect(() => {
        if (date) {
            loadRecentHistory();
        }
    });
</script>

<div class="space-y-6 max-w-6xl mx-auto pb-12">
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
                <table class="w-full text-sm table-fixed">
                    <thead class="bg-muted/50 border-y">
                        <tr class="text-left">
                            <th class="p-3 font-medium" style="width: 35%;"
                                >Produk & Varian</th
                            >
                            <th
                                class="p-3 font-medium text-center"
                                style="width: 10%;">Qty</th
                            >
                            <th class="p-3 font-medium" style="width: 17%;"
                                >Harga Beli</th
                            >
                            <th class="p-3 font-medium" style="width: 17%;"
                                >Harga Jual</th
                            >
                            <th
                                class="p-3 font-medium text-right"
                                style="width: 15%;">Subtotal</th
                            >
                            <th
                                class="p-3 font-medium text-center"
                                style="width: 6%;"
                            ></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        {#each items as item, i}
                            <tr
                                class="group hover:bg-muted/20 transition-colors"
                            >
                                <td class="p-2 align-top">
                                    <Combobox
                                        items={getSearchOptionsForRow(i)}
                                        value={item.variantId
                                            ? `${item.productId}::${item.variantId}`
                                            : item.productId}
                                        placeholder="Cari Produk / Varian..."
                                        disabled={!selectedSupplierId}
                                        onSelect={(item) =>
                                            onUnifiedSelect(i, item?.value)}
                                        class="w-full h-9"
                                    />
                                    {#if item.productId && !item.variantId}
                                        <div class="mt-1 flex gap-2">
                                            <Input
                                                class="h-7 text-xs"
                                                placeholder="Nama Varian Manual (Opsional)"
                                                bind:value={item.variantName}
                                            />
                                        </div>
                                    {/if}
                                </td>
                                <td class="p-2 align-top">
                                    <Input
                                        type="number"
                                        class="h-9 text-center w-full"
                                        min="1"
                                        bind:value={item.qty}
                                        disabled={!selectedSupplierId ||
                                            !item.productId}
                                    />
                                </td>
                                <td class="p-2 align-top">
                                    <CurrencyInput
                                        bind:value={item.buyPrice}
                                        disabled={!selectedSupplierId ||
                                            !item.productId}
                                        class="h-9 w-full"
                                        placeholder="0"
                                    />
                                </td>
                                <td class="p-2 align-top">
                                    <CurrencyInput
                                        bind:value={item.sellPrice}
                                        disabled={!selectedSupplierId ||
                                            !item.productId}
                                        class="h-9 w-full {item.sellPrice > 0 &&
                                        item.sellPrice < item.buyPrice
                                            ? 'border-red-500 bg-red-50'
                                            : ''}"
                                        placeholder="0"
                                    />
                                    {#if item.buyPrice > 0 && item.sellPrice > 0}
                                        {@const margin =
                                            ((item.sellPrice - item.buyPrice) /
                                                item.buyPrice) *
                                            100}
                                        <div
                                            class="text-[10px] mt-1 text-right {margin <
                                            0
                                                ? 'text-red-500 font-bold'
                                                : margin < 10
                                                  ? 'text-yellow-600'
                                                  : 'text-green-600'}"
                                        >
                                            {margin < 0 ? "RUGI" : "Profit"}: {Math.round(
                                                margin,
                                            )}%
                                        </div>
                                    {/if}
                                </td>
                                <td
                                    class="p-2 align-top text-right font-medium text-foreground/80"
                                >
                                    <div
                                        class="h-9 flex items-center justify-end"
                                    >
                                        {formatRp(item.qty * item.buyPrice)}
                                    </div>
                                </td>
                                <td class="p-2 align-top text-center">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        class="h-8 w-8 text-muted-foreground hover:text-red-500 disabled:opacity-30"
                                        onclick={() => removeItem(i)}
                                        disabled={items.length <= 1}
                                    >
                                        <Trash2 class="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                    <tfoot class="bg-muted/50 font-medium">
                        <tr>
                            <td colspan="4" class="p-4 text-right"
                                >Total Pembelian:</td
                            >
                            <td
                                class="p-4 text-right text-lg text-primary font-bold"
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
