<script lang="ts">
    import { onMount } from "svelte";
    import ProductMasterForm from "./product-master-form.svelte";
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

    // Queries (v6: options must be a function for reactivity)
    const productsQuery = createQuery(() => ({
        queryKey: ["products"],
        queryFn: () => InventoryService.getProducts(),
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
    let searchTerm = $state("");

    // Form State (Runes)
    let editingProduct = $state<any>(null);

    // Filter State (Runes)
    let selectedFilterCategory = $state("all");

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

    // Filtering & Sorting (Reactive)
    // Filtering & Sorting ($derived)
    let filteredProducts = $derived(
        products
            .filter((p: any) => {
                const term = searchTerm.toLowerCase();
                const matchSearch =
                    p.name.toLowerCase().includes(term) ||
                    (p.code && p.code.toLowerCase().includes(term)) ||
                    (p.categoryName &&
                        p.categoryName.toLowerCase().includes(term));

                const matchCategory =
                    selectedFilterCategory === "all" ||
                    p.categoryId === selectedFilterCategory;

                return matchSearch && matchCategory;
            })
            .sort((a: any, b: any) => {
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

<div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-row items-center gap-2 w-full md:w-auto">
        <SearchInput
            bind:value={searchTerm}
            placeholder="Cari..."
            class="flex-1 w-auto md:w-[300px]"
        />
        <Select
            type="single"
            value={selectedFilterCategory}
            onValueChange={(v) => (selectedFilterCategory = v)}
        >
            <SelectTrigger class="w-[140px] md:w-[200px]">
                <span class="truncate">
                    {#if selectedFilterCategory === "all"}
                        Kategori
                    {:else}
                        {categories.find((c) => c.id === selectedFilterCategory)
                            ?.name || "Kategori"}
                    {/if}
                </span>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {#each categories as cat}
                    <SelectItem value={cat.id}>{cat.name}</SelectItem>
                {/each}
            </SelectContent>
        </Select>
    </div>

    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
        <div>
            <!-- Spacer to maintain layout structure if needed, or remove completely if not needed -->
        </div>

        <!-- Dialog Produk Baru -->
        <Button
            onclick={() => {
                editingProduct = null;
                open = true;
            }}
        >
            <Plus class="mr-2 h-4 w-4" /> Produk Master Baru
        </Button>

        <ProductMasterForm
            bind:open
            editData={editingProduct}
            onClose={() => {
                editingProduct = null;
            }}
        />
    </div>

    <!-- Mobile List View -->
    <div class="grid gap-4 md:hidden">
        {#if loading}
            {#each Array(3) as _}
                <div class="border rounded-lg p-4 space-y-3">
                    <Skeleton class="h-4 w-1/3" />
                    <Skeleton class="h-4 w-2/3" />
                    <Skeleton class="h-8 w-full" />
                </div>
            {/each}
        {:else if filteredProducts.length === 0}
            <div
                class="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20"
            >
                Tidak ada produk ditemukan.
            </div>
        {:else}
            {#each filteredProducts as product}
                <div class="bg-card border rounded-lg p-4 shadow-sm space-y-3">
                    <div class="flex justify-between items-start">
                        <div>
                            <div
                                class="text-[10px] font-mono text-muted-foreground uppercase tracking-wider"
                            >
                                {product.code || "-"}
                            </div>
                            <h3
                                class="font-semibold text-base leading-tight mt-0.5"
                            >
                                {product.name}
                            </h3>
                        </div>
                        <div class="flex-shrink-0">
                            {#if product.status === "Normal"}
                                <Badge
                                    variant="outline"
                                    class="bg-green-50 text-green-700 border-green-200 text-[10px] px-1.5 h-5"
                                    >Aman</Badge
                                >
                            {:else if product.status === "Critical"}
                                <Badge
                                    variant="outline"
                                    class="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px] px-1.5 h-5"
                                    >Menipis</Badge
                                >
                            {:else}
                                <Badge
                                    variant="destructive"
                                    class="text-[10px] px-1.5 h-5">Habis</Badge
                                >
                            {/if}
                        </div>
                    </div>

                    <div class="flex items-center justify-between text-sm pt-1">
                        <Badge
                            variant="secondary"
                            class="font-normal text-muted-foreground bg-muted/50"
                        >
                            {product.categoryName}
                        </Badge>
                        <div class="text-right">
                            <div class="text-xs text-muted-foreground">
                                Stok
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

                    <div class="pt-3 border-t flex justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            class="h-8 text-xs flex-1"
                            onclick={() => handleDetail(product)}
                        >
                            <Eye class="mr-1.5 h-3.5 w-3.5" /> Detail
                        </Button>
                        <!-- Action Menu Trigger -->
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                class={buttonVariants({
                                    variant: "ghost",
                                    size: "icon",
                                    className: "h-8 w-8",
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
                                <DropdownMenuItem
                                    class="text-red-600"
                                    onclick={() => confirmDelete(product.id)}
                                >
                                    <Trash2 class="mr-2 h-4 w-4" /> Hapus
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            {/each}
        {/if}
    </div>

    <!-- Desktop Table -->
    <div class="hidden md:block rounded-md border bg-card">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead class="w-[50px]"></TableHead>
                    <!-- Expand Toggle -->
                    <TableHead class="w-[100px]">
                        <Button
                            variant="ghost"
                            onclick={() => toggleSort("code")}
                            class="h-8 -ml-3"
                        >
                            Kode <ArrowUpDown class="ml-2 h-3 w-3" />
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button
                            variant="ghost"
                            onclick={() => toggleSort("name")}
                            class="h-8 -ml-3"
                        >
                            Nama Produk <ArrowUpDown class="ml-2 h-3 w-3" />
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button
                            variant="ghost"
                            onclick={() => toggleSort("categoryName")}
                            class="h-8 -ml-3"
                        >
                            Kategori <ArrowUpDown class="ml-2 h-3 w-3" />
                        </Button>
                    </TableHead>
                    <TableHead class="text-right">
                        <Button
                            variant="ghost"
                            onclick={() => toggleSort("stock")}
                            class="h-8 px-0"
                        >
                            Stok Aggregat <ArrowUpDown class="ml-2 h-3 w-3" />
                        </Button>
                    </TableHead>
                    <TableHead class="text-center">
                        <Button
                            variant="ghost"
                            onclick={() => toggleSort("status")}
                            class="h-8"
                        >
                            Status <ArrowUpDown class="ml-2 h-3 w-3" />
                        </Button>
                    </TableHead>
                    <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#if loading}
                    {#each Array(5) as _}
                        <TableRow>
                            <TableCell><Skeleton class="h-8 w-8" /></TableCell>
                            <TableCell
                                ><Skeleton class="h-4 w-[100px]" /></TableCell
                            >
                            <TableCell
                                ><Skeleton class="h-4 w-[250px]" /></TableCell
                            >
                            <TableCell
                                ><Skeleton class="h-4 w-[100px]" /></TableCell
                            >
                            <TableCell class="text-right"
                                ><Skeleton
                                    class="h-4 w-[50px] ml-auto"
                                /></TableCell
                            >
                            <TableCell class="text-center"
                                ><Skeleton
                                    class="h-4 w-[80px] mx-auto"
                                /></TableCell
                            >
                            <TableCell class="text-right"
                                ><Skeleton class="h-8 w-8 ml-auto" /></TableCell
                            >
                        </TableRow>
                    {/each}
                {:else if filteredProducts.length === 0}
                    <TableRow>
                        <TableCell colspan={7} class="h-24 text-center">
                            Tidak ada produk ditemukan.
                        </TableCell>
                    </TableRow>
                {:else}
                    {#each filteredProducts as product}
                        <TableRow
                            class={expandedProductId === product.id
                                ? "bg-muted/50 border-b-0"
                                : ""}
                        >
                            <TableCell>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="h-8 w-8"
                                    onclick={() => toggleExpanded(product.id)}
                                >
                                    {#if expandedProductId === product.id}
                                        <ChevronDown class="h-4 w-4" />
                                    {:else}
                                        <ChevronRight class="h-4 w-4" />
                                    {/if}
                                </Button>
                            </TableCell>
                            <TableCell
                                class="font-medium text-xs text-muted-foreground"
                            >
                                {product.code || "-"}
                            </TableCell>
                            <TableCell
                                ><div class="font-medium">
                                    {product.name}
                                </div></TableCell
                            >
                            <TableCell>{product.categoryName}</TableCell>
                            <TableCell class="text-right font-bold w-[120px]">
                                <span
                                    class:text-red-500={product.stock === 0}
                                    class:text-yellow-600={product.status ===
                                        "Critical"}
                                >
                                    {product.stock}
                                </span>
                            </TableCell>
                            <TableCell class="text-center w-[120px]">
                                {#if product.status === "Normal"}
                                    <Badge
                                        variant="outline"
                                        class="bg-green-50 text-green-700 border-green-200"
                                        >Aman</Badge
                                    >
                                {:else if product.status === "Critical"}
                                    <Badge
                                        variant="outline"
                                        class="bg-yellow-50 text-yellow-700 border-yellow-200"
                                        >Menipis</Badge
                                    >
                                {:else}
                                    <Badge variant="destructive">Habis</Badge>
                                {/if}
                            </TableCell>
                            <TableCell class="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        class={buttonVariants({
                                            variant: "ghost",
                                            size: "icon",
                                            className: "h-8 w-8",
                                        })}
                                    >
                                        <MoreHorizontal class="h-4 w-4" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onclick={() => handleEdit(product)}
                                        >
                                            <Pencil class="mr-2 h-4 w-4" /> Edit
                                            Master
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            class="text-red-600"
                                            onclick={() =>
                                                confirmDelete(product.id)}
                                        >
                                            <Trash2 class="mr-2 h-4 w-4" /> Hapus
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        <!-- Expanded Row for Batches -->
                        {#if expandedProductId === product.id}
                            <TableRow class="hover:bg-muted/50 bg-muted/50">
                                <TableCell colspan={7} class="p-4 pt-0">
                                    <div
                                        class="bg-card border rounded-lg p-4 shadow-inner space-y-4 animate-in slide-in-from-top-2"
                                    >
                                        <div
                                            class="flex items-center justify-between"
                                        >
                                            <h4
                                                class="font-semibold text-sm flex items-center gap-2"
                                            >
                                                📦 Stok & Varian (Batch)
                                            </h4>
                                            <!-- Optional: Add Batch Action if permitted, but user said remove it -->
                                        </div>

                                        {#if !product.batches || product.batches.length === 0}
                                            <div
                                                class="text-center py-4 text-muted-foreground text-sm border-2 border-dashed rounded"
                                            >
                                                Belum ada stok. Lakukan
                                                Pembelian untuk menambah stok.
                                            </div>
                                        {:else}
                                            <!-- Group by Supplier logic inline or use helper -->
                                            {@const batchesBySup =
                                                filterBatchesByVariant(
                                                    product.batches || [],
                                                ).reduce((acc: any, b: any) => {
                                                    const s =
                                                        b.supplier?.name ||
                                                        b.supplierName ||
                                                        "Tanpa Supplier";
                                                    if (!acc[s]) acc[s] = [];
                                                    acc[s].push(b);
                                                    return acc;
                                                }, {})}

                                            <div class="grid gap-4">
                                                {#each Object.entries(batchesBySup) as [supplier, batches]}
                                                    <div class="space-y-2">
                                                        <div
                                                            class="text-xs font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-wider"
                                                        >
                                                            <div
                                                                class="w-1 h-3 bg-primary/50 rounded-full"
                                                            ></div>
                                                            {supplier}
                                                        </div>
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow
                                                                    class="h-8 hover:bg-transparent"
                                                                >
                                                                    <TableHead
                                                                        class="h-8 text-xs font-medium text-muted-foreground"
                                                                        >ID</TableHead
                                                                    >
                                                                    <TableHead
                                                                        class="h-8 text-xs font-medium text-muted-foreground"
                                                                        >Varian</TableHead
                                                                    >
                                                                    <TableHead
                                                                        class="h-8 text-xs font-medium text-muted-foreground text-right"
                                                                        >Beli</TableHead
                                                                    >
                                                                    <TableHead
                                                                        class="h-8 text-xs font-medium text-muted-foreground text-right"
                                                                        >Jual</TableHead
                                                                    >
                                                                    <TableHead
                                                                        class="h-8 text-xs font-medium text-muted-foreground text-right"
                                                                        >Sisa</TableHead
                                                                    >
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {#each batches as any as batch}
                                                                    <TableRow
                                                                        class="h-9"
                                                                    >
                                                                        <TableCell
                                                                            class="py-1 font-mono text-[10px] text-muted-foreground"
                                                                            >{batch.id.substring(
                                                                                0,
                                                                                8,
                                                                            )}...</TableCell
                                                                        >
                                                                        <TableCell
                                                                            class="py-1"
                                                                        >
                                                                            <Badge
                                                                                variant="secondary"
                                                                                class="font-normal text-xs"
                                                                                >{batch.variant ||
                                                                                    "Standard"}</Badge
                                                                            >
                                                                        </TableCell>
                                                                        <TableCell
                                                                            class="text-right py-1 text-xs"
                                                                            >Rp {batch.buyPrice?.toLocaleString() ??
                                                                                0}</TableCell
                                                                        >
                                                                        <TableCell
                                                                            class="text-right py-1 text-xs font-medium"
                                                                            >Rp {batch.sellPrice?.toLocaleString() ??
                                                                                0}</TableCell
                                                                        >
                                                                        <TableCell
                                                                            class="text-right py-1 font-bold text-xs"
                                                                            >{batch.currentStock}</TableCell
                                                                        >
                                                                    </TableRow>
                                                                {/each}
                                                            </TableBody>
                                                        </Table>
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
