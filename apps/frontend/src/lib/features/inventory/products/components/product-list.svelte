<script lang="ts">
    import ProductMasterForm from "./product-master-form.svelte";
    import BulkMinStockDialog from "./bulk-min-stock-dialog.svelte";
    import SearchInput from "$lib/shared/components/custom/search-input.svelte";
    import { ProductListController } from "../controllers/product-list.controller.svelte";

    import { Button, buttonVariants } from "$lib/shared/components/ui/button";
    import { Badge } from "$lib/shared/components/ui/badge";
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
    import { Skeleton } from "$lib/shared/components/ui/skeleton";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger,
    } from "$lib/shared/components/ui/dropdown-menu";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogHeader,
        DialogTitle,
    } from "$lib/shared/components/ui/dialog";

    import {
        AlertDialog,
        AlertDialogAction,
        AlertDialogCancel,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle,
    } from "$lib/shared/components/ui/alert-dialog";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import { cn } from "$lib/shared/core/utils";

    const controller = new ProductListController();
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
                    bind:value={controller.rawSearchTerm}
                    placeholder="Search by name, code..."
                    class="w-full sm:w-[320px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 shadow-sm"
                />
            </div>
            <Select
                type="single"
                value={controller.selectedFilterCategory}
                onValueChange={(v) => (controller.selectedFilterCategory = v)}
            >
                <SelectTrigger
                    class="w-full sm:w-[200px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm"
                >
                    <span class="truncate flex items-center gap-2">
                        <Filter class="h-3.5 w-3.5 text-slate-500" />
                        {#if controller.selectedFilterCategory === "all"}
                            All Categories
                        {:else}
                            {controller.categories.find(
                                (c) =>
                                    c.id === controller.selectedFilterCategory,
                            )?.name || "Category"}
                        {/if}
                    </span>
                </SelectTrigger>
                <SelectContent class="max-h-[300px]">
                    <SelectItem value="all">All Categories</SelectItem>
                    {#each controller.categories.filter((cat) => !controller.categories.some((c) => c.parentId === cat.id)) as cat}
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
                onclick={() => (controller.bulkMinStockOpen = true)}
            >
                <Settings2 class="mr-2 h-4 w-4" /> Min. Stock
            </Button>

            <!-- Dialog Produk Baru -->
            <Button
                class="flex-1 xl:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 border-0"
                onclick={() => {
                    controller.editingProduct = null;
                    controller.open = true;
                }}
            >
                <Plus class="mr-2 h-4 w-4" /> Add Product
            </Button>
        </div>

        <ProductMasterForm
            bind:open={controller.open}
            editData={controller.editingProduct}
            onClose={() => {
                controller.editingProduct = null;
            }}
        />

        <!-- Bulk Min Stock Dialog -->
        <BulkMinStockDialog bind:open={controller.bulkMinStockOpen} />
    </div>

    <!-- Mobile List View -->
    <div class="grid gap-4 md:hidden">
        {#if controller.loading}
            {#each Array(3) as _}
                <div
                    class="border rounded-xl p-4 space-y-3 bg-white dark:bg-slate-900 shadow-sm"
                >
                    <Skeleton class="h-4 w-1/3" />
                    <Skeleton class="h-4 w-2/3" />
                    <Skeleton class="h-8 w-full" />
                </div>
            {/each}
        {:else if controller.filteredProducts.length === 0}
            <div
                class="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-slate-50/50"
            >
                No products found matching your criteria.
            </div>
        {:else}
            {#each controller.filteredProducts as product}
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
                            onclick={() => controller.handleDetail(product)}
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
                                    onclick={() =>
                                        controller.handleEdit(product)}
                                >
                                    <Pencil class="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    class="text-red-600 focus:text-red-700 focus:bg-red-50"
                                    onclick={() =>
                                        controller.confirmDelete(product.id)}
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
                            onclick={() => controller.toggleSort("code")}
                            class="h-8 -ml-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                        >
                            Code <ArrowUpDown class="ml-2 h-3 w-3" />
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button
                            variant="ghost"
                            onclick={() => controller.toggleSort("name")}
                            class="h-8 -ml-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                        >
                            Product Name <ArrowUpDown class="ml-2 h-3 w-3" />
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button
                            variant="ghost"
                            onclick={() =>
                                controller.toggleSort("categoryName")}
                            class="h-8 -ml-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                        >
                            Category <ArrowUpDown class="ml-2 h-3 w-3" />
                        </Button>
                    </TableHead>
                    <TableHead class="text-right">
                        <Button
                            variant="ghost"
                            onclick={() => controller.toggleSort("stock")}
                            class="h-8 px-0 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                        >
                            Total Stock <ArrowUpDown class="ml-2 h-3 w-3" />
                        </Button>
                    </TableHead>
                    <TableHead class="text-center">
                        <Button
                            variant="ghost"
                            onclick={() => controller.toggleSort("status")}
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
                {#if controller.loading}
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
                {:else if controller.filteredProducts.length === 0}
                    <TableRow>
                        <TableCell
                            colspan={7}
                            class="h-32 text-center text-slate-500"
                        >
                            No products found matching your search.
                        </TableCell>
                    </TableRow>
                {:else}
                    {#each controller.filteredProducts as product}
                        <TableRow
                            class="border-slate-50 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors {controller.expandedProductId ===
                            product.id
                                ? 'bg-slate-50/80 dark:bg-slate-800/50'
                                : ''}"
                        >
                            <TableCell>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="h-8 w-8 text-slate-400 hover:text-blue-600"
                                    onclick={() =>
                                        controller.toggleExpanded(product.id)}
                                >
                                    {#if controller.expandedProductId === product.id}
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
                                            onclick={() =>
                                                controller.handleEdit(product)}
                                        >
                                            <Pencil class="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            class="text-red-600 focus:text-red-700 focus:bg-red-50"
                                            onclick={() =>
                                                controller.confirmDelete(
                                                    product.id,
                                                )}
                                        >
                                            <Trash2 class="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        <!-- Expanded Row for Batches -->
                        {#if controller.expandedProductId === product.id}
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
                                                /* NOTE: This logic is tricky to port directly if using derived in component.
                                                   The controller has `batchesBySupplier` but that depends on `selectedProduct`.
                                                   Here we need it for EACH product in the loop.
                                                   So we must use a helper function or assume backend returns it structured.
                                                   Or we can just create a small helper in the component or rely on controller static method?
                                                   Wait, `batchesBySupplier` in controller uses `this.selectedProduct`.
                                                   But here we are inside an `#each` loop for products.
                                                   The original code had `filterBatchesByVariant` inside the component.
                                                   I should expose that helper on the controller or make it public.
                                                   Let's use `controller.filterBatchesByVariant` (needs to be public) 
                                                   and inline the reduce or make a helper `controller.groupBatchesBySupplier`.
                                                */
                                                controller
                                                    .filterBatchesByVariant(
                                                        product.batches || [],
                                                    )
                                                    .reduce(
                                                        (acc: any, b: any) => {
                                                            const s =
                                                                b.supplier
                                                                    ?.name ||
                                                                b.supplierName ||
                                                                "Unknown Supplier";
                                                            if (!acc[s])
                                                                acc[s] = [];
                                                            acc[s].push(b);
                                                            return acc;
                                                        },
                                                        {},
                                                    )}

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
    <Dialog bind:open={controller.detailOpen}>
        <DialogContent class="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle
                    >Detail Stok: {controller.selectedProduct
                        ?.name}</DialogTitle
                >
                <DialogDescription>
                    Total Stok: <span class="font-bold"
                        >{controller.selectedProduct?.stock}</span
                    >
                    | Kode:
                    <span class="font-mono"
                        >{controller.selectedProduct?.code || "-"}</span
                    >
                </DialogDescription>
            </DialogHeader>

            <div class="py-4 space-y-6">
                {#if controller.selectedProduct?.batches?.length}
                    {#each Object.entries(controller.batchesBySupplier) as [supplier, batches]}
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
    <AlertDialog bind:open={controller.deleteOpen}>
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
                    onclick={() => controller.handleDelete()}
                    >Ya, Hapus</AlertDialogAction
                >
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</div>
