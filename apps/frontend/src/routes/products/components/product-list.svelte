<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api";
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
    import * as Select from "$lib/components/ui/select";
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

    // Data State
    let products: any[] = [];
    let categories: any[] = [];
    let open = false;
    let detailOpen = false;
    let loading = false;
    let searchTerm = "";

    // Form State
    let newName = "";
    let newCode = ""; // Universal Code
    let selectedCategory = ""; // ID
    let newMinStock = 10;
    let editingId: string | null = null;

    // Sort State
    type SortKey = "code" | "name" | "categoryName" | "stock" | "status";
    let sortKey: SortKey = "name";
    let sortDir: "asc" | "desc" = "asc";

    // Detail State
    let selectedProduct: any = null;

    // Delete State
    let deleteOpen = false;
    let deletingId: string | null = null;

    async function loadData() {
        try {
            const [prodRes, catRes] = await Promise.all([
                api("/inventory"),
                api("/categories"),
            ]);

            categories = catRes;
            products = prodRes.map((p: any) => ({
                ...p,
                status:
                    p.stock === 0
                        ? "Empty"
                        : p.stock <= p.minStock
                          ? "Critical"
                          : "Normal",
                categoryName: p.category?.name || "Uncategorized",
            }));
        } catch (e) {
            console.error(e);
        }
    }

    onMount(() => {
        loadData();
    });

    function resetForm() {
        newName = "";
        newCode = "";
        selectedCategory = "";
        newMinStock = 10;
        editingId = null;
    }

    function generateCode() {
        if (!selectedCategory) {
            toast.error("Pilih kategori terlebih dahulu untuk generate kode");
            return;
        }

        const cat = categories.find((c) => c.id === selectedCategory);
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
        open = true;
    }

    function handleDetail(product: any) {
        selectedProduct = product;
        detailOpen = true;
    }

    function confirmDelete(id: string) {
        deletingId = id;
        deleteOpen = true;
    }

    async function handleDelete() {
        if (!deletingId) return;

        try {
            await api(`/inventory/${deletingId}`, { method: "DELETE" });
            toast.success("Produk dihapus");
            loadData();
        } catch (e) {
            // handled by api helper
        } finally {
            deleteOpen = false;
            deletingId = null;
        }
    }

    async function handleSubmit() {
        if (!newName) {
            toast.error("Nama produk wajib diisi");
            return;
        }

        // Validate Category
        if (categories.length > 0 && !selectedCategory) {
            toast.error("Silahkan pilih kategori produk");
            return;
        }

        loading = true;
        try {
            const payload = {
                name: newName,
                code: newCode,
                categoryId: selectedCategory || undefined,
                minStock: parseInt(newMinStock.toString()) || 5,
            };

            if (editingId) {
                await api(`/inventory/${editingId}`, {
                    method: "PUT",
                    body: payload,
                });
                toast.success("Produk berhasil diupdate!");
            } else {
                await api("/inventory", {
                    method: "POST",
                    body: payload,
                });
                toast.success("Produk berhasil dibuat!");
            }

            open = false;
            resetForm();
            loadData();
        } catch (e) {
            // handled in api helper
        } finally {
            loading = false;
        }
    }

    $: filteredProducts = products
        .filter((p) => {
            const term = searchTerm.toLowerCase();
            const matchSearch =
                p.name.toLowerCase().includes(term) ||
                (p.code && p.code.toLowerCase().includes(term)) ||
                (p.categoryName && p.categoryName.toLowerCase().includes(term));

            return matchSearch;
        })
        .sort((a, b) => {
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
        });

    function toggleSort(key: SortKey) {
        if (sortKey === key) {
            sortDir = sortDir === "asc" ? "desc" : "asc";
        } else {
            sortKey = key;
            sortDir = "asc";
        }
    }

    $: batchesBySupplier = (selectedProduct?.batches || []).reduce(
        (acc: Record<string, any[]>, batch: any) => {
            const sup = batch.supplier || "Tanpa Supplier";
            if (!acc[sup]) acc[sup] = [];
            acc[sup].push(batch);
            return acc;
        },
        {},
    );
</script>

<div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
            <div class="relative w-full max-w-sm">
                <Search
                    class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                />
                <Input
                    type="search"
                    placeholder="Cari nama atau kode..."
                    class="pl-8 w-[300px]"
                    bind:value={searchTerm}
                />
            </div>
        </div>

        <!-- Dialog Produk Baru -->
        <Dialog bind:open onOpenChange={(isOpen) => !isOpen && resetForm()}>
            <DialogTrigger class={buttonVariants({ variant: "default" })}>
                <Plus class="mr-2 h-4 w-4" /> Produk Baru
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle
                        >{editingId
                            ? "Edit Produk"
                            : "Buat Produk Baru"}</DialogTitle
                    >
                    <DialogDescription>
                        Isi form berikut untuk {editingId
                            ? "mengubah"
                            : "menambah"} produk.
                    </DialogDescription>
                </DialogHeader>
                <div class="grid gap-4 py-4">
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Kategori</Label>
                        <div class="col-span-3">
                            {#if categories.length === 0}
                                <div
                                    class="text-sm text-muted-foreground p-2 border rounded bg-muted"
                                >
                                    Belum ada kategori. Silahkan buat di tab <strong
                                        >Kategori</strong
                                    >.
                                </div>
                            {:else}
                                <Select.Root
                                    type="single"
                                    bind:value={selectedCategory}
                                    onValueChange={() => {
                                        if (newCode === "") {
                                            // Auto-generate if empty on category change?
                                            // User requested manual + button. Let's keep button.
                                        }
                                    }}
                                >
                                    <Select.Trigger>
                                        {categories.find(
                                            (c) => c.id === selectedCategory,
                                        )?.name || "Pilih Kategori"}
                                    </Select.Trigger>
                                    <Select.Content>
                                        {#each categories as cat}
                                            <Select.Item value={cat.id}
                                                >{cat.name}</Select.Item
                                            >
                                        {/each}
                                    </Select.Content>
                                </Select.Root>
                            {/if}
                        </div>
                    </div>

                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Kode Universal</Label>
                        <div class="col-span-3 flex gap-2">
                            <Input
                                placeholder="Contoh: BAT001"
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
                            placeholder="Nama Produk"
                            class="col-span-3"
                            bind:value={newName}
                        />
                    </div>

                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Stok Min</Label>
                        <Input
                            type="number"
                            placeholder="5"
                            class="col-span-3"
                            bind:value={newMinStock}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onclick={handleSubmit} disabled={loading}>
                        {loading ? "Menyimpan..." : "Simpan Produk"}
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
                            Kode Universal <ArrowUpDown class="ml-2 h-3 w-3" />
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
                            Stok <ArrowUpDown class="ml-2 h-3 w-3" />
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
                        <TableCell class="text-right font-bold">
                            <span
                                class:text-red-500={product.stock === 0}
                                class:text-yellow-600={product.status ===
                                    "Critical"}
                            >
                                {product.stock}
                            </span>
                        </TableCell>
                        <TableCell class="text-center">
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
                                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                    <DropdownMenuItem
                                        onclick={() => handleDetail(product)}
                                    >
                                        <Eye class="mr-2 h-4 w-4" /> Detail
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onclick={() => handleEdit(product)}
                                    >
                                        <Pencil class="mr-2 h-4 w-4" /> Edit
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
            </TableBody>
        </Table>
    </div>

    <!-- Detail Dialog -->
    <!-- Detail Dialog -->
    <Dialog bind:open={detailOpen}>
        <DialogContent class="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Detail Produk: {selectedProduct?.name}</DialogTitle
                >
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
                                Supplier: {supplier}
                            </h3>
                            <div class="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow class="bg-muted/50">
                                            <TableHead>Batch ID</TableHead>
                                            <TableHead>Merk/Brand</TableHead>
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
                                                    >{batch.brand ||
                                                        "-"}</TableCell
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
                    <div class="text-center text-muted-foreground py-8">
                        Belum ada data stok/batch.
                    </div>
                {/if}
            </div>
        </DialogContent>
    </Dialog>

    <!-- Delete Alert -->
    <AlertDialog bind:open={deleteOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Apakah anda yakin?</AlertDialogTitle>
                <AlertDialogDescription>
                    Tindakan ini tidak dapat dibatalkan. Produk ini akan dihapus
                    permanen dari database.
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
