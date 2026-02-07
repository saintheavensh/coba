<script lang="ts">
    import { onMount } from "svelte";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import { toast } from "svelte-sonner";
    import {
        Plus,
        Trash2,
        Save,
        ArrowLeft,
        Store,
        Calendar,
        Hash,
        FileText,
        Info,
    } from "lucide-svelte";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Separator } from "$lib/shared/components/ui/separator";
    import DateTimePicker from "$lib/shared/components/custom/date-time-picker.svelte";
    import CurrencyInput from "$lib/shared/components/custom/currency-input.svelte";
    import { fade } from "svelte/transition";

    // Import Controller
    import { PurchaseFormController } from "$lib/features/sales/purchases/purchase-form.controller.svelte";

    // Initialize Controller
    const controller = new PurchaseFormController();

    onMount(() => {
        controller.loadDependencies();
    });
</script>

<div class="space-y-6 pb-20">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div class="space-y-1">
            <h2 class="text-2xl font-bold tracking-tight">
                Input Pembelian Baru
            </h2>
            <p class="text-muted-foreground">
                Buat transaksi pembelian stok masuk dari supplier
            </p>
        </div>
        <div class="flex items-center space-x-2">
            <Button variant="outline" href="/purchases">
                <ArrowLeft class="mr-2 h-4 w-4" /> Kembali
            </Button>
            <Button
                onclick={() => controller.submit()}
                disabled={controller.loading || !controller.isValid}
            >
                {#if controller.loading}
                    <span class="mr-2">Menyimpan...</span>
                {:else}
                    <Save class="mr-2 h-4 w-4" /> Simpan Transaksi
                {/if}
            </Button>
        </div>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
        <!-- Informations Card -->
        <Card>
            <CardHeader>
                <CardTitle class="flex items-center text-lg">
                    <Info class="mr-2 h-5 w-5 text-primary" /> Informasi Transaksi
                </CardTitle>
            </CardHeader>
            <CardContent class="grid gap-4">
                <div class="grid gap-2">
                    <Label for="supplier">Supplier</Label>
                    <div class="relative">
                        <Store
                            class="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                        />
                        <select
                            id="supplier"
                            class="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                            bind:value={controller.selectedSupplierId}
                            onchange={(e) =>
                                controller.loadPriorities(
                                    e.currentTarget.value,
                                )}
                        >
                            <option value="">-- Pilih Supplier --</option>
                            {#each controller.suppliers as sup}
                                <option value={sup.id}>{sup.name}</option>
                            {/each}
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="date">Tanggal Transaksi</Label>
                        <div class="relative">
                            <Calendar
                                class="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                            />
                            <Input
                                id="date"
                                type="datetime-local"
                                class="pl-9"
                                bind:value={controller.date}
                            />
                        </div>
                    </div>
                    <div class="grid gap-2">
                        <Label for="ref">No. Referensi (Faktur)</Label>
                        <div class="relative">
                            <Hash
                                class="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                            />
                            <Input
                                id="ref"
                                placeholder="Contoh: INV-001/2024"
                                class="pl-9"
                                bind:value={controller.referenceNumber}
                            />
                        </div>
                    </div>
                </div>

                <div class="grid gap-2">
                    <Label for="notes">Catatan Tambahan</Label>
                    <div class="relative">
                        <FileText
                            class="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                        />
                        <Input
                            id="notes"
                            placeholder="Catatan internal..."
                            class="pl-9"
                            bind:value={controller.notes}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- Summary Card -->
        <Card class="bg-muted/30 border-dashed">
            <CardHeader>
                <CardTitle class="flex items-center text-lg">
                    Ringkasan Biaya
                </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
                <div class="flex items-center justify-between text-sm">
                    <span class="text-muted-foreground">Total Item</span>
                    <Badge variant="outline"
                        >{controller.items.length} Item</Badge
                    >
                </div>
                <!-- Add category summaries if needed -->

                <Separator />

                <div class="flex items-center justify-between">
                    <span class="font-semibold text-lg">Total Pembelian</span>
                    <span class="font-bold text-2xl text-primary">
                        Rp {controller.totalAmount.toLocaleString()}
                    </span>
                </div>

                <p class="text-xs text-muted-foreground text-right mt-2">
                    *Pastikan semua data sudah benar sebelum menyimpan
                </p>
            </CardContent>
        </Card>
    </div>

    <!-- Items Table -->
    <Card>
        <CardHeader class="flex flex-row items-center justify-between">
            <CardTitle>Rincian Item Stok</CardTitle>
            <Button
                size="sm"
                variant="outline"
                onclick={() => controller.addItem()}
            >
                <Plus class="mr-2 h-4 w-4" /> Tambah Baris
            </Button>
        </CardHeader>
        <CardContent>
            {#if controller.items.length === 0}
                <div
                    class="py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg"
                    in:fade
                >
                    <div class="flex justify-center mb-4">
                        <Store class="h-12 w-12 opacity-20" />
                    </div>
                    <p class="text-lg font-medium">
                        Belum ada item ditambahkan
                    </p>
                    <p class="text-sm mb-4">
                        Klik tombol tambah baris untuk mulai input stok
                    </p>
                    <Button
                        variant="outline"
                        onclick={() => controller.addItem()}
                        >Tambah Baris Pertama</Button
                    >
                </div>
            {:else}
                <div class="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow class="bg-muted/50">
                                <TableHead class="w-[50px] text-center"
                                    >#</TableHead
                                >
                                <TableHead class="min-w-[250px]"
                                    >Produk</TableHead
                                >
                                <TableHead class="w-[150px]">Varian</TableHead>
                                <TableHead class="w-[100px]">Qty</TableHead>
                                <TableHead class="w-[180px]"
                                    >Harga Beli (Satuan)</TableHead
                                >
                                <TableHead class="w-[180px]"
                                    >Harga Jual (Estimasi)</TableHead
                                >
                                <TableHead class="w-[180px] text-right"
                                    >Subtotal</TableHead
                                >
                                <TableHead class="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each controller.items as item, i}
                                <TableRow>
                                    <TableCell
                                        class="text-center text-muted-foreground text-xs"
                                        >{i + 1}</TableCell
                                    >
                                    <TableCell>
                                        <select
                                            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            value={item.productId}
                                            onchange={(e) =>
                                                controller.updateItemProduct(
                                                    i,
                                                    e.currentTarget.value,
                                                )}
                                        >
                                            <option value=""
                                                >-- Pilih Produk --</option
                                            >
                                            {#each controller.products as p}
                                                <option value={p.id}
                                                    >{p.name}</option
                                                >
                                            {/each}
                                        </select>
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            class="h-9"
                                            placeholder="Original"
                                            bind:value={item.variant}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            class="h-9"
                                            min="1"
                                            bind:value={item.qty}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            class="h-9"
                                            min="0"
                                            bind:value={item.buyPrice}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            class="h-9"
                                            min="0"
                                            bind:value={item.sellPrice}
                                        />
                                    </TableCell>
                                    <TableCell class="text-right font-medium">
                                        Rp {(
                                            Number(item.qty) *
                                            Number(item.buyPrice)
                                        ).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            class="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onclick={() =>
                                                controller.removeItem(i)}
                                            disabled={controller.items
                                                .length === 1}
                                        >
                                            <Trash2 class="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            {/each}
                        </TableBody>
                        <!-- Footer Row -->
                        <TableRow class="bg-muted/30 font-medium">
                            <TableCell colspan={3} class="text-right"
                                >Total Keseluruhan</TableCell
                            >
                            <TableCell class="text-left font-bold text-primary">
                                {controller.items.reduce(
                                    (s, x) => s + Number(x.qty || 0),
                                    0,
                                )} Unit
                            </TableCell>
                            <TableCell colspan={2}></TableCell>
                            <TableCell
                                class="text-right font-bold text-primary text-lg"
                            >
                                Rp {controller.totalAmount.toLocaleString()}
                            </TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </Table>
                </div>
            {/if}
        </CardContent>
    </Card>
</div>
