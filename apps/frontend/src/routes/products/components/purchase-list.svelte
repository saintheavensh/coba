<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import { Plus, Download, Eye, Calendar } from "lucide-svelte";
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
    import { toast } from "$lib/components/ui/sonner";

    let purchases = [
        {
            id: "FAK-2026-003",
            date: "04 Jan 2026",
            supplier: "PT. Jaya Abadi",
            merk: "Galaxy Store",
            total: "Rp 455.000.000",
            status: "Success",
        },
        {
            id: "FAK-2026-002",
            date: "02 Jan 2026",
            supplier: "CV. Maju Terus",
            merk: "Robot",
            total: "Rp 12.500.000",
            status: "Success",
        },
        {
            id: "FAK-2026-001",
            date: "01 Jan 2026",
            supplier: "PT. Jaya Abadi",
            merk: "iCorner",
            total: "Rp 85.000.000",
            status: "Pending",
        },
    ];

    let open = false;
    let loading = false;

    function handleSubmit() {
        loading = true;
        setTimeout(() => {
            loading = false;
            open = false;
            toast.success("Pembelian berhasil disimpan!", {
                description: "Stok produk akan bertambah otomatis (simulasi).",
            });
        }, 1500);
    }
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <div class="relative w-[300px]">
            <!-- Search placeholder -->
        </div>
        <div class="flex gap-2">
            <Button variant="outline"
                ><Download class="mr-2 h-4 w-4" /> Export</Button
            >

            <Dialog bind:open>
                <DialogTrigger class={buttonVariants({ variant: "default" })}>
                    <Plus class="mr-2 h-4 w-4" /> Pembelian Baru
                </DialogTrigger>
                <DialogContent class="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Input Pembelian Baru</DialogTitle>
                        <DialogDescription
                            >Masukkan data faktur dan item pembelian.</DialogDescription
                        >
                    </DialogHeader>
                    <div class="grid gap-4 py-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <Label>No. Faktur</Label>
                                <Input placeholder="FAK-xxxx" />
                            </div>
                            <div class="space-y-2">
                                <Label>Tanggal</Label>
                                <div class="relative">
                                    <Calendar
                                        class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                                    />
                                    <Input type="date" class="pl-8" />
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <Label>Supplier</Label>
                                <Input placeholder="Pilih Supplier..." />
                            </div>
                            <div class="space-y-2">
                                <Label>Merk</Label>
                                <Input placeholder="Pilih Merk..." />
                            </div>
                        </div>

                        <div class="border-t pt-4 mt-2">
                            <h4 class="mb-4 text-sm font-medium">
                                Detail Item (Contoh 1 Item)
                            </h4>
                            <div class="grid gap-4">
                                <div
                                    class="grid grid-cols-4 items-center gap-4"
                                >
                                    <Label class="text-right">Produk</Label>
                                    <Input
                                        placeholder="Cari Produk..."
                                        class="col-span-3"
                                    />
                                </div>
                                <div
                                    class="grid grid-cols-4 items-center gap-4"
                                >
                                    <Label class="text-right">Harga Beli</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        class="col-span-3"
                                    />
                                </div>
                                <div
                                    class="grid grid-cols-4 items-center gap-4"
                                >
                                    <Label class="text-right">Qty</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        class="col-span-3"
                                    />
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
                            {#if loading}Menyimpan...{:else}Simpan Transaksi{/if}
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
                    <TableHead>No. Faktur</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Merk</TableHead>
                    <TableHead class="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#each purchases as trx}
                    <TableRow>
                        <TableCell class="font-medium">{trx.id}</TableCell>
                        <TableCell>{trx.date}</TableCell>
                        <TableCell>{trx.supplier}</TableCell>
                        <TableCell>{trx.merk}</TableCell>
                        <TableCell class="text-right font-semibold"
                            >{trx.total}</TableCell
                        >
                        <TableCell>
                            {#if trx.status === "Success"}
                                <Badge
                                    variant="outline"
                                    class="bg-green-50 text-green-700"
                                    >Selesai</Badge
                                >
                            {:else}
                                <Badge
                                    variant="outline"
                                    class="bg-yellow-50 text-yellow-700"
                                    >Pending</Badge
                                >
                            {/if}
                        </TableCell>
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
