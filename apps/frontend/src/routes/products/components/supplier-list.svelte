<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api";
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
        MapPin,
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
    import {
        Avatar,
        AvatarFallback,
        AvatarImage,
    } from "$lib/components/ui/avatar";
    import { toast } from "svelte-sonner";
    import * as Select from "$lib/components/ui/select";

    let suppliers: any[] = [];
    let categories: any[] = []; // Fetched from backend
    let loading = false;
    let openSupplier = false;
    let openBrand = false;

    // State for Search
    let searchQuery = "";

    // State for Supplier Form
    let editingId: string | null = null;
    let name = "";
    let contact = "";
    let phone = "";
    let address = "";
    let image = ""; // URL
    let formBrands: any[] = [];

    // State for Brand Form
    let selectedSupplierId: string | null = null;
    let brandName = "";
    let brandCategory = "";

    async function load() {
        loading = true;
        try {
            // Load Suppliers & Categories concurrently
            const [supRes, catRes] = await Promise.all([
                api("/suppliers"),
                api("/categories"),
            ]);
            suppliers = supRes;
            categories = catRes;
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        load();
    });

    $: filteredSuppliers = suppliers.filter(
        (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.phone && s.phone.includes(searchQuery)),
    );

    function getInitials(name: string) {
        return name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    }

    // --- Supplier CRUD ---

    function resetSupplierForm() {
        editingId = null;
        name = "";
        contact = "";
        phone = "";
        address = "";
        image = "";
        formBrands = [];
    }

    function handleEdit(sup: any) {
        editingId = sup.id;
        name = sup.name;
        contact = sup.contact || "";
        phone = sup.phone || "";
        address = sup.address || "";
        image = sup.image || "";
        formBrands = sup.brands || [];
        openSupplier = true;
    }

    async function handleDelete(id: string) {
        if (!confirm("Yakin hapus supplier ini?")) return;
        try {
            await api(`/suppliers/${id}`, { method: "DELETE" });
            toast.success("Supplier dihapus");
            load();
        } catch (e) {
            /* handled */
        }
    }

    async function handleSaveSupplier() {
        if (!name) return toast.error("Nama supplier wajib diisi");

        loading = true;
        try {
            const payload = {
                name,
                contact,
                phone,
                address,
                image,
                brands: formBrands,
            };

            if (editingId) {
                await api(`/suppliers/${editingId}`, {
                    method: "PUT",
                    body: payload,
                });
                toast.success("Supplier diperbarui");
            } else {
                await api("/suppliers", { method: "POST", body: payload });
                toast.success("Supplier ditambahkan");
            }
            openSupplier = false;
            resetSupplierForm();
            load();
        } catch (e) {
            // handled by api wrapper
        } finally {
            loading = false;
        }
    }

    // --- Brand CRUD ---

    function openAddBrand(supplierId: string) {
        selectedSupplierId = supplierId;
        brandName = "";
        brandCategory = "";
        openBrand = true;
    }

    async function handleSaveBrand() {
        if (!brandName) return toast.error("Nama merk wajib diisi");
        if (!selectedSupplierId) return;
        if (!brandCategory) return toast.error("Pilih kategori");

        const supplier = suppliers.find((s) => s.id === selectedSupplierId);
        if (!supplier) return;

        const newBrand = { name: brandName, category: brandCategory };
        const updatedBrands = [...(supplier.brands || []), newBrand];

        loading = true;
        try {
            const payload = {
                name: supplier.name,
                contact: supplier.contact,
                phone: supplier.phone,
                address: supplier.address,
                image: supplier.image,
                brands: updatedBrands,
            };

            await api(`/suppliers/${selectedSupplierId}`, {
                method: "PUT",
                body: payload,
            });
            toast.success("Merk berhasil ditambahkan!");
            openBrand = false;
            load();
        } catch (e) {
            toast.error("Gagal menambah merk");
        } finally {
            loading = false;
        }
    }

    async function handleDeleteBrand(supplierId: string, brandIndex: number) {
        if (!confirm("Hapus merk ini?")) return;

        const supplier = suppliers.find((s) => s.id === supplierId);
        if (!supplier) return;

        const updatedBrands = [...(supplier.brands || [])];
        updatedBrands.splice(brandIndex, 1);

        try {
            const payload = {
                name: supplier.name,
                contact: supplier.contact,
                phone: supplier.phone,
                address: supplier.address,
                image: supplier.image,
                brands: updatedBrands,
            };
            await api(`/suppliers/${supplierId}`, {
                method: "PUT",
                body: payload,
            });
            toast.success("Merk dihapus");
            load();
        } catch (e) {
            /* handled */
        }
    }
</script>

<div class="space-y-6">
    <div class="flex justify-between items-center">
        <div class="relative w-[300px]">
            <Search
                class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            />
            <Input
                type="search"
                placeholder="Cari supplier..."
                class="pl-8"
                bind:value={searchQuery}
            />
        </div>

        <!-- Dialog Tambah Supplier -->
        <Dialog
            bind:open={openSupplier}
            onOpenChange={(o) => !o && resetSupplierForm()}
        >
            <DialogTrigger class={buttonVariants({ variant: "default" })}>
                <Plus class="mr-2 h-4 w-4" /> Supplier Baru
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle
                        >{editingId ? "Edit" : "Tambah"} Supplier</DialogTitle
                    >
                    <DialogDescription
                        >Input data supplier baru.</DialogDescription
                    >
                </DialogHeader>
                <div class="grid gap-4 py-4">
                    {#if editingId}
                        <div class="grid grid-cols-4 items-center gap-4">
                            <Label class="text-right">ID</Label>
                            <Input
                                value={editingId}
                                disabled
                                class="col-span-3 bg-muted"
                            />
                        </div>
                    {/if}
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right"
                            >Nama PT/Toko <span class="text-red-500">*</span
                            ></Label
                        >
                        <Input
                            bind:value={name}
                            placeholder="PT. Nama Supplier"
                            class="col-span-3"
                        />
                    </div>
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Foto URL</Label>
                        <Input
                            bind:value={image}
                            placeholder="https://... (Opsional)"
                            class="col-span-3"
                        />
                        <div
                            class="col-start-2 col-span-3 text-[10px] text-muted-foreground"
                        >
                            Kosongkan untuk menggunakan avatar inisial default.
                        </div>
                    </div>
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Kontak Person</Label>
                        <Input
                            bind:value={contact}
                            placeholder="Nama Sales"
                            class="col-span-3"
                        />
                    </div>
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Telepon</Label>
                        <Input
                            bind:value={phone}
                            placeholder="08xxx"
                            class="col-span-3"
                        />
                    </div>
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Alamat</Label>
                        <Input
                            bind:value={address}
                            placeholder="Alamat lengkap"
                            class="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onclick={handleSaveSupplier} disabled={loading}>
                        {loading ? "Menyimpan..." : "Simpan Supplier"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>

    <!-- Dialog Tambah Brand (Global) -->
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
                    <Input
                        bind:value={brandName}
                        placeholder="Contoh: Samsung"
                        class="col-span-3"
                    />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label class="text-right">Kategori</Label>
                    <div class="col-span-3">
                        <Select.Root type="single" bind:value={brandCategory}>
                            <Select.Trigger>
                                {brandCategory || "Pilih Kategori"}
                            </Select.Trigger>
                            <Select.Content>
                                {#each categories as cat}
                                    <Select.Item value={cat.name}
                                        >{cat.name}</Select.Item
                                    >
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button onclick={handleSaveBrand} disabled={loading}>
                    {loading ? "Menyimpan..." : "Simpan Merk"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <div class="grid gap-4">
        {#if loading && suppliers.length === 0}
            <div class="p-8 text-center text-muted-foreground">
                Memuat data...
            </div>
        {:else if filteredSuppliers.length === 0}
            <div class="p-8 text-center border rounded-lg bg-muted/20">
                <p class="text-muted-foreground">Belum ada data supplier.</p>
            </div>
        {:else}
            {#each filteredSuppliers as supplier (supplier.id)}
                <div
                    class="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md"
                >
                    <div
                        class="flex flex-col sm:flex-row items-start justify-between gap-4"
                    >
                        <div class="flex gap-4 w-full">
                            <div class="flex-shrink-0">
                                <Avatar class="h-12 w-12 rounded-lg border">
                                    <AvatarImage
                                        src={supplier.image}
                                        alt={supplier.name}
                                    />
                                    <AvatarFallback
                                        class="rounded-lg bg-blue-100 text-blue-600 font-bold"
                                    >
                                        {getInitials(supplier.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h4 class="font-semibold text-lg truncate pr-2">
                                    {supplier.name}
                                </h4>
                                <div
                                    class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1"
                                >
                                    <span
                                        class="flex items-center gap-1 font-mono text-xs bg-muted px-1.5 py-0.5 rounded"
                                    >
                                        {supplier.id}
                                    </span>
                                    {#if supplier.contact}
                                        <span class="flex items-center gap-1">
                                            <span class="opacity-70"
                                                >Sales:</span
                                            >
                                            {supplier.contact}
                                        </span>
                                    {/if}
                                    <span class="flex items-center gap-1">
                                        <Phone class="h-3 w-3" />
                                        {supplier.phone || "-"}
                                    </span>
                                </div>
                                {#if supplier.address}
                                    <div
                                        class="text-xs text-muted-foreground mt-1 truncate flex items-center"
                                    >
                                        <MapPin class="h-3 w-3 mr-1" />
                                        {supplier.address}
                                    </div>
                                {/if}
                            </div>
                        </div>
                        <div
                            class="flex gap-2 self-end sm:self-start flex-shrink-0"
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                onclick={() => handleEdit(supplier)}
                            >
                                <Pencil class="h-3.5 w-3.5 mr-2" />Edit
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                class="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onclick={() => handleDelete(supplier.id)}
                            >
                                <Trash2 class="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <!-- Brands List -->
                    <div class="mt-4 sm:pl-[4rem]">
                        <div
                            class="flex items-center justify-between sm:justify-start gap-4 mb-3 border-b border-dashed pb-2 sm:border-0 sm:pb-0"
                        >
                            <span
                                class="text-sm font-medium text-muted-foreground"
                                >Daftar Merk/Brand:</span
                            >
                            <Button
                                variant="ghost"
                                size="sm"
                                class="h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                                onclick={() => openAddBrand(supplier.id)}
                            >
                                <Plus class="h-3 w-3 mr-1" />Tambah Merk
                            </Button>
                        </div>

                        {#if supplier.brands && supplier.brands.length > 0}
                            <div
                                class="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                            >
                                {#each supplier.brands as brand, idx}
                                    <div
                                        class="group flex items-center justify-between rounded border bg-background/50 px-3 py-2 text-sm hover:border-blue-200 transition-colors"
                                    >
                                        <div
                                            class="flex items-center gap-2 min-w-0"
                                        >
                                            <Tag
                                                class="h-3.5 w-3.5 text-muted-foreground flex-shrink-0"
                                            />
                                            <span class="font-medium truncate"
                                                >{brand.name}</span
                                            >
                                        </div>
                                        <div
                                            class="flex items-center gap-2 flex-shrink-0"
                                        >
                                            <Badge
                                                variant="secondary"
                                                class="text-[10px] h-5 px-1.5 font-normal"
                                            >
                                                {brand.category}
                                            </Badge>
                                            <button
                                                class="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 transition-all"
                                                title="Hapus merk"
                                                onclick={() =>
                                                    handleDeleteBrand(
                                                        supplier.id,
                                                        idx,
                                                    )}
                                            >
                                                <Trash2 class="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <div
                                class="text-xs text-muted-foreground italic bg-muted/30 p-2 rounded border border-dashed text-center sm:text-left"
                            >
                                Merk belum tersedia.
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>
