<script lang="ts">
    import {
        createQuery,
        createMutation,
        useQueryClient,
    } from "@tanstack/svelte-query";
    import { InventoryService } from "$lib/services/inventory.service";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
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
        DialogHeader,
        DialogTitle,
        DialogFooter,
        DialogDescription,
    } from "$lib/components/ui/dialog";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import Combobox from "$lib/components/ui/combobox.svelte";
    import {
        Pencil,
        Trash2,
        Plus,
        FolderOpen,
        Tag,
        Layers,
    } from "lucide-svelte";
    import { toast } from "svelte-sonner";

    // Query Client
    const queryClient = useQueryClient();

    // Queries
    const categoriesQuery = createQuery(() => ({
        queryKey: ["categories"],
        queryFn: InventoryService.getCategories,
    }));

    const suppliersQuery = createQuery(() => ({
        queryKey: ["suppliers"],
        queryFn: InventoryService.getSuppliers,
    }));

    // State (Runes)
    let categories = $derived(categoriesQuery.data || []);
    let suppliers = $derived(suppliersQuery.data || []);
    let loading = $derived(categoriesQuery.isLoading);

    // ============ Category Dialog State ============
    let open = $state(false);
    let editingId = $state<string | null>(null);
    let name = $state("");
    let description = $state("");

    // ============ Variant Dialog State ============
    let variantDialogOpen = $state(false);
    let variantCategoryId = $state<string | null>(null);
    let variantCategoryName = $state("");
    let variantTemplates = $state<any[]>([]);
    let newVariantName = $state("");
    let newVariantSupplierId = $state("");

    // Delete state
    let deleteId = $state<string | null>(null);
    let openDelete = $state(false);

    // ============ Mutations ============
    const createMutationFn = createMutation(() => ({
        mutationFn: InventoryService.createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Kategori dibuat");
            open = false;
            resetCategoryForm();
        },
        onError: () => toast.error("Gagal membuat kategori"),
    }));

    const updateMutationFn = createMutation(() => ({
        mutationFn: (vars: { id: string; data: any }) =>
            InventoryService.updateCategory(vars.id, vars.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Kategori diupdate");
            open = false;
            resetCategoryForm();
        },
        onError: () => toast.error("Gagal update kategori"),
    }));

    const deleteMutationFn = createMutation(() => ({
        mutationFn: InventoryService.deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Kategori dihapus");
        },
        onError: () => toast.error("Gagal menghapus kategori"),
    }));

    const addVariantMutation = createMutation(() => ({
        mutationFn: (vars: {
            categoryId: string;
            name: string;
            supplierId?: string;
        }) =>
            InventoryService.addVariantTemplate(
                vars.categoryId,
                vars.name,
                vars.supplierId,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success(
                "Varian ditambahkan & akan dipropagasi ke semua produk",
            );
            newVariantName = "";
            newVariantSupplierId = "";
            // Refresh local state
            refreshVariantList();
        },
        onError: () => toast.error("Gagal menambah varian"),
    }));

    const removeVariantMutation = createMutation(() => ({
        mutationFn: InventoryService.removeVariantTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Varian dihapus");
            refreshVariantList();
        },
    }));

    // ============ Helper Functions ============
    function resetCategoryForm() {
        name = "";
        description = "";
        editingId = null;
    }

    function refreshVariantList() {
        if (variantCategoryId) {
            const cat = categories.find((c) => c.id === variantCategoryId);
            if (cat) {
                variantTemplates = cat.variantTemplates || [];
            }
        }
    }

    // Auto-sync variant list when categories data changes
    $effect(() => {
        if (variantDialogOpen && variantCategoryId) {
            const cat = categories.find((c) => c.id === variantCategoryId);
            if (cat) {
                variantTemplates = cat.variantTemplates || [];
            }
        }
    });

    function handleEdit(cat: any) {
        editingId = cat.id;
        name = cat.name;
        description = cat.description || "";
        open = true;
    }

    function openVariantDialog(cat: any) {
        variantCategoryId = cat.id;
        variantCategoryName = cat.name;
        variantTemplates = cat.variantTemplates || [];
        newVariantName = "";
        newVariantSupplierId = "";
        variantDialogOpen = true;
    }

    function confirmDelete(id: string) {
        deleteId = id;
        openDelete = true;
    }

    function handleDelete() {
        if (!deleteId) return;
        deleteMutationFn.mutate(deleteId);
        openDelete = false;
        deleteId = null;
    }

    function handleCategorySubmit() {
        if (!name) return toast.error("Nama wajib diisi");

        if (editingId) {
            updateMutationFn.mutate({
                id: editingId,
                data: { name, description },
            });
        } else {
            createMutationFn.mutate({ name, description });
        }
    }

    function handleAddVariant() {
        if (!newVariantName) return toast.error("Nama varian wajib diisi");
        if (!variantCategoryId) return;

        addVariantMutation.mutate({
            categoryId: variantCategoryId,
            name: newVariantName,
            supplierId: newVariantSupplierId || undefined,
        });
    }

    function getSupplierName(supplierId: string | null | undefined): string {
        if (!supplierId) return "-";
        const sup = suppliers.find((s) => s.id === supplierId);
        return sup?.name || "-";
    }
</script>

<div class="space-y-4">
    <div class="flex justify-between items-center">
        <h3 class="text-lg font-medium">Daftar Kategori</h3>
        <Button onclick={() => (open = true)} size="sm">
            <Plus class="h-4 w-4 mr-2" /> Tambah Kategori
        </Button>
    </div>

    <!-- Desktop Table -->
    <div class="rounded-md border hidden md:block">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nama Kategori</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Varian</TableHead>
                    <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#if categories.length === 0}
                    <TableRow>
                        <TableCell
                            colspan={4}
                            class="text-center h-24 text-muted-foreground"
                        >
                            <div
                                class="flex flex-col items-center justify-center gap-2"
                            >
                                <FolderOpen
                                    class="h-8 w-8 text-muted-foreground/50"
                                />
                                <p>Belum ada kategori.</p>
                            </div>
                        </TableCell>
                    </TableRow>
                {:else}
                    {#each categories as cat}
                        <TableRow>
                            <TableCell class="font-medium">
                                <div class="flex items-center gap-2">
                                    <Tag class="h-4 w-4 text-blue-500" />
                                    {cat.name}
                                </div>
                            </TableCell>
                            <TableCell
                                class="text-muted-foreground max-w-[200px] truncate"
                            >
                                {cat.description || "-"}
                            </TableCell>
                            <TableCell>
                                {#if cat.variantTemplates && cat.variantTemplates.length > 0}
                                    <span
                                        class="text-sm text-green-600 font-medium"
                                    >
                                        {cat.variantTemplates.length} varian
                                    </span>
                                {:else}
                                    <span class="text-sm text-muted-foreground"
                                        >-</span
                                    >
                                {/if}
                            </TableCell>
                            <TableCell class="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="text-purple-600"
                                    title="Kelola Varian"
                                    onclick={() => openVariantDialog(cat)}
                                >
                                    <Layers class="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onclick={() => handleEdit(cat)}
                                >
                                    <Pencil class="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="text-red-600"
                                    onclick={() => confirmDelete(cat.id)}
                                >
                                    <Trash2 class="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    {/each}
                {/if}
            </TableBody>
        </Table>
    </div>

    <!-- Mobile Card View -->
    <div class="grid gap-4 md:hidden">
        {#if categories.length === 0}
            <div class="text-center p-8 border rounded-lg bg-muted/20">
                <div class="flex flex-col items-center justify-center gap-2">
                    <FolderOpen class="h-10 w-10 text-muted-foreground/50" />
                    <p class="text-muted-foreground">Belum ada kategori.</p>
                </div>
            </div>
        {:else}
            {#each categories as cat}
                <div class="p-4 rounded-lg border bg-card shadow-sm space-y-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2 font-semibold">
                            <Tag class="h-4 w-4 text-blue-500" />
                            {cat.name}
                        </div>
                        <div class="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                class="h-8 w-8 text-purple-600"
                                onclick={() => openVariantDialog(cat)}
                            >
                                <Layers class="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                class="h-8 w-8"
                                onclick={() => handleEdit(cat)}
                            >
                                <Pencil class="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                class="h-8 w-8 text-red-600"
                                onclick={() => confirmDelete(cat.id)}
                            >
                                <Trash2 class="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                    {#if cat.description}
                        <p class="text-sm text-muted-foreground">
                            {cat.description}
                        </p>
                    {/if}
                    {#if cat.variantTemplates && cat.variantTemplates.length > 0}
                        <p class="text-xs text-green-600">
                            {cat.variantTemplates.length} varian terdefinisi
                        </p>
                    {/if}
                </div>
            {/each}
        {/if}
    </div>

    <!-- ============ Category Dialog (Simplified) ============ -->
    <Dialog bind:open onOpenChange={(isOpen) => !isOpen && resetCategoryForm()}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle
                    >{editingId ? "Edit" : "Tambah"} Kategori</DialogTitle
                >
                <DialogDescription>
                    Masukkan nama dan deskripsi kategori.
                </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <div
                    class="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4"
                >
                    <Label class="text-left md:text-right">Nama</Label>
                    <Input
                        bind:value={name}
                        class="col-span-3"
                        placeholder="Contoh: LCD, Baterai, Casing"
                    />
                </div>
                <div
                    class="grid grid-cols-1 md:grid-cols-4 items-start gap-2 md:gap-4"
                >
                    <Label class="text-left md:text-right pt-2">Deskripsi</Label
                    >
                    <Textarea
                        bind:value={description}
                        class="col-span-3"
                        placeholder="Deskripsi opsional..."
                        rows={2}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button onclick={handleCategorySubmit} disabled={loading}>
                    {loading ? "Menyimpan..." : "Simpan"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <!-- ============ Variant Management Dialog ============ -->
    <Dialog bind:open={variantDialogOpen}>
        <DialogContent class="max-w-lg">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-2">
                    <Layers class="h-5 w-5 text-purple-600" />
                    Kelola Varian - {variantCategoryName}
                </DialogTitle>
                <DialogDescription>
                    Tambah varian dengan supplier untuk kategori ini. Varian
                    akan otomatis dipropagasi ke semua produk.
                </DialogDescription>
            </DialogHeader>

            <!-- Add Variant Form -->
            <div class="space-y-3 py-4">
                <div class="grid grid-cols-1 gap-3">
                    <div>
                        <Label class="text-sm mb-1.5 block">Nama Varian</Label>
                        <Input
                            bind:value={newVariantName}
                            placeholder="Contoh: Original, OLED, Incell"
                        />
                    </div>
                    <div>
                        <Label class="text-sm mb-1.5 block">Supplier</Label>
                        <Combobox
                            items={suppliers.map((s) => ({
                                label: s.name,
                                value: s.id,
                            }))}
                            bind:value={newVariantSupplierId}
                            placeholder="Pilih Supplier"
                        />
                    </div>
                </div>
                <Button
                    class="w-full"
                    onclick={handleAddVariant}
                    disabled={addVariantMutation.isPending}
                >
                    <Plus class="h-4 w-4 mr-2" />
                    {addVariantMutation.isPending
                        ? "Menambahkan..."
                        : "Tambah Varian"}
                </Button>
            </div>

            <!-- Existing Variants List -->
            <div class="border-t pt-4">
                <h4 class="font-medium text-sm mb-3">Varian Terdaftar</h4>
                {#if variantTemplates.length === 0}
                    <div
                        class="text-sm text-muted-foreground italic text-center py-4 border border-dashed rounded bg-muted/20"
                    >
                        Belum ada varian untuk kategori ini.
                    </div>
                {:else}
                    <div class="space-y-2 max-h-[200px] overflow-y-auto">
                        {#each variantTemplates as v}
                            <div
                                class="flex items-center justify-between p-2 bg-secondary/50 rounded-md border"
                            >
                                <div>
                                    <span class="font-medium text-sm"
                                        >{v.name}</span
                                    >
                                    <span
                                        class="text-xs text-muted-foreground ml-2"
                                    >
                                        • {v.supplier?.name || "-"}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="h-7 w-7 text-red-600 hover:text-red-700"
                                    onclick={() =>
                                        removeVariantMutation.mutate(v.id)}
                                    disabled={removeVariantMutation.isPending}
                                >
                                    <Trash2 class="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </DialogContent>
    </Dialog>

    <!-- Delete Confirmation -->
    <AlertDialog.Root bind:open={openDelete}>
        <AlertDialog.Content>
            <AlertDialog.Header>
                <AlertDialog.Title>Hapus Kategori?</AlertDialog.Title>
                <AlertDialog.Description>
                    Aksi ini tidak bisa dibatalkan. Kategori akan dihapus
                    permanen.
                </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
                <AlertDialog.Cancel>Batal</AlertDialog.Cancel>
                <AlertDialog.Action onclick={handleDelete}
                    >Hapus</AlertDialog.Action
                >
            </AlertDialog.Footer>
        </AlertDialog.Content>
    </AlertDialog.Root>
</div>
