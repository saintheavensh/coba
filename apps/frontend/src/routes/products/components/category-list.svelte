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
    import { Pencil, Trash2, Plus, FolderOpen, Tag } from "lucide-svelte";
    import { toast } from "svelte-sonner";

    // Query Client
    const client = useQueryClient();
    // Helper to use in callbacks (since useQueryClient returns the instance)
    const queryClient = client;

    // Queries
    const categoriesQuery = createQuery(() => ({
        queryKey: ["categories"],
        queryFn: InventoryService.getCategories,
    }));

    // Mutations
    const createMutationFn = createMutation(() => ({
        mutationFn: InventoryService.createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Kategori dibuat");
            open = false;
            reset();
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
            reset();
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

    // State (Runes)
    let categories = $derived(categoriesQuery.data || []);
    let loading = $derived(categoriesQuery.isLoading);

    let open = $state(false);
    let editingId = $state<string | null>(null);

    // Form (Runes)
    let name = $state("");
    let description = $state("");

    // Import api for direct calls inside inline mutations if service missing (adding TODOs to fix service later)

    function reset() {
        name = "";
        description = "";
        editingId = null;
    }

    let deleteId = $state<string | null>(null);
    let openDelete = $state(false);

    function handleEdit(cat: any) {
        editingId = cat.id;
        name = cat.name;
        description = cat.description || "";
        open = true;
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

    function handleSubmit() {
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
</script>

<div class="space-y-4">
    <div class="flex justify-between items-center">
        <h3 class="text-lg font-medium">Daftar Kategori</h3>
        <Button onclick={() => (open = true)} size="sm">
            <Plus class="h-4 w-4 mr-2" /> Tambah Kategori
        </Button>
    </div>

    <div class="rounded-md border hidden md:block">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nama Kategori</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#if categories.length === 0}
                    <TableRow>
                        <TableCell
                            colspan={3}
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
                            <TableCell>{cat.description || "-"}</TableCell>
                            <TableCell class="text-right">
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
                </div>
            {/each}
        {/if}
    </div>

    <Dialog bind:open onOpenChange={(isOpen) => !isOpen && reset()}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle
                    >{editingId ? "Edit" : "Tambah"} Kategori</DialogTitle
                >
                <DialogDescription
                    >Kelola master data kategori produk.</DialogDescription
                >
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <div
                    class="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4"
                >
                    <Label class="text-left md:text-right">Nama</Label>
                    <Input
                        bind:value={name}
                        class="col-span-3"
                        placeholder="Contoh: Handphone"
                    />
                </div>
                <div
                    class="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4"
                >
                    <Label class="text-left md:text-right">Deskripsi</Label>
                    <Input
                        bind:value={description}
                        class="col-span-3"
                        placeholder="Opsional"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button onclick={handleSubmit} disabled={loading}>
                    {loading ? "Menyimpan..." : "Simpan"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</div>
