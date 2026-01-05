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
    import { Label } from "$lib/components/ui/label";
    import { toast } from "svelte-sonner";

    // Data State (Legacy)
    let products: any[] = [];
    let open = false;
    let loading = false;
    let searchTerm = "";

    // Form State
    let newName = "";
    let newMinStock = 10;
    // Category not supported in backend yet, ignore for now

    async function loadProducts() {
        try {
            const res = await api("/inventory");
            products = res.map((p: any) => ({
                ...p,
                min: p.minStock,
                // Compute status
                status:
                    p.stock === 0
                        ? "Empty"
                        : p.stock <= p.minStock
                          ? "Critical"
                          : "Normal",
                category: "Umum", // Default for now
            }));
        } catch (e) {
            console.error(e);
        }
    }

    onMount(() => {
        loadProducts();
    });

    async function handleSubmit() {
        if (!newName) {
            toast.error("Nama produk wajib diisi");
            return;
        }

        loading = true;
        try {
            await api("/inventory", {
                method: "POST",
                body: {
                    name: newName,
                    minStock: parseInt(newMinStock.toString()) || 5,
                },
            });

            toast.success("Produk berhasil dibuat!");
            open = false;
            newName = "";
            loadProducts(); // Reload list
        } catch (e) {
            // handled in api helper
        } finally {
            loading = false;
        }
    }

    // Filter logic (Legacy)
    $: filteredProducts = products.filter(
        (p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id.toLowerCase().includes(searchTerm.toLowerCase()),
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
                    placeholder="Cari produk..."
                    class="pl-8 w-[300px]"
                    bind:value={searchTerm}
                />
            </div>
            <Button variant="outline" size="icon">
                <Filter class="h-4 w-4" />
            </Button>
        </div>

        <!-- Dialog Produk Baru -->
        <Dialog bind:open>
            <DialogTrigger class={buttonVariants({ variant: "default" })}>
                <Plus class="mr-2 h-4 w-4" /> Produk Baru
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Buat Produk Baru</DialogTitle>
                    <DialogDescription>
                        Masukkan informasi dasar produk. Stok awal akan 0.
                    </DialogDescription>
                </DialogHeader>
                <div class="grid gap-4 py-4">
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Kode</Label>
                        <Input
                            value="Auto-Generated"
                            disabled
                            class="col-span-3 bg-muted"
                        />
                    </div>
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Nama</Label>
                        <Input
                            placeholder="Nama Produk"
                            class="col-span-3"
                            bind:value={newName}
                        />
                    </div>
                    <!-- Category hidden for now as backend doesn't support it -->

                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Stok Min</Label>
                        <Input
                            type="number"
                            placeholder="10"
                            class="col-span-3"
                            bind:value={newMinStock}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onclick={handleSubmit} disabled={loading}>
                        {#if loading}Menyimpan...{:else}Simpan Produk{/if}
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
                    <TableHead class="w-[100px]">Kode</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead class="text-right">Stok</TableHead>
                    <TableHead class="text-center">Status</TableHead>
                    <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#each filteredProducts as product}
                    <TableRow>
                        <TableCell
                            class="font-medium text-xs text-muted-foreground"
                            >{product.id}</TableCell
                        >
                        <TableCell>
                            <div class="font-medium">{product.name}</div>
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
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
                                    <DropdownMenuItem>
                                        <Pencil class="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem class="text-red-600">
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
</div>
