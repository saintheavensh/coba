<script lang="ts">
    import { onMount } from "svelte";
    import { BrandsService, type Brand } from "$lib/services/brands.service";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogFooter,
    } from "$lib/components/ui/dialog";
    import { Card, CardContent, CardFooter } from "$lib/components/ui/card";
    import ImageUpload from "$lib/components/custom/image-upload.svelte";
    import { Trash2, Edit2, Plus, MoreVertical } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger,
    } from "$lib/components/ui/dropdown-menu";
    import { buttonVariants } from "$lib/components/ui/button";
    import { cn } from "$lib/utils";

    let brands = $state<Brand[]>([]);
    let loading = $state(false);
    let isDialogOpen = $state(false);
    let isEditing = $state(false);

    let formData = $state({
        id: "",
        name: "",
        logo: "",
    });

    async function loadBrands() {
        loading = true;
        try {
            brands = await BrandsService.getAll();
        } catch (error) {
            toast.error("Gagal memuat data brand");
            console.error(error);
        } finally {
            loading = false;
        }
    }

    function resetForm() {
        formData = { id: "", name: "", logo: "" };
        isEditing = false;
    }

    function openCreateDialog() {
        resetForm();
        isDialogOpen = true;
    }

    function openEditDialog(brand: Brand) {
        formData = { ...brand, logo: brand.logo || "" };
        isEditing = true;
        isDialogOpen = true;
    }

    async function handleSubmit() {
        if (!formData.name) {
            toast.error("Nama brand harus diisi");
            return;
        }

        // If creating, generate ID from name if not provided (though ID input might be hidden or auto-generated)
        if (!isEditing && !formData.id) {
            formData.id = formData.name
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "-");
        }

        try {
            if (isEditing) {
                await BrandsService.update(formData.id, {
                    name: formData.name,
                    logo: formData.logo,
                });
                toast.success("Brand berhasil diperbarui");
            } else {
                await BrandsService.create(formData);
                toast.success("Brand berhasil dibuat");
            }
            isDialogOpen = false;
            loadBrands();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || "Gagal menyimpan brand",
            );
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Apakah anda yakin ingin menghapus brand ini?")) return;

        try {
            await BrandsService.delete(id);
            toast.success("Brand berhasil dihapus");
            loadBrands();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || "Gagal menghapus brand",
            );
        }
    }

    onMount(() => {
        loadBrands();
    });
</script>

<div class="flex flex-col gap-4 p-4 md:p-8">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold tracking-tight">Brands</h2>
            <p class="text-muted-foreground">Kelola daftar brand dan logo.</p>
        </div>
        <Button onclick={openCreateDialog}>
            <Plus class="mr-2 h-4 w-4" />
            Tambah Brand
        </Button>
    </div>

    {#if loading}
        <div class="flex items-center justify-center h-64">
            <div class="text-muted-foreground">Loading brands...</div>
        </div>
    {:else if brands.length === 0}
        <div
            class="flex flex-col items-center justify-center h-64 border rounded-lg border-dashed text-muted-foreground"
        >
            <p>Belum ada data brand.</p>
            <Button variant="link" onclick={openCreateDialog}
                >Buat brand pertama</Button
            >
        </div>
    {:else}
        <div
            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
            {#each brands as brand (brand.id)}
                <Card
                    class="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-muted"
                >
                    <CardContent
                        class="p-4 flex flex-col items-center justify-center gap-3 text-center h-full"
                    >
                        <!-- Action Menu Top Right -->
                        <div
                            class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    class={cn(
                                        buttonVariants({
                                            variant: "ghost",
                                            size: "icon",
                                        }),
                                        "h-6 w-6",
                                    )}
                                >
                                    <MoreVertical class="h-3 w-3" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onclick={() => openEditDialog(brand)}
                                    >
                                        <Edit2 class="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        class="text-destructive focus:text-destructive"
                                        onclick={() => handleDelete(brand.id)}
                                    >
                                        <Trash2 class="mr-2 h-4 w-4" /> Hapus
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div
                            class="h-20 w-full flex items-center justify-center mb-1"
                        >
                            {#if brand.logo}
                                <img
                                    src={brand.logo}
                                    alt={brand.name}
                                    class="h-16 w-auto max-w-[80%] object-contain"
                                />
                            {:else}
                                <div
                                    class="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center text-xl font-bold text-muted-foreground"
                                >
                                    {brand.name.substring(0, 2).toUpperCase()}
                                </div>
                            {/if}
                        </div>
                        <div>
                            <h3
                                class="font-semibold text-base truncate w-full px-1"
                                title={brand.name}
                            >
                                {brand.name}
                            </h3>
                            <p
                                class="text-[10px] text-muted-foreground font-mono"
                            >
                                {brand.id}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            {/each}
        </div>
    {/if}

    <Dialog bind:open={isDialogOpen}>
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle
                    >{isEditing ? "Edit Brand" : "Tambah Brand"}</DialogTitle
                >
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <div class="grid gap-2">
                    <Label for="name">Nama Brand</Label>
                    <Input
                        id="name"
                        bind:value={formData.name}
                        placeholder="Contoh: Samsung"
                    />
                </div>

                {#if !isEditing}
                    <div class="grid gap-2">
                        <Label for="id">ID (Optional - Auto Generated)</Label>
                        <Input
                            id="id"
                            bind:value={formData.id}
                            placeholder="samsung"
                        />
                        <p class="text-xs text-muted-foreground">
                            ID unik, tidak bisa diubah setelah dibuat.
                        </p>
                    </div>
                {/if}

                <div class="grid gap-2">
                    <Label>Logo</Label>
                    <ImageUpload bind:value={formData.logo} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onclick={() => (isDialogOpen = false)}
                    >Batal</Button
                >
                <Button onclick={handleSubmit}
                    >{isEditing ? "Simpan Perubahan" : "Buat Brand"}</Button
                >
            </DialogFooter>
        </DialogContent>
    </Dialog>
</div>
