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
    import CategorySection from "./components/category-section.svelte";
    import { Checkbox } from "$lib/components/ui/checkbox";

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
    const offset = now.getTimezoneOffset() * 60000;
    let date = $state(
        new Date(now.getTime() - offset).toISOString().slice(0, 16),
    );

    // Dynamic Sections State
    let supplierCategories = $state<any[]>([]); // Categories linked to supplier
    let selectedCategoryIds = $state<string[]>([]); // User checked categories

    // Items grouped by category: { [categoryId]: [items...] }
    let categoryItems = $state<Record<string, any[]>>({});

    // Helper to calculate total
    let totalAmount = $derived.by(() => {
        let sum = 0;
        for (const catId of selectedCategoryIds) {
            const items = categoryItems[catId] || [];
            for (const item of items) {
                sum += (item.buyPrice || 0) * (item.qty || 0);
            }
        }
        return sum;
    });

    // Cache prioritized variant IDs for current supplier
    let supplierPrioritizedIds = $state<string[]>([]);

    async function loadPriorities(supplierId: string) {
        if (!supplierId) return;
        try {
            const [variants, cats] = await Promise.all([
                InventoryService.getSupplierVariants(supplierId),
                InventoryService.getSupplierCategories(supplierId),
            ]);
            supplierPrioritizedIds = Array.isArray(variants)
                ? variants.map((v: any) => v.name)
                : [];
            supplierCategories = cats;

            // Auto-select all available categories by default? Or let user pick?
            // User sketch shows checking them manually or seeing them.
            // Let's start empty or pre-select all if reasonable?
            // "Category Filter: You check Batteries and LCDs" -> Implies manual or pre-filled.
            // Let's default to EMPTY to let user choose, or ALL?
            // Better ALL for convenience if not too many.
            // Let's leave empty and let user check.
            selectedCategoryIds = [];
            categoryItems = {};
        } catch (e) {
            console.error("Failed to load priorities or categories", e);
            supplierPrioritizedIds = [];
            supplierCategories = [];
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
        supplierCategories = [];
        selectedCategoryIds = [];
        categoryItems = {};

        if (selectedSupplierId) {
            await loadPriorities(selectedSupplierId);
        }
    }

    function toggleCategory(catId: string, checked: boolean) {
        if (checked) {
            if (!selectedCategoryIds.includes(catId)) {
                selectedCategoryIds = [...selectedCategoryIds, catId];
                if (!categoryItems[catId]) categoryItems[catId] = [];
            }
        } else {
            selectedCategoryIds = selectedCategoryIds.filter(
                (id) => id !== catId,
            );
            // Optional: clear data? Or keep it if they re-check?
            // Keeping it is safer.
        }
    }

    // Old Unified Search Logic REPLACED by Component Logic

    async function handleSubmit() {
        if (!selectedSupplierId) return toast.error("Pilih Supplier");
        try {
            // Flatten items
            const finalItems = [];
            for (const catId of selectedCategoryIds) {
                const cItems = categoryItems[catId] || [];
                for (const i of cItems) {
                    if (i.productId && i.qty > 0) {
                        finalItems.push({
                            productId: i.productId,
                            variantId: i.variantId || undefined,
                            variant: i.variantName,
                            qty: i.qty,
                            buyPrice: i.buyPrice,
                            sellPrice: i.sellPrice,
                        });
                    }
                }
            }

            if (finalItems.length === 0)
                return toast.error("Tidak ada item yang diinput");

            const payload = {
                supplierId: selectedSupplierId,
                notes,
                date,
                items: finalItems,
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
        supplierCategories = [];
        selectedCategoryIds = [];
        categoryItems = {};
        selectedSupplierId = "";
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
        // Default items not needed anymore, dynamic
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
        <!-- Right Column: Items -->
        <div class="lg:col-span-2 space-y-6">
            <!-- Phase 1: Category Selection (Appears after Supplier) -->
            {#if selectedSupplierId}
                <Card
                    class="bg-card/80 backdrop-blur-sm shadow-md border-t-4 border-t-blue-500"
                >
                    <CardHeader class="pb-3 border-b">
                        <CardTitle class="text-base">Kategori Produk</CardTitle>
                    </CardHeader>
                    <CardContent class="p-4">
                        {#if supplierCategories.length === 0}
                            <div
                                class="text-sm text-muted-foreground p-4 text-center border bg-muted/20 rounded"
                            >
                                Supplier ini belum terhubung ke kategori
                                manapun. <br />
                                <span class="text-xs"
                                    >Silakan hubungkan di menu Supplier atau
                                    pilih kategori manual :</span
                                >
                                <div
                                    class="mt-2 flex flex-wrap gap-2 justify-center"
                                >
                                    <!-- Fallback: Show ALL categories if none linked? -->
                                    {#each categories as cat}
                                        <div
                                            class="flex items-center space-x-2 border p-2 rounded bg-background"
                                        >
                                            <Checkbox
                                                id="cat-{cat.id}"
                                                checked={selectedCategoryIds.includes(
                                                    cat.id,
                                                )}
                                                onCheckedChange={(v: boolean) =>
                                                    toggleCategory(cat.id, v)}
                                            />
                                            <label
                                                for="cat-{cat.id}"
                                                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {cat.name}
                                            </label>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {:else}
                            <div
                                class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
                            >
                                {#each supplierCategories as cat}
                                    <div
                                        class="flex items-center space-x-2 border p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                                        role="button"
                                        tabindex="0"
                                        onclick={() =>
                                            toggleCategory(
                                                cat.id,
                                                !selectedCategoryIds.includes(
                                                    cat.id,
                                                ),
                                            )}
                                        onkeydown={(e) => {
                                            if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                            )
                                                toggleCategory(
                                                    cat.id,
                                                    !selectedCategoryIds.includes(
                                                        cat.id,
                                                    ),
                                                );
                                        }}
                                    >
                                        <Checkbox
                                            id="cat-{cat.id}"
                                            checked={selectedCategoryIds.includes(
                                                cat.id,
                                            )}
                                            onCheckedChange={(v: boolean) =>
                                                toggleCategory(cat.id, v)}
                                        />
                                        <label
                                            for="cat-{cat.id}"
                                            class="text-sm font-medium leading-none cursor-pointer select-none"
                                        >
                                            {cat.name}
                                        </label>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </CardContent>
                </Card>
            {/if}

            <div class="space-y-6 min-h-[300px]">
                {#if selectedCategoryIds.length === 0}
                    <div
                        class="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/10 opacity-60"
                    >
                        <div class="p-4 rounded-full bg-muted mb-4">
                            <Package class="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p class="font-medium text-lg">Area Input Barang</p>
                        <p class="text-sm text-muted-foreground">
                            Pilih Supplier & Kategori untuk memunculkan tabel
                            input.
                        </p>
                    </div>
                {:else}
                    {#each selectedCategoryIds as catId (catId)}
                        {@const cat = categories.find((c) => c.id === catId)}
                        {#if cat}
                            <div in:fade={{ duration: 300 }}>
                                <CategorySection
                                    categoryName={cat.name}
                                    categoryId={catId}
                                    {products}
                                    supplierId={selectedSupplierId}
                                    supplierPrioritizedNames={supplierPrioritizedIds}
                                    bind:items={categoryItems[catId]}
                                />
                            </div>
                        {/if}
                    {/each}

                    <div
                        class="flex justify-end items-center gap-4 py-4 px-6 bg-card rounded-xl border shadow-sm sticky bottom-4 z-10"
                    >
                        <span class="text-sm font-medium text-muted-foreground"
                            >Total Estimasi:</span
                        >
                        <span
                            class="text-3xl font-bold text-violet-700 dark:text-violet-400 font-mono"
                        >
                            {formatRp(totalAmount)}
                        </span>
                    </div>
                {/if}
            </div>

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
