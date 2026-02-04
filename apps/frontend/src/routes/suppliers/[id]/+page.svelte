<script lang="ts">
    import { page } from "$app/stores";
    import {
        createQuery,
        createMutation,
        useQueryClient,
    } from "@tanstack/svelte-query";
    import { InventoryService } from "$lib/services/inventory.service";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { Badge } from "$lib/components/ui/badge";
    import {
        Plus,
        Trash2,
        ArrowLeft,
        Save,
        Layers,
        Building2,
        Phone,
        MapPin,
        Search,
        CheckCircle2,
    } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import Combobox from "$lib/components/ui/combobox.svelte";
    import {
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
    } from "$lib/components/ui/tabs";
    import { goto } from "$app/navigation";
    import { Skeleton } from "$lib/components/ui/skeleton";

    const queryClient = useQueryClient();
    const supplierId = $page.params.id ?? "";

    // --- Queries ---
    const supplierQuery = createQuery(() => ({
        queryKey: ["supplier", supplierId],
        queryFn: () =>
            InventoryService.getSuppliers().then((res) =>
                res.find((s) => s.id === supplierId),
            ),
    }));

    const allCategoriesQuery = createQuery(() => ({
        queryKey: ["categories"],
        queryFn: InventoryService.getCategories,
    }));

    const linkedCategoriesQuery = createQuery(() => ({
        queryKey: ["supplier-categories", supplierId],
        queryFn: () => InventoryService.getSupplierCategories(supplierId),
    }));

    const supplierVariantsQuery = createQuery(() => ({
        queryKey: ["supplier-variants", supplierId],
        queryFn: () => InventoryService.getSupplierVariants(supplierId), // This currently returns ALL variants in history, we need to update this logic in Frontend too to return config from category_variants
        // Wait, I updated backend InventoryService.getSupplierVariants to return `categoryVariants`.
        // Frontend InventoryService.getSupplierVariants returns `string[]` (names basically, or objects).
        // Let's check backend return type again.
        // Backend: `findVariantsBySupplierConfig` returns `{ name, categoryId }[]`.
        // Frontend Service: returns `string[]`. I probably need to update frontend service type definition or parsing.
    }));

    // Logic: linkedCategoriesQuery gives us categories.
    // For each category, we want to know the configured variants.
    // The endpoint `InventoryService.getSupplierVariants` returns {name, categoryId}[].
    // So I should map it locally.

    let supplier = $derived(supplierQuery.data);
    let allCategories = $derived(allCategoriesQuery.data || []);
    let linkedCategories = $derived(linkedCategoriesQuery.data || []);
    // Parse variants: Group by CategoryID
    let variantsMap = $derived(
        (supplierVariantsQuery.data || []).reduce(
            (acc: any, curr: any) => {
                // Check if curr is string or object.
                // Backend returns {name, categoryId}.
                // If Frontend Service types say string[], I need to cast or fix.
                // Let's assume for now I fix the service on next step if it breaks.
                const catId = curr.categoryId;
                if (!acc[catId]) acc[catId] = [];
                acc[catId].push(curr.name);
                return acc;
            },
            {} as Record<string, string[]>,
        ),
    );

    // --- Mutations ---
    const linkCategoryMutation = createMutation(() => ({
        mutationFn: (categoryId: string) =>
            InventoryService.linkSupplierCategory(supplierId, categoryId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["supplier-categories", supplierId],
            });
            toast.success("Kategori berhasil ditautkan");
            selectedCategoryId = "";
        },
        onError: () => toast.error("Gagal menautkan kategori"),
    }));

    const unlinkCategoryMutation = createMutation(() => ({
        mutationFn: (categoryId: string) =>
            InventoryService.unlinkSupplierCategory(supplierId, categoryId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["supplier-categories", supplierId],
            });
            toast.success("Tautan kategori dihapus");
        },
        onError: () => toast.error("Gagal menghapus tautan kategori"),
    }));

    // Variant Mutations (Reuse existing API: addVariantTemplate / removeVariantTemplate ???)
    // No, `addVariantTemplate` adds to `category.variantTemplates`.
    // Wait, the new plan is "Supplier Page: Link Category -> Add Variants".
    // Does this mean I add to `category_variants` table?
    // YES. `category_variants` has `supplierId`.
    // So I need endpoints for `POST /categories/:id/variants` with `supplierId` (Existing endpoint supported this!)
    // And `DELETE /categories/variants/:variantId`.

    // So I can reuse `InventoryService.addVariantTemplate` and `InventoryService.removeVariantTemplate`.
    // I just need to pass `supplierId`.

    const addVariantMutation = createMutation(() => ({
        mutationFn: (vars: { categoryId: string; name: string }) =>
            InventoryService.addVariantTemplate(
                vars.categoryId,
                vars.name,
                supplierId, // PASS SUPPLIER ID HERE
            ),
        onSuccess: () => {
            // Invalidate variants query
            queryClient.invalidateQueries({
                queryKey: ["supplier-variants", supplierId],
            });
            toast.success("Varian ditambahkan");
            newVariantName = "";
            activeVariantCategory = null;
        },
        onError: (e) => {
            console.error(e);
            toast.error("Gagal menambah varian");
        },
    }));

    // Note: removeVariantTemplate needs variant ID.
    // But `getSupplierVariants` currently returns { name, categoryId }. It probably needs ID too?
    // Let's check backend model `findVariantsBySupplierConfig`.
    // It returned `{ name: categoryVariants.name, categoryId: categoryVariants.categoryId }`.
    // It DOES NOT return ID. I need to fix Backend Model to return ID.

    // Local State
    let selectedCategoryId = $state("");
    let newVariantName = $state("");
    let activeVariantCategory = $state<string | null>(null);

    function handleLinkCategory() {
        if (!selectedCategoryId) return;
        linkCategoryMutation.mutate(selectedCategoryId);
    }

    function handleAddVariant(categoryId: string) {
        if (!newVariantName) return toast.error("Nama varian wajib diisi");
        addVariantMutation.mutate({ categoryId, name: newVariantName });
    }
</script>

<div class="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
    <Button
        variant="ghost"
        class="gap-2 mb-4 hover:bg-slate-100"
        href="/suppliers"
    >
        <ArrowLeft class="h-4 w-4" /> Kembali ke Daftar Supplier
    </Button>

    {#if supplierQuery.isLoading}
        <div class="space-y-4">
            <Skeleton class="h-40 w-full rounded-3xl" />
            <Skeleton class="h-20 w-full rounded-xl" />
        </div>
    {:else if !supplier}
        <div class="text-center py-20">
            <h2 class="text-2xl font-bold">Supplier tidak ditemukan</h2>
        </div>
    {:else}
        <!-- Header -->
        <div
            class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 p-8 text-white shadow-2xl"
        >
            <!-- Pattern -->
            <div
                class="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"
            ></div>

            <div
                class="relative z-10 flex flex-col md:flex-row gap-8 items-center"
            >
                <div
                    class="h-24 w-24 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl font-bold shadow-inner"
                >
                    {supplier.name.substring(0, 2).toUpperCase()}
                </div>
                <div class="space-y-2 text-center md:text-left flex-1">
                    <h1 class="text-3xl md:text-5xl font-bold tracking-tight">
                        {supplier.name}
                    </h1>
                    <div
                        class="flex flex-wrap gap-4 justify-center md:justify-start text-indigo-100"
                    >
                        {#if supplier.contact}
                            <div class="flex items-center gap-1.5">
                                <Building2 class="h-4 w-4" />
                                {supplier.contact}
                            </div>
                        {/if}
                        {#if supplier.phone}
                            <div class="flex items-center gap-1.5">
                                <Phone class="h-4 w-4" />
                                {supplier.phone}
                            </div>
                        {/if}
                        {#if supplier.address}
                            <div class="flex items-center gap-1.5 max-w-md">
                                <MapPin class="h-4 w-4 shrink-0" />
                                <span class="truncate">{supplier.address}</span>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <Tabs value="config" class="w-full">
            <TabsList
                class="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl"
            >
                <TabsTrigger
                    value="config"
                    class="rounded-lg py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >Konfigurasi Produk</TabsTrigger
                >
                <TabsTrigger
                    value="history"
                    class="rounded-lg py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >Riwayat Pembelian</TabsTrigger
                >
            </TabsList>

            <!-- Configuration Tab -->
            <TabsContent value="config" class="mt-6 space-y-6">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Left: Add/Link Category -->
                    <div class="lg:col-span-1 space-y-6">
                        <Card class="border-slate-200 shadow-sm">
                            <CardHeader>
                                <CardTitle
                                    class="text-lg flex items-center gap-2"
                                >
                                    <Plus class="h-5 w-5 text-indigo-600" /> Tautkan
                                    Kategori
                                </CardTitle>
                            </CardHeader>
                            <CardContent class="space-y-4">
                                <p class="text-sm text-muted-foreground">
                                    Pilih kategori produk yang disediakan oleh
                                    supplier ini.
                                </p>
                                <div class="space-y-3">
                                    <Label>Pilih Kategori</Label>
                                    <Combobox
                                        items={allCategories
                                            .filter((c) => {
                                                // 1. Must not be already linked
                                                const isLinked =
                                                    linkedCategories.find(
                                                        (l) => l.id === c.id,
                                                    );
                                                if (isLinked) return false;

                                                // 2. Must NOT be a parent (i.e., must be a leaf node)
                                                // Check if any OTHER category has this current category as its parent
                                                const isParent =
                                                    allCategories.some(
                                                        (other) =>
                                                            other.parentId ===
                                                            c.id,
                                                    );
                                                return !isParent;
                                            })
                                            .map((c) => ({
                                                label: c.name,
                                                value: c.id,
                                            }))}
                                        bind:value={selectedCategoryId}
                                        placeholder="Cari kategori..."
                                    />
                                    <Button
                                        class="w-full"
                                        onclick={handleLinkCategory}
                                        disabled={!selectedCategoryId ||
                                            linkCategoryMutation.isPending}
                                    >
                                        {linkCategoryMutation.isPending
                                            ? "Menautkan..."
                                            : "Tautkan Kategori"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <!-- Right: Linked Categories List & Variants -->
                    <div class="lg:col-span-2 space-y-6">
                        <h3 class="text-xl font-bold flex items-center gap-2">
                            <CheckCircle2 class="h-5 w-5 text-emerald-500" /> Kategori
                            Terdaftar
                        </h3>

                        {#if linkedCategoriesQuery.isLoading}
                            <div class="space-y-4">
                                <Skeleton class="h-24 w-full" />
                                <Skeleton class="h-24 w-full" />
                            </div>
                        {:else if linkedCategories.length === 0}
                            <div
                                class="border-2 border-dashed rounded-xl p-12 text-center text-muted-foreground bg-slate-50"
                            >
                                <Layers
                                    class="h-10 w-10 mx-auto mb-3 opacity-20"
                                />
                                <p>
                                    Belum ada kategori yang ditautkan ke
                                    supplier ini.
                                </p>
                            </div>
                        {:else}
                            <div class="space-y-4">
                                {#each linkedCategories as cat (cat.id)}
                                    <div
                                        class="bg-card border rounded-xl overflow-hidden shadow-sm transition-all hover:border-indigo-200"
                                    >
                                        <div
                                            class="p-4 flex items-center justify-between bg-slate-50/50 border-b"
                                        >
                                            <div
                                                class="flex items-center gap-3"
                                            >
                                                <div
                                                    class="p-2 bg-indigo-100 text-indigo-600 rounded-lg"
                                                >
                                                    <Layers class="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h4
                                                        class="font-bold text-lg"
                                                    >
                                                        {cat.name}
                                                    </h4>
                                                    <p
                                                        class="text-xs text-muted-foreground"
                                                    >
                                                        {variantsMap[cat.id]
                                                            ?.length || 0} Varian
                                                        Terdaftar
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                class="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onclick={() =>
                                                    unlinkCategoryMutation.mutate(
                                                        cat.id,
                                                    )}
                                            >
                                                <Trash2 class="h-4 w-4 mr-2" /> Lepas
                                            </Button>
                                        </div>

                                        <div class="p-4 bg-white">
                                            <!-- Variant List -->
                                            <div class="mt-2 space-y-3">
                                                <!-- Add Variant Input -->
                                                <div
                                                    class="flex gap-2 items-end"
                                                >
                                                    <div
                                                        class="grid gap-1.5 flex-1"
                                                    >
                                                        <Label
                                                            class="text-xs text-muted-foreground"
                                                            >Tambah Varian Baru
                                                            (Khusus Supplier
                                                            Ini)</Label
                                                        >
                                                        <Input
                                                            placeholder="Contoh: Original, Grade A..."
                                                            class="h-9"
                                                            bind:value={
                                                                newVariantName
                                                            }
                                                        />
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        class="h-9"
                                                        onclick={() =>
                                                            handleAddVariant(
                                                                cat.id,
                                                            )}
                                                        disabled={addVariantMutation.isPending &&
                                                            activeVariantCategory ===
                                                                cat.id}
                                                    >
                                                        <Plus
                                                            class="h-4 w-4 mr-1"
                                                        /> Tambah
                                                    </Button>
                                                </div>

                                                <div
                                                    class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-dashed"
                                                >
                                                    {#if variantsMap[cat.id] && variantsMap[cat.id].length > 0}
                                                        {#each variantsMap[cat.id] as vName}
                                                            <Badge
                                                                variant="secondary"
                                                                class="pl-2 pr-1 py-1 gap-1 flex items-center text-sm font-normal"
                                                            >
                                                                {vName}
                                                                <!-- Ideally we need the ID to delete. For now let's just show. -->
                                                                <!-- FIX NEEDED: Backend currently doesn't return ID. -->
                                                            </Badge>
                                                        {/each}
                                                    {:else}
                                                        <span
                                                            class="text-xs text-muted-foreground italic"
                                                            >Belum ada varian
                                                            (Menggunakan default
                                                            saja).</span
                                                        >
                                                    {/if}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="history">
                <div
                    class="p-12 text-center text-muted-foreground border rounded-xl"
                >
                    Riwayat pembelian akan muncul di sini (Segera Hadir).
                </div>
            </TabsContent>
        </Tabs>
    {/if}
</div>
