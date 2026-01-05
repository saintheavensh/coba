<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import { Label } from "$lib/components/ui/label";
    import { Separator } from "$lib/components/ui/separator";
    import { Textarea } from "$lib/components/ui/textarea";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/components/ui/table";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
        DialogTrigger,
    } from "$lib/components/ui/dialog";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";
    import {
        Card,
        CardContent,
        CardFooter,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import {
        CalendarIcon,
        Plus,
        Trash2,
        Save,
        Printer,
        Search,
    } from "lucide-svelte";
    import { toast } from "$lib/components/ui/sonner";
    import { Badge } from "$lib/components/ui/badge";
    import { activityLogs } from "$lib/stores/settings"; // Import Store

    // Mock Data untuk Produk & Batch
    const products = [
        {
            id: "PRD-001",
            name: "iPhone 15 Pro Max",
            stock: 45,
            batches: [
                {
                    id: "B001",
                    merk: "Galaxy Store",
                    buy: 18000000,
                    sell: 21500000,
                    stock: 15,
                },
                {
                    id: "B002",
                    merk: "iCorner",
                    buy: 18500000,
                    sell: 22000000,
                    stock: 30,
                },
            ],
        },
        {
            id: "PRD-002",
            name: "Samsung Gallaxy S24",
            stock: 20,
            batches: [
                {
                    id: "B003",
                    merk: "Robot",
                    buy: 12000000,
                    sell: 14500000,
                    stock: 20,
                },
            ],
        },
        {
            id: "PRD-003",
            name: "Case iPhone Transparent",
            stock: 50,
            batches: [
                {
                    id: "B004",
                    merk: "Robot",
                    buy: 50000,
                    sell: 85000,
                    stock: 50,
                },
            ],
        },
    ];

    // State Transaksi
    let notaNo = "NOTA-2026-001";
    let transactionDate = new Date().toISOString().split("T")[0];
    let customerName = "Walk In Customer";
    let items: any[] = [];

    // State Modal Tambah Item
    let openAddItem = false;
    let selectedProductPrefix = "";
    let selectedBatchId = "";
    let inputQty = 1;
    let inputPrice = 0;

    // Derived State
    $: selectedProduct = products.find((p) => p.id === selectedProductPrefix);
    $: selectedBatch = selectedProduct?.batches.find(
        (b) => b.id === selectedBatchId,
    );
    $: totalTransaction = items.reduce(
        (acc, item) => acc + item.price * item.qty,
        0,
    );
    $: totalProfit = items.reduce(
        (acc, item) => acc + (item.price - item.buyPrice) * item.qty,
        0,
    );

    function resetModal() {
        selectedProductPrefix = "";
        selectedBatchId = "";
        inputQty = 1;
        inputPrice = 0;
    }

    function handleProductChange(value: string) {
        selectedProductPrefix = value;
        // Auto select first batch (FIFO simulation)
        const product = products.find((p) => p.id === value);
        if (product && product.batches.length > 0) {
            selectedBatchId = product.batches[0].id;
            inputPrice = product.batches[0].sell;
        }
    }

    function handleBatchChange(value: string) {
        selectedBatchId = value;
        if (selectedBatch) inputPrice = selectedBatch.sell;
    }

    function addToCart() {
        if (!selectedProduct || !selectedBatch) return;

        items = [
            ...items,
            {
                id: Date.now(),
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                batchId: selectedBatch.id,
                merk: selectedBatch.merk,
                buyPrice: selectedBatch.buy,
                price: inputPrice,
                qty: inputQty,
                subtotal: inputPrice * inputQty,
            },
        ];

        openAddItem = false;
        resetModal();
        activityLogs.addLog(
            "Kasir 1",
            "Add to Cart",
            `Menambahkan item: ${selectedProduct.name} (Qty: ${inputQty})`,
            "info",
        );
        toast.success("Item ditambahkan ke keranjang");
    }

    function removeItem(index: number) {
        items = items.filter((_, i) => i !== index);
    }

    function handleSaveTransaction() {
        activityLogs.addLog(
            "Kasir 1",
            "Penjualan Baru",
            `Menyimpan transaksi ${notaNo} sebesar Rp ${totalTransaction.toLocaleString()}`,
            "success",
        );

        toast.success("Transaksi Berhasil Disimpan", {
            description: `Total: Rp ${totalTransaction.toLocaleString()}`,
            action: {
                label: "Cetak Nota",
                onClick: () => console.log("Print"),
            },
        });
        // Reset form simulation
        items = [];
        notaNo = "NOTA-2026-002";
    }
    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "F2") {
            e.preventDefault();
            openAddItem = true;
        } else if (e.key === "F4") {
            e.preventDefault();
            if (items.length > 0) handleSaveTransaction();
        } else if (e.key === "Escape") {
            if (openAddItem) openAddItem = false;
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold tracking-tight">Kasir / Penjualan</h2>
            <p class="text-muted-foreground">
                Buat transaksi penjualan baru untuk customer.
            </p>
        </div>
        <div class="flex gap-2">
            <Button variant="outline"
                ><Printer class="mr-2 h-4 w-4" /> Cetak Terakhir</Button
            >
            <Button
                onclick={handleSaveTransaction}
                disabled={items.length === 0}
            >
                <Save class="mr-2 h-4 w-4" /> Simpan Transaksi
            </Button>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Kolom Kiri: Form & Cart -->
        <div class="md:col-span-2 space-y-6">
            <!-- Header Transaksi -->
            <Card>
                <CardHeader class="pb-3">
                    <CardTitle>Informasi Transaksi</CardTitle>
                </CardHeader>
                <CardContent>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="space-y-2">
                            <Label>No. Nota</Label>
                            <Input
                                value={notaNo}
                                readonly
                                class="bg-muted font-mono"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label>Tanggal</Label>
                            <div class="relative">
                                <CalendarIcon
                                    class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                                />
                                <Input
                                    type="date"
                                    bind:value={transactionDate}
                                    class="pl-8"
                                />
                            </div>
                        </div>
                        <div class="space-y-2">
                            <Label>Pelanggan</Label>
                            <Input
                                bind:value={customerName}
                                placeholder="Nama Pelanggan / Walk In"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Tabel Item -->
            <Card class="min-h-[400px] flex flex-col">
                <CardHeader
                    class="pb-3 flex flex-row items-center justify-between"
                >
                    <CardTitle>Keranjang Belanja</CardTitle>
                    <Dialog bind:open={openAddItem}>
                        <DialogTrigger
                            class={buttonVariants({ variant: "default" })}
                        >
                            <Plus class="mr-2 h-4 w-4" /> Tambah Item
                        </DialogTrigger>
                        <DialogContent class="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle
                                    >Tambah Produk ke Keranjang</DialogTitle
                                >
                                <DialogDescription
                                    >Pilih produk dan batch stok yang akan
                                    dijual.</DialogDescription
                                >
                            </DialogHeader>
                            <div class="grid gap-4 py-4">
                                <div class="space-y-2">
                                    <Label>Pilih Produk</Label>
                                    <Select
                                        type="single"
                                        onValueChange={handleProductChange}
                                    >
                                        <SelectTrigger>
                                            {products.find(
                                                (p) =>
                                                    p.id ===
                                                    selectedProductPrefix,
                                            )?.name || "Cari Produk..."}
                                        </SelectTrigger>
                                        <SelectContent>
                                            {#each products as product}
                                                <SelectItem value={product.id}
                                                    >{product.name} (Stok: {product.stock})</SelectItem
                                                >
                                            {/each}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {#if selectedProduct}
                                    <div class="space-y-2">
                                        <Label
                                            >Pilih Batch Stok (FIFO Recommended)</Label
                                        >
                                        <Select
                                            type="single"
                                            value={selectedBatchId}
                                            onValueChange={handleBatchChange}
                                        >
                                            <SelectTrigger>
                                                {selectedBatch
                                                    ? `[${selectedBatch.merk}] Sisa: ${selectedBatch.stock}`
                                                    : "Pilih Batch..."}
                                            </SelectTrigger>
                                            <SelectContent>
                                                {#each selectedProduct.batches as batch}
                                                    <SelectItem
                                                        value={batch.id}
                                                    >
                                                        <span
                                                            class="font-mono text-xs mr-2"
                                                            >[{batch.merk}]</span
                                                        >
                                                        Sisa: {batch.stock} | Beli:
                                                        {batch.buy.toLocaleString()}
                                                        | Jual: {batch.sell.toLocaleString()}
                                                    </SelectItem>
                                                {/each}
                                            </SelectContent>
                                        </Select>
                                        {#if selectedBatch}
                                            <p
                                                class="text-xs text-muted-foreground mt-1"
                                            >
                                                Margin Potensial: <span
                                                    class="text-green-600 font-medium"
                                                    >Rp {(
                                                        selectedBatch.sell -
                                                        selectedBatch.buy
                                                    ).toLocaleString()}</span
                                                > / unit
                                            </p>
                                        {/if}
                                    </div>

                                    <div class="grid grid-cols-2 gap-4">
                                        <div class="space-y-2">
                                            <Label>Harga Jual (Rp)</Label>
                                            <Input
                                                type="number"
                                                bind:value={inputPrice}
                                            />
                                        </div>
                                        <div class="space-y-2">
                                            <Label>Qty</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max={selectedBatch?.stock}
                                                bind:value={inputQty}
                                            />
                                        </div>
                                    </div>

                                    <div
                                        class="bg-muted p-3 rounded-md text-right"
                                    >
                                        <span
                                            class="text-xs text-muted-foreground"
                                            >Subtotal Item:</span
                                        >
                                        <div class="text-lg font-bold">
                                            Rp {(
                                                inputPrice * inputQty
                                            ).toLocaleString()}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                            <DialogFooter>
                                <Button
                                    type="submit"
                                    onclick={addToCart}
                                    disabled={!selectedProduct ||
                                        !selectedBatch}
                                >
                                    Tambahkan
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent class="flex-1">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produk</TableHead>
                                <TableHead>Detail</TableHead>
                                <TableHead class="text-right">Harga</TableHead>
                                <TableHead class="text-center">Qty</TableHead>
                                <TableHead class="text-right"
                                    >Subtotal</TableHead
                                >
                                <TableHead class="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each items as item, i}
                                <TableRow>
                                    <TableCell class="font-medium"
                                        >{item.productName}</TableCell
                                    >
                                    <TableCell>
                                        <Badge variant="outline" class="text-xs"
                                            >{item.merk}</Badge
                                        >
                                    </TableCell>
                                    <TableCell class="text-right"
                                        >Rp {item.price.toLocaleString()}</TableCell
                                    >
                                    <TableCell class="text-center"
                                        >{item.qty}</TableCell
                                    >
                                    <TableCell class="text-right font-medium"
                                        >Rp {item.subtotal.toLocaleString()}</TableCell
                                    >
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            class="h-8 w-8 text-red-500 hover:text-red-700"
                                            onclick={() => removeItem(i)}
                                        >
                                            <Trash2 class="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            {:else}
                                <TableRow>
                                    <TableCell
                                        colspan={6}
                                        class="h-24 text-center text-muted-foreground"
                                    >
                                        Belum ada item ditambahkan.
                                    </TableCell>
                                </TableRow>
                            {/each}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        <!-- Kolom Kanan: Summary -->
        <div class="space-y-6">
            <Card class="bg-slate-900 text-slate-50 border-none shadow-lg">
                <CardHeader>
                    <CardTitle class="text-slate-200">Total Tagihan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div class="text-4xl font-bold tracking-tight">
                        Rp {totalTransaction.toLocaleString()}
                    </div>
                    <div
                        class="mt-4 text-sm text-slate-400 flex justify-between border-t border-slate-700 pt-4"
                    >
                        <span>Estimasi Keuntungan:</span>
                        <span class="text-green-400 font-medium"
                            >+ Rp {totalProfit.toLocaleString()}</span
                        >
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle class="text-base">Pembayaran</CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="space-y-2">
                        <Label>Metode Pembayaran</Label>
                        <Select type="single" name="paymentMethod">
                            <SelectTrigger>Pilih Metode</SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash"
                                    >Tunai (Cash)</SelectItem
                                >
                                <SelectItem value="transfer"
                                    >Transfer Bank</SelectItem
                                >
                                <SelectItem value="qris">QRIS</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="space-y-2">
                        <Label>Catatan</Label>
                        <Textarea
                            placeholder="Catatan tambahan untuk transaksi ini..."
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        class="w-full h-12 text-lg"
                        onclick={handleSaveTransaction}
                        disabled={items.length === 0}
                    >
                        Bayar & Simpan
                    </Button>
                </CardFooter>
            </Card>
        </div>
    </div>
</div>
