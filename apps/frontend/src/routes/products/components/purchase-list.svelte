<script lang="ts">
    import { onMount } from "svelte";
    import { Input } from "$lib/components/ui/input";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import { Plus, Download, Eye, Calendar, Trash2 } from "lucide-svelte";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/components/ui/table";
    import { Badge } from "$lib/components/ui/badge";
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
        createQuery,
        createMutation,
        useQueryClient,
    } from "@tanstack/svelte-query";
    import { PurchaseService } from "$lib/services/purchase.service";
    import { InventoryService } from "$lib/services/inventory.service";

    // State (Runes)
    let open = $state(false);
    let selectedSupplier = $state("");
    let notes = $state("");

    type PurchaseItemRow = {
        productId: string;
        variant: string;
        qty: number;
        buyPrice: number;
        sellPrice: number;
        productName?: string;
    };

    let items = $state<PurchaseItemRow[]>([]);

    // Queries
    const purchasesQuery = createQuery(() => ({
        queryKey: ["purchases"],
        queryFn: PurchaseService.getAll,
    }));

    const suppliersQuery = createQuery(() => ({
        queryKey: ["suppliers"],
        queryFn: InventoryService.getSuppliers,
    }));

    const productsQuery = createQuery(() => ({
        queryKey: ["products"],
        queryFn: InventoryService.getProducts,
    }));

    // Derived Data
    let purchases = $derived(purchasesQuery.data || []);
    let suppliers = $derived(suppliersQuery.data || []);
    let productsList = $derived(productsQuery.data || []);
    let parsingLoading = $derived(
        purchasesQuery.isLoading ||
            suppliersQuery.isLoading ||
            productsQuery.isLoading,
    );
    const createPurchaseMutation = createMutation(() => ({
        mutationFn: PurchaseService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchases"] });
            queryClient.invalidateQueries({ queryKey: ["products"] }); // Stock updated
            toast.success("Pembelian berhasil disimpan!");
            open = false;
        },
        onError: (e: any) => {
            const msg =
                e.response?.data?.message || "Gagal menyimpan pembelian";
            toast.error(msg);
        },
    }));

    let loading = $derived(createPurchaseMutation.isPending || parsingLoading);
    const queryClient = useQueryClient();

    // Replaces loadData
    // onMount removed as Query handles it

    function resetForm() {
        selectedSupplier = "";
        notes = "";
        items = [];
        addItem(); // Start with 1 row
    }

    function addItem() {
        items = [
            ...items,
            {
                productId: "",
                variant: "Original",
                qty: 1,
                buyPrice: 0,
                sellPrice: 0,
            },
        ];
    }

    function removeItem(index: number) {
        items = items.filter((_, i) => i !== index);
    }

    function updateItemProduct(index: number, productId: string) {
        items[index].productId = productId;
        const p = productsList.find((x: any) => x.id === productId);
        if (p) items[index].productName = p.name;
    }

    function handleSubmit() {
        if (!selectedSupplier) {
            toast.error("Pilih Supplier terlebih dahulu");
            return;
        }
        if (items.some((i) => !i.productId || i.qty < 1)) {
            toast.error("Lengkapi data item (Produk & Qty)");
            return;
        }

        const payload = {
            supplierId: selectedSupplier,
            notes: notes,
            items: items.map((i) => ({
                productId: i.productId,
                variant: i.variant,
                qty: Number(i.qty),
                buyPrice: Number(i.buyPrice),
                sellPrice: Number(i.sellPrice),
            })),
        };

        createPurchaseMutation.mutate(payload);
    }

    let totalAmount = $derived(
        items.reduce((sum, i) => sum + (i.qty || 0) * (i.buyPrice || 0), 0),
    );
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <div class="relative w-[300px]">
            <!-- Search placeholder -->
        </div>
        <div class="flex gap-2">
            <Dialog
                bind:open
                onOpenChange={(isOpen) => (isOpen ? resetForm() : null)}
            >
                <DialogTrigger class={buttonVariants({ variant: "default" })}>
                    <Plus class="mr-2 h-4 w-4" /> Pembelian Baru (Stok Masuk)
                </DialogTrigger>
                <DialogContent class="sm:max-w-[900px]">
                    <DialogHeader>
                        <DialogTitle>Input Pembelian Baru</DialogTitle>
                        <DialogDescription
                            >Transaksi ini akan menambah stok produk (membuat
                            Batch baru).</DialogDescription
                        >
                    </DialogHeader>

                    <div class="grid gap-4 py-4">
                        <!-- Header Form -->
                        <div class="grid grid-cols-2 gap-4 border-b pb-4">
                            <div class="space-y-2">
                                <Label>Supplier</Label>
                                <select
                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    bind:value={selectedSupplier}
                                >
                                    <option value=""
                                        >-- Pilih Supplier --</option
                                    >
                                    {#each suppliers as sup}
                                        <option value={sup.id}
                                            >{sup.name}</option
                                        >
                                    {/each}
                                </select>
                            </div>
                            <div class="space-y-2">
                                <Label>Catatan / No. Faktur</Label>
                                <Input
                                    placeholder="Contoh: INV-001"
                                    bind:value={notes}
                                />
                            </div>
                        </div>

                        <!-- Items Table -->
                        <div class="space-y-2">
                            <div class="flex justify-between items-center">
                                <h4 class="font-medium text-sm">
                                    Item Pembelian
                                </h4>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onclick={addItem}
                                >
                                    <Plus class="h-3 w-3 mr-1" /> Tambah Baris
                                </Button>
                            </div>

                            <div
                                class="border rounded-md max-h-[300px] overflow-auto"
                            >
                                <Table>
                                    <TableHeader>
                                        <TableRow class="bg-muted/50">
                                            <TableHead class="w-[200px]"
                                                >Produk</TableHead
                                            >
                                            <TableHead class="w-[120px]"
                                                >Varian</TableHead
                                            >
                                            <TableHead class="w-[80px]"
                                                >Qty</TableHead
                                            >
                                            <TableHead class="w-[130px]"
                                                >Harga Beli</TableHead
                                            >
                                            <TableHead class="w-[130px]"
                                                >Harga Jual</TableHead
                                            >
                                            <TableHead class="w-[100px]"
                                                >Subtotal</TableHead
                                            >
                                            <TableHead class="w-[50px]"
                                            ></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {#each items as item, i}
                                            <TableRow>
                                                <TableCell>
                                                    <select
                                                        class="w-full h-8 rounded border bg-transparent text-sm px-2"
                                                        value={item.productId}
                                                        onchange={(e) =>
                                                            updateItemProduct(
                                                                i,
                                                                e.currentTarget
                                                                    .value,
                                                            )}
                                                    >
                                                        <option value=""
                                                            >- Produk -</option
                                                        >
                                                        {#each productsList as p}
                                                            <option value={p.id}
                                                                >{p.name}</option
                                                            >
                                                        {/each}
                                                    </select>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        class="h-8"
                                                        bind:value={
                                                            item.variant
                                                        }
                                                        placeholder="Original"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        class="h-8"
                                                        min="1"
                                                        bind:value={item.qty}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        class="h-8"
                                                        min="0"
                                                        bind:value={
                                                            item.buyPrice
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        class="h-8"
                                                        min="0"
                                                        bind:value={
                                                            item.sellPrice
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell
                                                    class="text-right font-medium"
                                                >
                                                    {(
                                                        item.qty * item.buyPrice
                                                    ).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    {#if items.length > 1}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            class="h-8 w-8 text-red-500"
                                                            onclick={() =>
                                                                removeItem(i)}
                                                        >
                                                            <Trash2
                                                                class="h-4 w-4"
                                                            />
                                                        </Button>
                                                    {/if}
                                                </TableCell>
                                            </TableRow>
                                        {/each}
                                    </TableBody>
                                </Table>
                            </div>

                            <div class="flex justify-end pt-2">
                                <div class="text-right">
                                    <span class="text-muted-foreground mr-4"
                                        >Total Pembelian:</span
                                    >
                                    <span class="text-xl font-bold"
                                        >Rp {totalAmount.toLocaleString()}</span
                                    >
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            onclick={handleSubmit}
                            disabled={loading}
                        >
                            {#if loading}Menyimpan...{:else}Simpan Pembelian{/if}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    </div>

    <div class="rounded-md border bg-card">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead class="text-right">Total</TableHead>
                    <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#each purchases as trx}
                    <TableRow>
                        <TableCell class="font-medium text-xs font-mono"
                            >{trx.id}</TableCell
                        >
                        <TableCell
                            >{new Date(
                                trx.date,
                            ).toLocaleDateString()}</TableCell
                        >
                        <TableCell>{trx.supplier?.name || "-"}</TableCell>
                        <TableCell class="text-muted-foreground"
                            >{trx.notes || "-"}</TableCell
                        >
                        <TableCell class="text-right font-semibold"
                            >Rp {trx.totalAmount.toLocaleString()}</TableCell
                        >
                        <TableCell class="text-right">
                            <Button variant="ghost" size="icon"
                                ><Eye class="h-4 w-4" /></Button
                            >
                        </TableCell>
                    </TableRow>
                {/each}
            </TableBody>
        </Table>
    </div>
</div>
