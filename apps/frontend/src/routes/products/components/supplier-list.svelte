<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import {
        Plus,
        Pencil,
        Trash2,
        Building2,
        Tag,
        Phone,
        Search,
    } from "lucide-svelte";
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

    let suppliers = [
        {
            id: "SUP-001",
            name: "PT. Jaya Abadi",
            phone: "0812-3456-7890",
            brands: [
                { id: "MRK-01", name: "Galaxy Store", category: "Elektronik" },
                { id: "MRK-02", name: "iCorner", category: "Aksesoris" },
            ],
        },
        {
            id: "SUP-002",
            name: "CV. Maju Terus",
            phone: "021-555666",
            brands: [{ id: "MRK-03", name: "Robot", category: "Aksesoris" }],
        },
    ];

    let openSupplier = false;
    let openBrand = false;
    let loading = false;

    function handleSaveSupplier() {
        loading = true;
        setTimeout(() => {
            loading = false;
            openSupplier = false;
            toast.success("Supplier berhasil ditambahkan!", {
                description: "Data supplier baru telah disimpan.",
            });
        }, 1000);
    }

    function handleSaveBrand() {
        loading = true;
        setTimeout(() => {
            loading = false;
            openBrand = false;
            toast.success("Merk berhasil ditambahkan!", {
                description: "Merk baru telah ditambahkan ke supplier.",
            });
        }, 1000);
    }
</script>

<div class="space-y-6">
    <div class="flex justify-between items-center">
        <div class="relative w-[300px]">
            <Search
                class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            />
            <Input type="search" placeholder="Cari supplier..." class="pl-8" />
        </div>

        <!-- Dialog Tambah Supplier -->
        <Dialog bind:open={openSupplier}>
            <DialogTrigger class={buttonVariants({ variant: "default" })}>
                <Plus class="mr-2 h-4 w-4" /> Supplier Baru
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tambah Supplier</DialogTitle>
                    <DialogDescription
                        >Input data supplier baru.</DialogDescription
                    >
                </DialogHeader>
                <div class="grid gap-4 py-4">
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Kode</Label>
                        <Input
                            value="SUP-xxx"
                            disabled
                            class="col-span-3 bg-muted"
                        />
                    </div>
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Nama</Label>
                        <Input
                            placeholder="PT. Nama Supplier"
                            class="col-span-3"
                        />
                    </div>
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Telepon</Label>
                        <Input placeholder="08xxx" class="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onclick={handleSaveSupplier} disabled={loading}>
                        {#if loading}Menyimpan...{:else}Simpan Supplier{/if}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>

    <!-- Dialog Tambah Brand (Global, bisa dipanggil dari list) -->
    <Dialog bind:open={openBrand}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Tambah Merk</DialogTitle>
                <DialogDescription
                    >Tambahkan merk untuk supplier ini.</DialogDescription
                >
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label class="text-right">Nama Merk</Label>
                    <Input placeholder="Contoh: Samsung" class="col-span-3" />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label class="text-right">Kategori</Label>
                    <Input placeholder="Elektronik" class="col-span-3" />
                </div>
            </div>
            <DialogFooter>
                <Button onclick={handleSaveBrand} disabled={loading}
                    >Simpan Merk</Button
                >
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <div class="grid gap-4">
        {#each suppliers as supplier}
            <div class="rounded-lg border bg-card p-4 shadow-sm">
                <div class="flex items-start justify-between">
                    <div class="flex gap-4">
                        <div
                            class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600"
                        >
                            <Building2 class="h-6 w-6" />
                        </div>
                        <div>
                            <h4 class="font-semibold text-lg">
                                {supplier.name}
                            </h4>
                            <div
                                class="flex items-center gap-4 text-sm text-muted-foreground mt-1"
                            >
                                <span
                                    class="flex items-center gap-1 font-mono text-xs bg-muted px-1.5 py-0.5 rounded"
                                    >{supplier.id}</span
                                >
                                <span class="flex items-center gap-1"
                                    ><Phone class="h-3 w-3" />
                                    {supplier.phone}</span
                                >
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <Button variant="outline" size="sm"
                            ><Pencil class="h-4 w-4 mr-2" />Edit</Button
                        >
                        <Button
                            variant="ghost"
                            size="icon"
                            class="text-red-500 hover:text-red-700 hover:bg-red-50"
                            ><Trash2 class="h-4 w-4" /></Button
                        >
                    </div>
                </div>

                <!-- Brands List -->
                <div class="mt-4 pl-[4rem]">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-sm font-medium text-muted-foreground"
                            >Daftar Merk/Brand:</span
                        >
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-6 text-xs text-blue-600"
                            onclick={() => (openBrand = true)}
                        >
                            <Plus class="h-3 w-3 mr-1" />Tambah Merk
                        </Button>
                    </div>
                    <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {#each supplier.brands as brand}
                            <div
                                class="flex items-center justify-between rounded border px-3 py-2 text-sm"
                            >
                                <div class="flex items-center gap-2">
                                    <Tag
                                        class="h-4 w-4 text-muted-foreground"
                                    />
                                    <span class="font-medium">{brand.name}</span
                                    >
                                </div>
                                <Badge variant="secondary" class="text-[10px]"
                                    >{brand.category}</Badge
                                >
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {/each}
    </div>
</div>
