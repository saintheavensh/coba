<script lang="ts">
    import { onMount } from "svelte";
    import { InventoryService } from "$lib/services/inventory.service";
    import SearchInput from "$lib/components/custom/search-input.svelte";
    import ImageUpload from "$lib/components/custom/image-upload.svelte";
    import { Input } from "$lib/components/ui/input";
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
        DialogTrigger,
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

    // Queries (v6: options must be a function for reactivity)
    const productsQuery = createQuery(() => ({
        queryKey: ["products"],
        queryFn: InventoryService.getProducts,
    }));

    const categoriesQuery = createQuery(() => ({
        queryKey: ["categories"],
        queryFn: InventoryService.getCategories,
    }));

    // Mutations (v6: options function)
    const createProductMutation = createMutation(() => ({
        mutationFn: InventoryService.createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Produk berhasil dibuat! Stok awal 0.");
            open = false;
            resetForm();
        },
        onError: () => toast.error("Gagal menyimpan produk"),
    }));

    const updateProductMutation = createMutation(() => ({
        mutationFn: (vars: { id: string; data: any }) =>
            InventoryService.updateProduct(vars.id, vars.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Produk berhasil diupdate!");
            open = false;
            resetForm();
        },
        onError: () => toast.error("Gagal update produk"),
    }));

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
    let loading = $derived(
        productsQuery.isLoading || categoriesQuery.isLoading,
    );

    // Internal State (Runes)
    let open = $state(false);
    let detailOpen = $state(false);
    let searchTerm = $state("");

    // Form State (Runes)
    let newName = $state("");
    let newCode = $state(""); // Universal Code
    let selectedCategory = $state(""); // ID
    let newMinStock = $state(5);
    let editingId = $state<string | null>(null);
    let newImage = $state("");

    // Sort State (Runes)
    type SortKey = "code" | "name" | "categoryName" | "stock" | "status";
    let sortKey = $state<SortKey>("name");
    let sortDir = $state<"asc" | "desc">("asc");

    // Detail State (Runes)
    let selectedProduct = $state<any>(null);

    // Delete State (Runes)
    let deleteOpen = $state(false);
    let deletingId = $state<string | null>(null);

    function resetForm() {
        newName = "";
        newCode = "";
        selectedCategory = "";
        newMinStock = 5;
        newImage = "";
        editingId = null;
    }

    function generateCode() {
        if (!selectedCategory) {
            toast.error("Pilih kategori terlebih dahulu untuk generate kode");
            return;
        }

        const cat = categories.find((c: any) => c.id === selectedCategory);
        const prefix = cat ? cat.name.substring(0, 3).toUpperCase() : "GEN";
        const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
        newCode = `${prefix}${random}`;
    }

    function handleEdit(product: any) {
        editingId = product.id;
        newName = product.name;
        newCode = product.code || "";
        selectedCategory = product.categoryId || "";
        newMinStock = product.minStock || 5;
        newImage = product.image || "";
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

    function handleSubmit() {
        if (!newName) {
            toast.error("Nama produk wajib diisi");
            return;
        }

        const payload = {
            name: newName,
            code: newCode || undefined,
            categoryId: selectedCategory || undefined,
            minStock: parseInt(newMinStock.toString()) || 5,
            image: newImage || undefined,
        };

        if (editingId) {
            updateProductMutation.mutate({ id: editingId, data: payload });
        } else {
            createProductMutation.mutate(payload);
        }
    }

    // Helper for batches ($derived)
    let batchesBySupplier = $derived(
        (selectedProduct?.batches || []).reduce(
            (acc: Record<string, any[]>, batch: any) => {
                const sup = batch.supplierName || "Tanpa Supplier";
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

                return matchSearch;
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
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
            <SearchInput
                bind:value={searchTerm}
                placeholder="Cari nama atau kode..."
                class="w-[300px]"
            />
        </div>

        <!-- Dialog Produk Baru -->
        <Dialog
            bind:open
            onOpenChange={(isOpen) => {
                if (!isOpen) resetForm();
                else
                    queryClient.invalidateQueries({ queryKey: ["categories"] });
            }}
        >
            <DialogTrigger class={buttonVariants({ variant: "default" })}>
                <Plus class="mr-2 h-4 w-4" /> Produk Master Baru
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle
                        >{editingId
                            ? "Edit Master Produk"
                            : "Buat Master Produk Baru"}</DialogTitle
                    >
                    <DialogDescription>
                        Buat template produk. Stok masuk dilakukan melalui menu <b
                            >Pembelian</b
                        >.
                    </DialogDescription>
                </DialogHeader>
                <div class="grid gap-4 py-4">
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Kategori</Label>
                        <div class="col-span-3">
                            {#if categoriesQuery.isLoading}
                                <div
                                    class="flex items-center space-x-2 text-sm text-muted-foreground p-2 border rounded bg-muted"
                                >
                                    <div
                                        class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
                                    ></div>
                                    <span>Memuat kategori...</span>
                                </div>
                            {:else if categories.length === 0}
                                <div
                                    class="text-sm text-muted-foreground p-2 border rounded bg-muted"
                                >
                                    Belum ada kategori.
                                </div>
                            {:else}
                                <select
                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    bind:value={selectedCategory}
                                >
                                    <option value=""
                                        >-- Pilih Kategori --</option
                                    >
                                    {#each categories as cat}
                                        <option value={cat.id}
                                            >{cat.name}</option
                                        >
                                    {/each}
                                </select>
                            {/if}
                        </div>
                    </div>

                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Kode Universal</Label>
                        <div class="col-span-3 flex gap-2">
                            <Input
                                placeholder="Scan Barcode / SKU"
                                bind:value={newCode}
                            />
                            <Button
                                variant="outline"
                                onclick={generateCode}
                                title="Generate Otomatis"
                            >
                                <Filter class="h-4 w-4 mr-2" /> Auto
                            </Button>
                        </div>
                    </div>

                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Nama</Label>
                        <Input
                            placeholder="Nama Produk (Mis: LCD Samsung)"
                            class="col-span-3"
                            bind:value={newName}
                        />
                    </div>

                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Min Stock Alert</Label>
                        <Input
                            type="number"
                            placeholder="5"
                            class="col-span-3"
                            bind:value={newMinStock}
                        />
                    </div>

                    <div class="grid grid-cols-4 items-start gap-4">
                        <Label class="text-right pt-2">Foto Produk</Label>
                        <div class="col-span-3">
                            <ImageUpload
                                bind:value={newImage}
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onclick={handleSubmit} disabled={loading}>
                        {loading ? "Menyimpan..." : "Simpan Master Produk"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>

    <!-- Table -->
    <div class="rounded-md border bg-card">
        <Table>
            <TableHeader>
                <TableRow>
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
                        <TableCell colspan={6} class="h-24 text-center">
                            Tidak ada produk ditemukan.
                        </TableCell>
                    </TableRow>
                {:else}
                    {#each filteredProducts as product}
                        <TableRow>
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
                                        <DropdownMenuLabel
                                            >Aksi</DropdownMenuLabel
                                        >
                                        <DropdownMenuItem
                                            onclick={() =>
                                                handleDetail(product)}
                                        >
                                            <Eye class="mr-2 h-4 w-4" /> Lihat Batch
                                        </DropdownMenuItem>
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
                            <div class="rounded-md border">
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
