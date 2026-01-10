<script lang="ts">
    import {
        createQuery,
        createMutation,
        useQueryClient,
    } from "@tanstack/svelte-query";

    // Assuming InventoryService has getSuppliers, getCategories.
    import { InventoryService } from "$lib/services/inventory.service";

    import ImageUpload from "$lib/components/custom/image-upload.svelte";
    import { Input } from "$lib/components/ui/input";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import { Plus, Pencil, Trash2, Tag, Phone, MapPin } from "lucide-svelte";
    import { Badge } from "$lib/components/ui/badge";
    import { cn } from "$lib/utils";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
        DialogTrigger,
    } from "$lib/components/ui/dialog";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import { Label } from "$lib/components/ui/label";
    import {
        Avatar,
        AvatarFallback,
        AvatarImage,
    } from "$lib/components/ui/avatar";
    import { toast } from "svelte-sonner";
    import * as Select from "$lib/components/ui/select";
    import SearchInput from "$lib/components/custom/search-input.svelte";

    const client = useQueryClient();

    // --- Queries ---
    const suppliersQuery = createQuery(() => ({
        queryKey: ["suppliers"],
        queryFn: InventoryService.getSuppliers,
    }));

    const categoriesQuery = createQuery(() => ({
        queryKey: ["categories"],
        queryFn: InventoryService.getCategories,
    }));

    // --- Mutations ---
    const saveSupplierMutation = createMutation(() => ({
        mutationFn: async (data: any) => {
            if (data.id) {
                return InventoryService.updateSupplier(data.id, data);
            } else {
                return InventoryService.createSupplier(data);
            }
        },
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ["suppliers"] });
            toast.success("Data supplier disimpan");
            openSupplier = false;
            resetSupplierForm();
        },
        onError: () => toast.error("Gagal menyimpan supplier"),
    }));

    const deleteSupplierMutation = createMutation(() => ({
        mutationFn: InventoryService.deleteSupplier,
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ["suppliers"] });
            toast.success("Supplier dihapus");
        },
        onError: () => toast.error("Gagal menghapus supplier"),
    }));

    // Local State (Runes)
    let searchQuery = $state("");
    let openSupplier = $state(false);
    let openBrand = $state(false);

    // Form State (Runes)
    let editingId = $state<string | null>(null);
    let name = $state("");
    let contact = $state("");
    let phone = $state("");
    let address = $state("");
    let image = $state(""); // URL
    // Reactive Data (Runes)
    let suppliers = $derived(suppliersQuery.data || []);
    let loading = $derived(suppliersQuery.isLoading);

    let filteredSuppliers = $derived(
        (suppliers || []).filter(
            (s: any) =>
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.phone && s.phone.includes(searchQuery)),
        ),
    );

    function getInitials(name: string) {
        return name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    }

    function resetSupplierForm() {
        editingId = null;
        name = "";
        contact = "";
        phone = "";
        address = "";
        image = "";
    }

    function handleEdit(sup: any) {
        editingId = sup.id;
        name = sup.name;
        contact = sup.contact || "";
        phone = sup.phone || "";
        address = sup.address || "";
        image = sup.image || "";
        openSupplier = true;
    }

    let deleteId = $state<string | null>(null);
    let openDelete = $state(false);

    function confirmDelete(id: string) {
        deleteId = id;
        openDelete = true;
    }

    function handleDeleteExample() {
        if (!deleteId) return;
        deleteSupplierMutation.mutate(deleteId);
        openDelete = false;
        deleteId = null;
    }

    function handleSaveSupplier() {
        if (!name) return toast.error("Nama supplier wajib diisi");

        const payload = {
            id: editingId,
            name,
            contact,
            phone,
            address,
            image,
            // brands removed
        };
        saveSupplierMutation.mutate(payload);
    }

    // Old handleDeleteBrand removed
</script>

<div class="space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-center gap-4">
        <!-- Reused Component -->
        <SearchInput
            bind:value={searchQuery}
            placeholder="Cari supplier..."
            class="w-full max-w-none md:max-w-[300px]"
        />

        <!-- Dialog Tambah Supplier -->
        <Dialog
            bind:open={openSupplier}
            onOpenChange={(o) => !o && resetSupplierForm()}
        >
            <DialogTrigger
                class={cn(
                    buttonVariants({ variant: "default" }),
                    "w-full md:w-auto",
                )}
            >
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
                        <div
                            class="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4"
                        >
                            <Label class="text-left md:text-right">ID</Label>
                            <Input
                                value={editingId}
                                disabled
                                class="col-span-3 bg-muted"
                            />
                        </div>
                    {/if}
                    <div
                        class="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4"
                    >
                        <Label class="text-left md:text-right"
                            >Nama PT/Toko <span class="text-red-500">*</span
                            ></Label
                        >
                        <Input
                            bind:value={name}
                            placeholder="PT. Nama Supplier"
                            class="col-span-3"
                        />
                    </div>
                    <div
                        class="grid grid-cols-1 md:grid-cols-4 items-start gap-2 md:gap-4"
                    >
                        <Label class="text-left md:text-right pt-2"
                            >Logo Supplier</Label
                        >
                        <div class="col-span-3">
                            <ImageUpload
                                bind:value={image}
                                disabled={saveSupplierMutation.isPending}
                            />
                            <div class="text-[10px] text-muted-foreground mt-1">
                                Kosongkan untuk menggunakan avatar inisial
                                default.
                            </div>
                        </div>
                    </div>
                    <div
                        class="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4"
                    >
                        <Label class="text-left md:text-right"
                            >Kontak Person</Label
                        >
                        <Input
                            bind:value={contact}
                            placeholder="Nama Sales"
                            class="col-span-3"
                        />
                    </div>
                    <div
                        class="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4"
                    >
                        <Label class="text-left md:text-right">Telepon</Label>
                        <Input
                            bind:value={phone}
                            placeholder="08xxx"
                            class="col-span-3"
                        />
                    </div>
                    <div
                        class="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4"
                    >
                        <Label class="text-left md:text-right">Alamat</Label>
                        <Input
                            bind:value={address}
                            placeholder="Alamat lengkap"
                            class="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onclick={handleSaveSupplier}
                        disabled={saveSupplierMutation.isPending}
                    >
                        {saveSupplierMutation.isPending
                            ? "Menyimpan..."
                            : "Simpan Supplier"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>

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
                    class="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md relative flex flex-col justify-between"
                >
                    <div class="flex items-start gap-4 mb-4">
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
                            <div class="flex items-center gap-2 mb-1">
                                <h4 class="font-semibold text-lg truncate">
                                    {supplier.name}
                                </h4>
                                <span
                                    class="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0"
                                >
                                    {supplier.id}
                                </span>
                            </div>
                            <div
                                class="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden"
                            >
                                {#if supplier.contact}
                                    <span
                                        class="flex items-center gap-1 truncate shrink-0"
                                    >
                                        <span class="opacity-70 text-xs"
                                            >Sales:</span
                                        >
                                        <span
                                            class="truncate max-w-[80px] sm:max-w-none"
                                            >{supplier.contact}</span
                                        >
                                    </span>
                                    <span
                                        class="text-muted-foreground/30 hidden sm:inline shrink-0"
                                        >•</span
                                    >
                                {/if}
                                <span class="flex items-center gap-1 truncate">
                                    {#if supplier.contact}
                                        <span
                                            class="inline sm:hidden mx-1 text-muted-foreground/30"
                                            >•</span
                                        >
                                    {/if}
                                    <Phone class="h-3 w-3 shrink-0" />
                                    <span class="truncate"
                                        >{supplier.phone || "-"}</span
                                    >
                                </span>
                            </div>
                            {#if supplier.address}
                                <div
                                    class="text-xs text-muted-foreground mt-1.5 truncate flex items-center"
                                >
                                    <MapPin
                                        class="h-3 w-3 mr-1 flex-shrink-0"
                                    />
                                    <span class="truncate"
                                        >{supplier.address}</span
                                    >
                                </div>
                            {/if}
                        </div>
                    </div>

                    <div class="pt-3 border-t flex justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onclick={() => handleEdit(supplier)}
                            class="h-8"
                        >
                            <Pencil class="h-3.5 w-3.5 mr-2" />
                            Edit
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            class="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onclick={() => confirmDelete(supplier.id)}
                        >
                            <Trash2 class="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            {/each}
        {/if}
    </div>
    <AlertDialog.Root bind:open={openDelete}>
        <AlertDialog.Content>
            <AlertDialog.Header>
                <AlertDialog.Title>Hapus Supplier?</AlertDialog.Title>
                <AlertDialog.Description>
                    Tindakan ini tidak dapat dibatalkan. Supplier beserta data
                    terkait akan dihapus.
                </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
                <AlertDialog.Cancel>Batal</AlertDialog.Cancel>
                <AlertDialog.Action
                    onclick={handleDeleteExample}
                    class="bg-red-600 hover:bg-red-700 text-white"
                >
                    Hapus Supplier
                </AlertDialog.Action>
            </AlertDialog.Footer>
        </AlertDialog.Content>
    </AlertDialog.Root>
</div>
