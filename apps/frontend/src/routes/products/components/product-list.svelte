<script lang="ts">
    import { onMount } from "svelte";
    import ProductMasterForm from "./product-master-form.svelte";
    import BulkMinStockDialog from "./bulk-min-stock-dialog.svelte";
    import { InventoryService } from "$lib/services/inventory.service";
    import SearchInput from "$lib/components/custom/search-input.svelte";

    import { Button, buttonVariants } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import {
        Search,
        Plus,
        Filter,
        MoreHorizontal,
        Pencil,
        Trash2,
        Eye,
        ArrowUpDown,
        ChevronRight,
        ChevronDown,
        Settings2,
        Boxes,
    } from "lucide-svelte";
    import { Skeleton } from "$lib/components/ui/skeleton";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/components/ui/table";
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuLabel,
        DropdownMenuSeparator,
        DropdownMenuTrigger,
    } from "$lib/components/ui/dropdown-menu";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/components/ui/dialog";
    import { Label } from "$lib/components/ui/label";

    import { toast } from "svelte-sonner";
    import {
        AlertDialog,
        AlertDialogAction,
        AlertDialogCancel,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle,
    } from "$lib/components/ui/alert-dialog";
    import {
        createQuery,
        createMutation,
        useQueryClient,
    } from "@tanstack/svelte-query";
    import { cn } from "$lib/utils";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";

    // Search Debounce (Rune-based)
    let searchTerm = $state("");
    let debouncedSearch = $state("");
    let selectedFilterCategory = $state("all");
    let searchTimeout: any;

    $effect(() => {
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            debouncedSearch = searchTerm;
        }, 500); // 500ms debounce
    });

    // Queries (v6: options must be a function for reactivity)
    const productsQuery = createQuery(() => ({
        queryKey: ["products", debouncedSearch, selectedFilterCategory],
        queryFn: () =>
            InventoryService.getProducts(
                undefined,
                debouncedSearch,
                selectedFilterCategory,
            ),
    }));

    const categoriesQuery = createQuery(() => ({
        queryKey: ["categories"],
        queryFn: InventoryService.getCategories,
    }));

    // Mutations (v6: options function)

    const deleteProductMutation = createMutation(() => ({
        mutationFn: InventoryService.deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Produk dihapus");
            deleteOpen = false;
        },
        onError: () => toast.error("Gagal menghapus produk"),
    }));

    // Derived client helper
    const queryClient = useQueryClient();

    // Helper for query access (Using $derived)
    let products = $derived(
        (productsQuery.data || []).map((p: any) => ({
            ...p,
            categoryName: p.category?.name || "Umum",
            min: p.minStock,
            status:
                p.stock === 0
                    ? "Empty"
                    : p.stock <= (p.minStock || 5)
                      ? "Critical"
                      : "Normal",
        })),
    );

    let categories = $derived(categoriesQuery.data || []);

    // Recursive helper to flatten tree with indentation
    function buildCategoryHierarchy(
        cats: any[],
        parentId: string | null = null,
        level = 0,
    ): { id: string; name: string; level: number }[] {
        const result: { id: string; name: string; level: number }[] = [];
        const children = cats
            .filter((c) => (c.parentId || null) === parentId) // Handle undefined/null/empty string
            .sort((a, b) => a.name.localeCompare(b.name));

        for (const child of children) {
            result.push({
                id: child.id,
                name: child.name, // Original name
                level: level,
            });
            const subResult = buildCategoryHierarchy(cats, child.id, level + 1);
            result.push(...subResult);
        }
        return result;
    }

    let hierarchicalCategories = $derived(buildCategoryHierarchy(categories));

    let loading = $derived(
        productsQuery.isLoading || categoriesQuery.isLoading,
    );

    // Internal State (Runes)
    let open = $state(false);
    let detailOpen = $state(false);
    let bulkMinStockOpen = $state(false);

    // Form State (Runes)
    let editingProduct = $state<any>(null);

    // Sort State (Runes)
    type SortKey = "code" | "name" | "categoryName" | "stock" | "status";
    let sortKey = $state<SortKey>("name");
    let sortDir = $state<"asc" | "desc">("asc");

    // Detail State (Runes)
    let selectedProduct = $state<any>(null); // For Dialog Detail (optional now)
    let expandedProductId = $state<string | null>(null); // For Expandable Row

    // Delete State (Runes)
    let deleteOpen = $state(false);
    let deletingId = $state<string | null>(null);

    function toggleExpanded(id: string) {
        if (expandedProductId === id) {
            expandedProductId = null;
        } else {
            expandedProductId = id;
            // Optionally fetch detail if needed, but assuming batches are in 'products' list from controller update?
            // If the key 'getAllProducts' doesn't return batches, we might need to fetch.
            // Based on previous plan, backend GET /inventory/products SHOULD include batches.
            // If not, we trigger a fetch here.
            // Let's check products data source.
        }
    }

    function handleEdit(product: any) {
        editingProduct = product;
        open = true;
    }

    function handleDetail(product: any) {
        // Need to refetch detailed product to get batches
        // Optional: Could use a specific query here too, but simple promise is fine for momentary detail
        InventoryService.getProduct(product.id).then((detail) => {
            selectedProduct = detail;
            detailOpen = true;
        });
    }

    function confirmDelete(id: string) {
        deletingId = id;
        deleteOpen = true;
    }

    function handleDelete() {
        if (!deletingId) return;
        deleteProductMutation.mutate(deletingId);
    }

    // Helper for batches ($derived)
    // Filter batches: for same variant, show only batches with stock > 0
    // If all batches of a variant have 0 stock, show only the last one
    function filterBatchesByVariant(batches: any[]): any[] {
        if (!batches || batches.length === 0) return [];

        // Group batches by variant name
        const byVariant: Record<string, any[]> = {};
        for (const batch of batches) {
            const variantKey = batch.variant || "__no_variant__";
            if (!byVariant[variantKey]) byVariant[variantKey] = [];
            byVariant[variantKey].push(batch);
        }

        // For each variant, filter batches
        const result: any[] = [];
        for (const [variantKey, variantBatches] of Object.entries(byVariant)) {
            const withStock = variantBatches.filter(
                (b: any) => (b.currentStock || 0) > 0,
            );
            if (withStock.length > 0) {
                // Show only batches with stock
                result.push(...withStock);
            } else {
                // All have 0 stock - show only the last batch (by createdAt or id)
                const sorted = variantBatches.sort((a: any, b: any) => {
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA; // Most recent first
                });
                result.push(sorted[0]); // Take only the most recent
            }
        }

        return result;
    }

    let batchesBySupplier = $derived(
        filterBatchesByVariant(selectedProduct?.batches || []).reduce(
            (acc: Record<string, any[]>, batch: any) => {
                const sup =
                    batch.supplier?.name ||
                    batch.supplierName ||
                    "Tanpa Supplier";
                if (!acc[sup]) acc[sup] = [];
                acc[sup].push(batch);
                return acc;
            },
            {},
        ),
    );

    // Sorting ($derived) - Search/Category filtering now handled by server
    let filteredProducts = $derived(
        products.sort((a: any, b: any) => {
            const valA = a[sortKey] || "";
            const valB = b[sortKey] || "";

            if (typeof valA === "number" && typeof valB === "number") {
                return sortDir === "asc" ? valA - valB : valB - valA;
            }

            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();

            if (strA < strB) return sortDir === "asc" ? -1 : 1;
            if (strA > strB) return sortDir === "asc" ? 1 : -1;
            return 0;
        }),
    );

    function toggleSort(key: SortKey) {
        if (sortKey === key) {
            sortDir = sortDir === "asc" ? "desc" : "asc";
        } else {
            sortKey = key;
            sortDir = "asc";
        }
    }
</script>

<div class="space-y-6">
    <!-- Toolbar -->
    <div
        class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm"
    >
        <div
            class="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto"
        >
            <div class="relative w-full sm:w-auto">
                <SearchInput
                    bind:value={searchTerm}
                    placeholder="Search by name, code..."
                    class="w-full sm:w-[320px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 shadow-sm"
                />
            </div>
            <Select
                type="single"
                value={selectedFilterCategory}
                onValueChange={(v) => (selectedFilterCategory = v)}
            >
                <SelectTrigger
                    class="w-full sm:w-[200px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm"
                >
                    <span class="truncate flex items-center gap-2">
                        <Filter class="h-3.5 w-3.5 text-slate-500" />
                        {#if selectedFilterCategory === "all"}
                            All Categories
                        {:else}
                            {categories.find(
                                (c) => c.id === selectedFilterCategory,
                            )?.name || "Category"}
                        {/if}
                    </span>
                </SelectTrigger>
                <SelectContent class="max-h-[300px]">
                    <SelectItem value="all">All Categories</SelectItem>
                    {#each categories.filter((cat) => !categories.some((c) => c.parentId === cat.id)) as cat}
                        <SelectItem value={cat.id}>{cat.name}</SelectItem>
                    {/each}
                </SelectContent>
            </Select>
        </div>

        <div class="flex items-center gap-2 w-full xl:w-auto">
            <!-- Bulk Min Stock Button -->
            <Button
                variant="outline"
                class="flex-1 xl:flex-none border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 shadow-sm"
                onclick={() => (bulkMinStockOpen = true)}
            >
                <Settings2 class="mr-2 h-4 w-4" /> Min. Stock
            </Button>

            <!-- Dialog Produk Baru -->
            <Button
                class="flex-1 xl:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 border-0"
                onclick={() => {
                    editingProduct = null;
                    open = true;
                }}
            >
                <Plus class="mr-2 h-4 w-4" /> Add Product
            </Button>
        </div>

        <ProductMasterForm
            bind:open
            editData={editingProduct}
            onClose={() => {
                editingProduct = null;
            }}
        />

        <!-- Bulk Min Stock Dialog -->
        <BulkMinStockDialog bind:open={bulkMinStockOpen} />
    </div>

    <!-- Mobile List View -->
    <div class="grid gap-4 md:hidden">
        {#if loading}
            {#each Array(3) as _}
                <div
                    class="border rounded-xl p-4 space-y-3 bg-white dark:bg-slate-900 shadow-sm"
                >
                    <Skeleton class="h-4 w-1/3" />
                    <Skeleton class="h-4 w-2/3" />
                    <Skeleton class="h-8 w-full" />
                </div>
            {/each}
        {:else if filteredProducts.length === 0}
            <div
                class="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-slate-50/50"
            >
                No products found matching your criteria.
            </div>
        {:else}
            {#each filteredProducts as product}
                <div
                    class="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3"
                >
                    <div class="flex justify-between items-start">
                        <div>
                            <div
                                class="text-[10px] font-mono text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md inline-block mb-1"
                            >
                                {product.code || "-"}
                            </div>
                            <h3
                                class="font-semibold text-base leading-tight text-slate-900 dark:text-white"
                            >
                                {product.name}
                            </h3>
                        </div>
                        <div class="flex-shrink-0">
                            {#if product.status === "Normal"}
                                <Badge
                                    variant="outline"
                                    class="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30 font-medium"
                                    >In Stock</Badge
                                >
                            {:else if product.status === "Critical"}
                                <Badge
                                    variant="outline"
                                    class="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30 font-medium"
                                    >Low Stock</Badge
                                >
                            {:else}
                                <Badge
                                    variant="destructive"
                                    class="font-medium shadow-sm"
                                    >Out of Stock</Badge
                                >
                            {/if}
                        </div>
                    </div>

                    <div
                        class="flex items-center justify-between text-sm pt-2 border-t border-slate-50 dark:border-slate-800"
                    >
                        <Badge
                            variant="secondary"
                            class="font-normal text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800"
                        >
                            {product.categoryName}
                        </Badge>
                        <div class="text-right">
                            <div
                                class="text-[10px] uppercase tracking-wider text-slate-400"
                            >
                                Stock
                            </div>
                            <div
                                class="font-bold text-lg leading-none"
                                class:text-red-500={product.stock === 0}
                                class:text-yellow-600={product.status ===
                                    "Critical"}
                            >
                                {product.stock}
                            </div>
                        </div>
                    </div>

                    <div class="pt-3 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            class="h-8 text-xs flex-1 border-slate-200 dark:border-slate-800"
                            onclick={() => handleDetail(product)}
                        >
                            <Eye class="mr-1.5 h-3.5 w-3.5" /> Details
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                class={buttonVariants({
                                    variant: "ghost",
                                    size: "icon",
                                    className:
                                        "h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800",
                                })}
                            >
                                <MoreHorizontal class="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onclick={() => handleEdit(product)}
                                >
                                    <Pencil class="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    class="text-red-600 focus:text-red-700 focus:bg-red-50"
                                    onclick={() => confirmDelete(product.id)}
                                >
                                    <Trash2 class="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            {/each}
        {/if}
    </div>

    <!-- Desktop Table -->
    <div
        class="hidden md:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm"
    >
        <Table>
            <TableHeader class="bg-slate-50/50 dark:bg-slate-900/50">
                <TableRow
                    class="hover:bg-transparent border-slate-100 dark:border-slate-800"
                >
                    <TableHead class="w-[50px]"></TableHead>
                    <TableHead class="w-[120px]">
                        <Button
                            variant="ghost"
                            onclick={() => toggleSort("code")}
                            class="h-8 -ml-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                        >
                            Code <ArrowUpDown class="ml-2 h-3 w-3" />
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button
                            variant="ghost"
                            onclick={() => toggleSort("name")}
                            class="h-8 -ml-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                        >
                            Product Name <ArrowUpDown class="ml-2 h-3 w-3" />
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button
                            variant="ghost"
                            onclick={() => toggleSort("categoryName")}
                            class="h-8 -ml-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                        >
                            Category <ArrowUpDown class="ml-2 h-3 w-3" />
                        </Button>
                    </TableHead>
                    <TableHead class="text-right">
                        <Button
                            variant="ghost"
                            onclick={() => toggleSort("stock")}
                            class="h-8 px-0 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                        >
                            Total Stock <ArrowUpDown class="ml-2 h-3 w-3" />
                        </Button>
                    </TableHead>
                    <TableHead class="text-center">
                        <Button
                            variant="ghost"
                            onclick={() => toggleSort("status")}
                            class="h-8 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                        >
                            Status <ArrowUpDown class="ml-2 h-3 w-3" />
                        </Button>
                    </TableHead>
                    <TableHead
                        class="text-right text-xs font-bold uppercase tracking-wider text-slate-500"
                        >Actions</TableHead
                    >
                </TableRow>
            </TableHeader>
            <TableBody>
                {#if loading}
                    {#each Array(5) as _}
                        <TableRow class="border-slate-50 dark:border-slate-800">
                            <TableCell
                                ><Skeleton
                                    class="h-8 w-8 rounded-md"
                                /></TableCell
                            >
                            <TableCell
                                ><Skeleton class="h-4 w-[80px]" /></TableCell
                            >
                            <TableCell
                                ><Skeleton class="h-4 w-[200px]" /></TableCell
                            >
                            <TableCell
                                ><Skeleton class="h-4 w-[100px]" /></TableCell
                            >
                            <TableCell class="text-right"
                                ><Skeleton
                                    class="h-4 w-[40px] ml-auto"
                                /></TableCell
                            >
                            <TableCell class="text-center"
                                ><Skeleton
                                    class="h-6 w-[80px] rounded-full mx-auto"
                                /></TableCell
                            >
                            <TableCell class="text-right"
                                ><Skeleton class="h-8 w-8 ml-auto" /></TableCell
                            >
                        </TableRow>
                    {/each}
                {:else if filteredProducts.length === 0}
                    <TableRow>
                        <TableCell
                            colspan={7}
                            class="h-32 text-center text-slate-500"
                        >
                            No products found matching your search.
                        </TableCell>
                    </TableRow>
                {:else}
                    {#each filteredProducts as product}
                        <TableRow
                            class="border-slate-50 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors {expandedProductId ===
                            product.id
                                ? 'bg-slate-50/80 dark:bg-slate-800/50'
                                : ''}"
                        >
                            <TableCell>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="h-8 w-8 text-slate-400 hover:text-blue-600"
                                    onclick={() => toggleExpanded(product.id)}
                                >
                                    {#if expandedProductId === product.id}
                                        <ChevronDown class="h-4 w-4" />
                                    {:else}
                                        <ChevronRight class="h-4 w-4" />
                                    {/if}
                                </Button>
                            </TableCell>
                            <TableCell class="font-mono text-xs text-slate-500">
                                {product.code || "-"}
                            </TableCell>
                            <TableCell>
                                <div
                                    class="font-medium text-slate-700 dark:text-slate-200"
                                >
                                    {product.name}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant="secondary"
                                    class="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-normal hover:bg-slate-200"
                                >
                                    {product.categoryName}
                                </Badge>
                            </TableCell>
                            <TableCell class="text-right font-bold w-[120px]">
                                <span
                                    class:text-red-500={product.stock === 0}
                                    class:text-yellow-600={product.status ===
                                        "Critical"}
                                    class:text-slate-700={product.stock >
                                        (product.minStock || 5)}
                                >
                                    {product.stock}
                                </span>
                            </TableCell>
                            <TableCell class="text-center w-[120px]">
                                {#if product.status === "Normal"}
                                    <Badge
                                        variant="outline"
                                        class="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30"
                                        >In Stock</Badge
                                    >
                                {:else if product.status === "Critical"}
                                    <Badge
                                        variant="outline"
                                        class="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30"
                                        >Low Stock</Badge
                                    >
                                {:else}
                                    <Badge variant="destructive"
                                        >Out of Stock</Badge
                                    >
                                {/if}
                            </TableCell>
                            <TableCell class="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        class={buttonVariants({
                                            variant: "ghost",
                                            size: "icon",
                                            className:
                                                "h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white",
                                        })}
                                    >
                                        <MoreHorizontal class="h-4 w-4" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onclick={() => handleEdit(product)}
                                        >
                                            <Pencil class="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            class="text-red-600 focus:text-red-700 focus:bg-red-50"
                                            onclick={() =>
                                                confirmDelete(product.id)}
                                        >
                                            <Trash2 class="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        <!-- Expanded Row for Batches -->
                        {#if expandedProductId === product.id}
                            <TableRow
                                class="bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50/50"
                            >
                                <TableCell
                                    colspan={7}
                                    class="p-4 pt-0 border-b border-slate-100 dark:border-slate-800"
                                >
                                    <div
                                        class="ml-10 mt-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm animate-in fade-in zoom-in-95 duration-200"
                                    >
                                        <div
                                            class="flex items-center justify-between mb-3"
                                        >
                                            <h4
                                                class="font-semibold text-sm flex items-center gap-2 text-slate-700 dark:text-slate-300"
                                            >
                                                <Boxes class="h-4 w-4" /> Stock Batches
                                            </h4>
                                        </div>

                                        {#if !product.batches || product.batches.length === 0}
                                            <div
                                                class="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg"
                                            >
                                                No stock batches found.
                                            </div>
                                        {:else}
                                            {@const batchesBySup =
                                                filterBatchesByVariant(
                                                    product.batches || [],
                                                ).reduce((acc: any, b: any) => {
                                                    const s =
                                                        b.supplier?.name ||
                                                        b.supplierName ||
                                                        "Unknown Supplier";
                                                    if (!acc[s]) acc[s] = [];
                                                    acc[s].push(b);
                                                    return acc;
                                                }, {})}

                                            <div class="grid gap-4">
                                                {#each Object.entries(batchesBySup) as [supplier, batches]}
                                                    <div class="space-y-2">
                                                        <div
                                                            class="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"
                                                        >
                                                            <div
                                                                class="w-1.5 h-1.5 bg-blue-500 rounded-full"
                                                            ></div>
                                                            {supplier}
                                                        </div>
                                                        <div
                                                            class="rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden"
                                                        >
                                                            <Table>
                                                                <TableHeader
                                                                    class="bg-slate-50/50 dark:bg-slate-900/50"
                                                                >
                                                                    <TableRow
                                                                        class="h-7 hover:bg-transparent border-none"
                                                                    >
                                                                        <TableHead
                                                                            class="h-7 text-[10px] font-semibold text-slate-500"
                                                                            >BATCH
                                                                            ID</TableHead
                                                                        >
                                                                        <TableHead
                                                                            class="h-7 text-[10px] font-semibold text-slate-500"
                                                                            >VARIANT</TableHead
                                                                        >
                                                                        <TableHead
                                                                            class="h-7 text-[10px] font-semibold text-slate-500 text-right"
                                                                            >BUY
                                                                            PRICE</TableHead
                                                                        >
                                                                        <TableHead
                                                                            class="h-7 text-[10px] font-semibold text-slate-500 text-right"
                                                                            >SELL
                                                                            PRICE</TableHead
                                                                        >
                                                                        <TableHead
                                                                            class="h-7 text-[10px] font-semibold text-slate-500 text-right"
                                                                            >REMAINING</TableHead
                                                                        >
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {#each batches as any as batch}
                                                                        <TableRow
                                                                            class="h-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-50 dark:border-slate-800"
                                                                        >
                                                                            <TableCell
                                                                                class="py-1 font-mono text-[10px] text-slate-400"
                                                                                >{batch.id.substring(
                                                                                    0,
                                                                                    8,
                                                                                )}</TableCell
                                                                            >
                                                                            <TableCell
                                                                                class="py-1"
                                                                            >
                                                                                <Badge
                                                                                    variant="secondary"
                                                                                    class="font-normal text-[10px] h-5 px-1.5 bg-white border border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400"
                                                                                    >{batch.variant ||
                                                                                        "Standard"}</Badge
                                                                                >
                                                                            </TableCell>
                                                                            <TableCell
                                                                                class="text-right py-1 text-xs text-slate-600 dark:text-slate-400"
                                                                                >Rp
                                                                                {batch.buyPrice?.toLocaleString() ??
                                                                                    0}</TableCell
                                                                            >
                                                                            <TableCell
                                                                                class="text-right py-1 text-xs font-medium text-slate-900 dark:text-slate-200"
                                                                                >Rp
                                                                                {batch.sellPrice?.toLocaleString() ??
                                                                                    0}</TableCell
                                                                            >
                                                                            <TableCell
                                                                                class="text-right py-1 font-bold text-xs text-blue-600 dark:text-blue-400"
                                                                                >{batch.currentStock}</TableCell
                                                                            >
                                                                        </TableRow>
                                                                    {/each}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </div>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                </TableCell>
                            </TableRow>
                        {/if}
                    {/each}
                {/if}
            </TableBody>
        </Table>
    </div>

    <!-- Detail Dialog -->
    <Dialog bind:open={detailOpen}>
        <DialogContent class="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Detail Stok: {selectedProduct?.name}</DialogTitle>
                <DialogDescription>
                    Total Stok: <span class="font-bold"
                        >{selectedProduct?.stock}</span
                    >
                    | Kode:
                    <span class="font-mono">{selectedProduct?.code || "-"}</span
                    >
                </DialogDescription>
            </DialogHeader>

            <div class="py-4 space-y-6">
                {#if selectedProduct?.batches?.length}
                    {#each Object.entries(batchesBySupplier) as [supplier, batches]}
                        <div class="space-y-2">
                            <h3
                                class="font-semibold text-lg flex items-center gap-2"
                            >
                                <div
                                    class="w-1 h-6 bg-primary rounded-full"
                                ></div>
                                {supplier}
                            </h3>
                            <div class="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow class="bg-muted/50">
                                            <TableHead>Batch ID</TableHead>
                                            <TableHead>Varian</TableHead>
                                            <TableHead class="text-right"
                                                >Harga Beli</TableHead
                                            >
                                            <TableHead class="text-right"
                                                >Harga Jual</TableHead
                                            >
                                            <TableHead class="text-right"
                                                >Stok Sisa</TableHead
                                            >
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {#each batches as any as batch}
                                            <TableRow>
                                                <TableCell
                                                    class="font-mono text-xs"
                                                    >{batch.id}</TableCell
                                                >
                                                <TableCell
                                                    ><Badge variant="secondary"
                                                        >{batch.variant ||
                                                            "Standard"}</Badge
                                                    ></TableCell
                                                >
                                                <TableCell class="text-right"
                                                    >Rp {batch.buyPrice.toLocaleString()}</TableCell
                                                >
                                                <TableCell class="text-right"
                                                    >Rp {batch.sellPrice.toLocaleString()}</TableCell
                                                >
                                                <TableCell
                                                    class="text-right font-bold"
                                                    >{batch.currentStock}</TableCell
                                                >
                                            </TableRow>
                                        {/each}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    {/each}
                {:else}
                    <div
                        class="text-center text-muted-foreground py-8 border rounded-lg bg-muted/20"
                    >
                        <div class="mb-2">📦</div>
                        Belum ada stok (Batch). Lakukan<span
                            class="font-bold text-primary">Pembelian</span
                        > untuk menambah stok.
                    </div>
                {/if}
            </div>
        </DialogContent>
    </Dialog>

    <!-- Delete Alert -->
    <AlertDialog bind:open={deleteOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Hapus Master Produk?</AlertDialogTitle>
                <AlertDialogDescription>
                    Produk ini akan dihapus permanen. Stok dan riwayat akan
                    hilang.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                    class="bg-red-600 hover:bg-red-700"
                    onclick={handleDelete}>Ya, Hapus</AlertDialogAction
                >
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</div>
