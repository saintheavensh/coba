<script lang="ts">
    import {
        createQuery,
        createMutation,
        useQueryClient,
    } from "@tanstack/svelte-query";
    import { InventoryService } from "$lib/services/inventory.service";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import {
        Plus,
        Pencil,
        Trash2,
        FolderTree,
        ChevronRight,
        ChevronDown,
        CornerDownRight,
        MoreHorizontal,
    } from "lucide-svelte";
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
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuLabel,
        DropdownMenuSeparator,
        DropdownMenuTrigger,
    } from "$lib/components/ui/dropdown-menu";
    import { Skeleton } from "$lib/components/ui/skeleton";
    import { toast } from "svelte-sonner";
    import {
        AlertDialog,
        AlertDialogAction,
        AlertDialogCancel,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle,
    } from "$lib/components/ui/alert-dialog";
    import { Badge } from "$lib/components/ui/badge";
    import { SvelteSet } from "svelte/reactivity";

    const queryClient = useQueryClient();

    // Query
    const categoriesQuery = createQuery(() => ({
        queryKey: ["categories"],
        queryFn: InventoryService.getCategories,
    }));

    // Derived Hierarchy Logic
    let categories = $derived(categoriesQuery.data || []);

    // UI State for Tree
    // Using simple array/state since SvelteSet might act up in derived context if not careful,
    // but let's try a simple state object for expanded IDs.
    let expandedMap = $state<Record<string, boolean>>({});

    function toggleExpand(id: string) {
        expandedMap[id] = !expandedMap[id];
    }

    // Default expand all on load? Or collapse? Let's expand root level.
    // Effect to initialize could be added but empty object means collapsed by default (except we want open usually).
    // Let's treat undefined as CLOSED, but maybe we want root open.

    function buildCategoryHierarchy(
        cats: any[],
        parentId: string | null = null,
        level = 0,
        visible = true,
    ): {
        id: string;
        name: string;
        description?: string;
        parentId?: string;
        level: number;
        childrenCount: number;
        hasChildren: boolean;
        visible: boolean;
    }[] {
        const result: any[] = [];
        const children = cats
            .filter((c) => (c.parentId || null) === parentId)
            .sort((a, b) => a.name.localeCompare(b.name));

        for (const child of children) {
            const grandChildren = cats.filter((c) => c.parentId === child.id);
            const childrenCount = grandChildren.length;
            const hasChildren = childrenCount > 0;

            // Check if THIS node is expanded to determine if children are visible
            const isExpanded = expandedMap[child.id] === true; // Default closed

            result.push({
                ...child,
                level,
                childrenCount,
                hasChildren,
                visible, // This item's visibility depends on its parent
            });

            // Recurse
            const subResult = buildCategoryHierarchy(
                cats,
                child.id,
                level + 1,
                visible && isExpanded, // Child is visible only if current is visible AND expanded
            );
            result.push(...subResult);
        }
        return result;
    }

    let hierarchicalList = $derived(buildCategoryHierarchy(categories));
    // The select dropdown needs a flat "visible all" list indent-style, or just all items irrespective of collapse state.
    // Let's build a separate flat list for the dropdown that ALWAYS shows everything so you can move stuff even to collapsed folders.
    let dropdownList = $derived(
        buildCategoryHierarchy(categories, null, 0, true),
    );

    // Mutation
    const createCategoryMutation = createMutation(() => ({
        mutationFn: InventoryService.createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Kategori berhasil dibuat");
            open = false;
            resetForm();
        },
        onError: () => toast.error("Gagal membuat kategori"),
    }));

    const updateMutation = createMutation(() => ({
        mutationFn: (vars: { id: string; data: any }) =>
            InventoryService.updateCategory(vars.id, vars.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Kategori berhasil diupdate");
            open = false;
            resetForm();
        },
        onError: () => toast.error("Gagal update kategori"),
    }));

    const deleteMutation = createMutation(() => ({
        mutationFn: InventoryService.deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Kategori dihapus");
            deleteOpen = false;
        },
        onError: () => toast.error("Gagal menghapus kategori"),
    }));

    // State
    let open = $state(false);
    let editingId = $state<string | null>(null);
    let name = $state("");
    let description = $state("");
    let parentId = $state<string | null>(null);

    let deleteOpen = $state(false);
    let deletingId = $state<string | null>(null);

    function resetForm() {
        editingId = null;
        name = "";
        description = "";
        // parentId = null; // Don't reset parentId immediately if user clicked "Add Child" (handled in logic)
    }

    function handleCreateNew() {
        resetForm();
        parentId = null; // Manual reset
        open = true;
    }

    function handleAddSub(parent: any) {
        resetForm();
        parentId = parent.id;
        // Make sure the parent is expanded so we see the new child
        expandedMap[parent.id] = true;
        open = true;
    }

    function handleEdit(cat: any) {
        editingId = cat.id;
        name = cat.name;
        description = cat.description || "";
        parentId = cat.parentId || null;
        open = true;
    }

    function confirmDelete(id: string) {
        // Prevent deleting if it has children? Ideally backend handles restriction, but UI check is nice.
        const hasChildren = categories.some((c: any) => c.parentId === id);
        if (hasChildren) {
            toast.error(
                "Tidak bisa menghapus kategori induk. Hapus atau pindahkan sub-kategori terlebih dahulu.",
            );
            return;
        }
        deletingId = id;
        deleteOpen = true;
    }

    function handleDelete() {
        if (!deletingId) return;
        deleteMutation.mutate(deletingId);
    }

    function handleSubmit() {
        if (!name) return toast.error("Nama wajib diisi");

        const payload = {
            name,
            description,
            parentId: parentId || undefined,
        };

        if (editingId) {
            if (parentId === editingId) {
                return toast.error(
                    "Kategori tidak bisa menjadi induk bagi dirinya sendiri",
                );
            }
            updateMutation.mutate({ id: editingId, data: payload });
        } else {
            createCategoryMutation.mutate(payload);
        }
    }
</script>

<div class="container mx-auto py-6 space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold tracking-tight">Kategori Produk</h2>
            <p class="text-muted-foreground">
                Kelola struktur kategori untuk inventaris.
            </p>
        </div>
        <Button onclick={handleCreateNew}>
            <Plus class="h-4 w-4 mr-2" /> Kategori Utama Baru
        </Button>
    </div>

    <!-- Dialog (Shared) -->
    <Dialog bind:open onOpenChange={(isOpen) => !isOpen && resetForm()}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    {#if editingId}
                        Edit Kategori
                    {:else if parentId}
                        Sub-Kategori Baru
                    {:else}
                        Buat Kategori Baru
                    {/if}
                </DialogTitle>
                <DialogDescription>
                    {#if parentId}
                        Menambahkan sub-kategori ke dalam: <span
                            class="font-bold text-primary"
                            >{categories.find((c) => c.id === parentId)
                                ?.name}</span
                        >
                    {:else}
                        Buat kategori utama (root) atau pilih induk.
                    {/if}
                </DialogDescription>
            </DialogHeader>

            <div class="grid gap-4 py-4">
                <div class="grid gap-2">
                    <Label>Nama Kategori</Label>
                    <Input bind:value={name} placeholder="Misal: Sparepart" />
                </div>

                <div class="grid gap-2">
                    <Label>Induk Kategori</Label>
                    <div class="relative">
                        <select
                            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            bind:value={parentId}
                        >
                            <option value={null}
                                >-- Tidak Ada (Kategori Utama) --</option
                            >
                            {#each dropdownList as cat}
                                {#if editingId !== cat.id}
                                    <option value={cat.id}>
                                        {@html "&nbsp;".repeat(cat.level * 4)}
                                        {cat.level > 0 ? "↳ " : ""}{cat.name}
                                    </option>
                                {/if}
                            {/each}
                        </select>
                        {#if parentId}
                            <div
                                class="mt-1 text-xs text-muted-foreground flex items-center"
                            >
                                <CornerDownRight class="h-3 w-3 mr-1" />
                                Akan berada di bawah:
                                <b class="ml-1"
                                    >{categories.find((c) => c.id === parentId)
                                        ?.name}</b
                                >
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="grid gap-2">
                    <Label>Deskripsi</Label>
                    <Input
                        bind:value={description}
                        placeholder="Keterangan tambahan..."
                    />
                </div>
            </div>

            <DialogFooter>
                <Button onclick={handleSubmit}>Simpan</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <!-- Hierarchical Table -->
    <div class="rounded-md border bg-card">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead class="w-[50%]">Nama Kategori</TableHead>
                    <TableHead class="hidden md:table-cell">Deskripsi</TableHead
                    >
                    <TableHead class="text-center w-[100px]">Sub-Item</TableHead
                    >
                    <TableHead class="text-right w-[150px]">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#if categoriesQuery.isLoading}
                    {#each Array(3) as _}
                        <TableRow>
                            <TableCell><Skeleton class="h-4 w-40" /></TableCell>
                            <TableCell
                                ><Skeleton class="h-4 w-full" /></TableCell
                            >
                            <TableCell
                                ><Skeleton
                                    class="h-4 w-10 mx-auto"
                                /></TableCell
                            >
                            <TableCell
                                ><Skeleton class="h-8 w-8 ml-auto" /></TableCell
                            >
                        </TableRow>
                    {/each}
                {:else if hierarchicalList.length === 0}
                    <TableRow>
                        <TableCell
                            colspan={4}
                            class="h-24 text-center text-muted-foreground"
                        >
                            Belum ada kategori.
                        </TableCell>
                    </TableRow>
                {:else}
                    {#each hierarchicalList as cat}
                        {#if cat.visible}
                            <TableRow class="hover:bg-muted/50">
                                <TableCell class="font-medium p-2">
                                    <div
                                        class="flex items-center"
                                        style="padding-left: {cat.level *
                                            24}px;"
                                    >
                                        <!-- Collapse Toggle -->
                                        {#if cat.hasChildren}
                                            <button
                                                onclick={() =>
                                                    toggleExpand(cat.id)}
                                                class="mr-1 p-0.5 hover:bg-slate-200 rounded text-muted-foreground transition-colors"
                                            >
                                                {#if expandedMap[cat.id]}
                                                    <ChevronDown
                                                        class="h-4 w-4"
                                                    />
                                                {:else}
                                                    <ChevronRight
                                                        class="h-4 w-4"
                                                    />
                                                {/if}
                                            </button>
                                        {:else}
                                            <div class="w-5 mr-1"></div>
                                            <!-- Spacer for alignment -->
                                        {/if}

                                        <!-- Folder Icon -->
                                        <FolderTree
                                            class={`mr-2 h-4 w-4 ${cat.level === 0 ? "text-primary" : "text-muted-foreground"}`}
                                        />

                                        <span
                                            class={cat.level === 0
                                                ? "font-semibold"
                                                : ""}>{cat.name}</span
                                        >
                                    </div>
                                </TableCell>
                                <TableCell
                                    class="hidden md:table-cell text-muted-foreground text-sm"
                                    >{cat.description || "-"}</TableCell
                                >
                                <TableCell class="text-center">
                                    {#if cat.childrenCount > 0}
                                        <Badge
                                            variant="secondary"
                                            class="text-xs h-5 px-1.5"
                                            >{cat.childrenCount}</Badge
                                        >
                                    {:else}
                                        <span
                                            class="text-muted-foreground text-xs"
                                            >-</span
                                        >
                                    {/if}
                                </TableCell>
                                <TableCell class="text-right p-2">
                                    <div class="flex justify-end gap-1">
                                        <!-- Quick Add Child Action -->
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            class="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                            title="Tambah Sub-Kategori"
                                            onclick={() => handleAddSub(cat)}
                                        >
                                            <Plus class="h-4 w-4" />
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger
                                                class={buttonVariants({
                                                    variant: "ghost",
                                                    size: "icon",
                                                    className: "h-8 w-8",
                                                })}
                                            >
                                                <MoreHorizontal
                                                    class="h-4 w-4"
                                                />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onclick={() =>
                                                        handleEdit(cat)}
                                                >
                                                    <Pencil
                                                        class="mr-2 h-4 w-4"
                                                    /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    class="text-red-600"
                                                    onclick={() =>
                                                        confirmDelete(cat.id)}
                                                >
                                                    <Trash2
                                                        class="mr-2 h-4 w-4"
                                                    /> Hapus
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        {/if}
                    {/each}
                {/if}
            </TableBody>
        </Table>
    </div>

    <AlertDialog bind:open={deleteOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
                <AlertDialogDescription>
                    Tindakan ini tidak dapat dibatalkan. Pastikan tidak ada
                    produk yang menggunakan kategori ini.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction class="bg-red-500" onclick={handleDelete}
                    >Hapus</AlertDialogAction
                >
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</div>
```
