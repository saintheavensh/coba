<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import { Plus, Pencil, Trash2 } from "lucide-svelte";
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
    import { Label } from "$lib/components/ui/label";
    import { toast } from "$lib/components/ui/sonner";

    let categories = [
        { id: 1, name: "Elektronik", description: "Handphone, Laptop, TV" },
        { id: 2, name: "Aksesoris", description: "Casing, Charger, Kabel" },
        { id: 3, name: "Sparepart", description: "LCD, Baterai, Kamera" },
    ];

    let open = false;
    let loading = false;

    function handleSubmit() {
        loading = true;
        setTimeout(() => {
            loading = false;
            open = false;
            toast.success("Kategori berhasil ditambahkan!", {
                description: "Data telah disimpan ke database (simulasi).",
            });
        }, 1000);
    }
</script>

<div class="flex flex-col gap-4">
    <div class="flex justify-end">
        <Dialog bind:open>
            <DialogTrigger class={buttonVariants({ variant: "default" })}>
                <Plus class="mr-2 h-4 w-4" /> Tambah Kategori
            </DialogTrigger>
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Tambah Kategori</DialogTitle>
                    <DialogDescription>
                        Buat kategori produk baru di sini. Klik simpan setelah
                        selesai.
                    </DialogDescription>
                </DialogHeader>
                <div class="grid gap-4 py-4">
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label for="name" class="text-right">Nama</Label>
                        <Input
                            id="name"
                            placeholder="Contoh: Elektronik"
                            class="col-span-3"
                        />
                    </div>
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label for="desc" class="text-right">Deskripsi</Label>
                        <Input
                            id="desc"
                            placeholder="Keterangan singkat..."
                            class="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="submit"
                        onclick={handleSubmit}
                        disabled={loading}
                    >
                        {#if loading}Menyimpan...{:else}Simpan Kategori{/if}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>

    <div class="rounded-md border bg-card">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nama Kategori</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#each categories as category}
                    <TableRow>
                        <TableCell class="font-medium"
                            >{category.name}</TableCell
                        >
                        <TableCell class="text-muted-foreground"
                            >{category.description}</TableCell
                        >
                        <TableCell class="text-right space-x-2">
                            <Button variant="ghost" size="icon" class="h-8 w-8">
                                <Pencil class="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                class="h-8 w-8 text-red-600 hover:text-red-700"
                            >
                                <Trash2 class="h-4 w-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                {/each}
            </TableBody>
        </Table>
    </div>
</div>
