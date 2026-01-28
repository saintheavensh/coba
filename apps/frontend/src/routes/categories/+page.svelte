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
        Layers,
        Search,
        Grid,
        Tag,
        Box,
        Filter,
        Download,
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
    } from "$lib/components/ui/dialog";
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
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
    import Combobox from "$lib/components/ui/combobox.svelte";
    import { fade, fly, slide } from "svelte/transition";
    import { quintOut } from "svelte/easing";

    const queryClient = useQueryClient();

    // Query
    const categoriesQuery = createQuery(() => ({
        queryKey: ["categories"],
        queryFn: InventoryService.getCategories,
    }));

    const suppliersQuery = createQuery(() => ({
        queryKey: ["suppliers"],
        queryFn: InventoryService.getSuppliers,
    }));

    // Derived
    let suppliers = $derived(suppliersQuery.data || []);
    let categories = $derived(categoriesQuery.data || []);

    // Derived Stats
    let totalCategories = $derived(categories.length);
    let rootCategories = $derived(categories.filter((c) => !c.parentId).length);
    let subCategories = $derived(categories.filter((c) => c.parentId).length);
    let mostActiveCategory = $derived(
        categories.length > 0 ? categories[0].name : "-",
    ); // Placeholder logic

    // UI State for Tree
    let expandedMap = $state<Record<string, boolean>>({});

    function toggleExpand(id: string) {
        expandedMap[id] = !expandedMap[id];
    }

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
            const isExpanded = expandedMap[child.id] === true;

            result.push({
                ...child,
                level,
                childrenCount,
                hasChildren,
                visible,
            });

            const subResult = buildCategoryHierarchy(
                cats,
                child.id,
                level + 1,
                visible && isExpanded,
            );
            result.push(...subResult);
        }
        return result;
    }

    let hierarchicalList = $derived(buildCategoryHierarchy(categories));

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

    // Variant Dialog State
    let variantDialogOpen = $state(false);
    let variantCategoryId = $state<string | null>(null);
    let variantCategoryName = $state("");
    let variantTemplates = $state<any[]>([]);
    let newVariantName = $state("");
    let newVariantSupplierId = $state("");

    // Variant Mutations
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
            toast.success("Varian ditambahkan & dipropagasi ke produk");
            newVariantName = "";
            newVariantSupplierId = "";
        },
        onError: () => toast.error("Gagal menambah varian"),
    }));

    const removeVariantMutation = createMutation(() => ({
        mutationFn: InventoryService.removeVariantTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Varian dihapus");
        },
    }));

    // Auto-sync variant list
    $effect(() => {
        if (variantDialogOpen && variantCategoryId) {
            const cat = categories.find((c) => c.id === variantCategoryId);
            if (cat) {
                variantTemplates = (cat as any).variantTemplates || [];
            }
        }
    });

    function openVariantDialog(cat: any) {
        variantCategoryId = cat.id;
        variantCategoryName = cat.name;
        variantTemplates = cat.variantTemplates || [];
        newVariantName = "";
        newVariantSupplierId = "";
        variantDialogOpen = true;
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

    function resetForm() {
        editingId = null;
        name = "";
        description = "";
    }

    function handleCreateNew() {
        resetForm();
        parentId = null;
        open = true;
    }

    function handleAddSub(parent: any) {
        resetForm();
        parentId = parent.id;
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

<div class="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
    <!-- Hero Section -->
    <section
        class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-8 md:p-12 shadow-2xl"
    >
        <div
            class="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"
        ></div>
        <div
            class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
        ></div>

        <div
            class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
            <div class="space-y-2 text-white">
                <div
                    class="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/30"
                >
                    <Tag class="mr-1.5 h-3.5 w-3.5" />
                    Management System
                </div>
                <h1 class="text-3xl md:text-5xl font-bold tracking-tight">
                    Kategori Produk
                </h1>
                <p class="text-indigo-100 max-w-xl text-lg">
                    Kelola struktur dan hierarki inventaris Anda dengan sistem
                    kategori yang fleksibel.
                </p>
            </div>
            <Button
                onclick={handleCreateNew}
                size="lg"
                class="bg-white text-indigo-600 hover:bg-slate-100 shadow-lg border-0 font-semibold transition-all hover:scale-105 active:scale-95"
            >
                <Plus class="h-5 w-5 mr-2" /> Kategori Baru
            </Button>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {#each [{ label: "Total Kategori", value: totalCategories, icon: FolderTree }, { label: "Root Categories", value: rootCategories, icon: Grid }, { label: "Sub Categories", value: subCategories, icon: CornerDownRight }, { label: "Variant Types", value: "3+", icon: Layers }] as stat}
                <div
                    class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-colors"
                >
                    <div class="flex items-center gap-3 mb-2">
                        <div class="p-2 rounded-lg bg-white/20 text-white">
                            <stat.icon class="h-4 w-4" />
                        </div>
                        <span class="text-indigo-100 text-sm font-medium"
                            >{stat.label}</span
                        >
                    </div>
                    <div class="text-2xl font-bold text-white pl-1">
                        {stat.value}
                    </div>
                </div>
            {/each}
        </div>
    </section>

    <!-- Main Content -->
    <div class="grid gap-6">
        <!-- Toolbar -->
        <div
            class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border bg-card shadow-sm"
        >
            <div class="relative w-full sm:w-72">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                />
                <Input
                    placeholder="Cari kategori..."
                    class="pl-9 bg-secondary/30 border-transparent focus:bg-background focus:border-primary transition-all"
                />
            </div>
            <div class="flex items-center gap-2">
                <Button variant="outline" size="sm" class="h-9">
                    <Filter class="h-3.5 w-3.5 mr-2" /> Filter
                </Button>
                <Button variant="outline" size="sm" class="h-9">
                    <Download class="h-3.5 w-3.5 mr-2" /> Export
                </Button>
            </div>
        </div>

        <!-- Hierarchical Table -->
        <div class="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
                <TableHeader class="bg-muted/40">
                    <TableRow
                        class="hover:bg-transparent border-b-slate-200/60 dark:border-slate-700/60"
                    >
                        <TableHead class="w-[50%] py-4 pl-6"
                            >Nama Kategori</TableHead
                        >
                        <TableHead class="hidden md:table-cell"
                            >Deskripsi</TableHead
                        >
                        <TableHead class="text-center w-[100px]"
                            >Sub-Item</TableHead
                        >
                        <TableHead class="text-right w-[150px] pr-6"
                            >Aksi</TableHead
                        >
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {#if categoriesQuery.isLoading}
                        {#each Array(5) as _}
                            <TableRow>
                                <TableCell class="pl-6"
                                    ><Skeleton
                                        class="h-6 w-48 rounded"
                                    /></TableCell
                                >
                                <TableCell
                                    ><Skeleton
                                        class="h-4 w-full rounded"
                                    /></TableCell
                                >
                                <TableCell
                                    ><Skeleton
                                        class="h-4 w-10 mx-auto rounded"
                                    /></TableCell
                                >
                                <TableCell class="pr-6"
                                    ><Skeleton
                                        class="h-8 w-8 ml-auto rounded"
                                    /></TableCell
                                >
                            </TableRow>
                        {/each}
                    {:else if hierarchicalList.length === 0}
                        <TableRow>
                            <TableCell
                                colspan={4}
                                class="h-48 text-center text-muted-foreground"
                            >
                                <div
                                    class="flex flex-col items-center justify-center gap-2"
                                >
                                    <div
                                        class="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2"
                                    >
                                        <FolderTree
                                            class="h-6 w-6 opacity-30"
                                        />
                                    </div>
                                    <p class="font-medium">
                                        Belum ada kategori
                                    </p>
                                    <p class="text-sm">
                                        Mulai dengan menambahkan kategori baru
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    {:else}
                        {#each hierarchicalList as cat (cat.id)}
                            {#if cat.visible}
                                <tr
                                    class="border-b transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted group"
                                    transition:slide={{
                                        duration: 200,
                                        axis: "y",
                                    }}
                                >
                                    <TableCell class="font-medium p-2 pl-6">
                                        <div
                                            class="flex items-center"
                                            style="padding-left: {cat.level *
                                                28}px;"
                                        >
                                            <!-- Collapse Toggle -->
                                            {#if cat.hasChildren}
                                                <button
                                                    onclick={() =>
                                                        toggleExpand(cat.id)}
                                                    class="mr-2 p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-muted-foreground transition-all duration-200"
                                                >
                                                    <ChevronRight
                                                        class={`h-4 w-4 transition-transform duration-200 ${expandedMap[cat.id] ? "rotate-90" : ""}`}
                                                    />
                                                </button>
                                            {:else}
                                                <div class="w-6 mr-2"></div>
                                            {/if}

                                            <!-- Category Icon & Name -->
                                            <div
                                                class="flex items-center gap-3"
                                            >
                                                <div
                                                    class={`p-1.5 rounded-lg ${cat.level === 0 ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}
                                                >
                                                    <FolderTree
                                                        class="h-4 w-4"
                                                    />
                                                </div>
                                                <span
                                                    class={cat.level === 0
                                                        ? "font-semibold text-foreground"
                                                        : "text-muted-foreground group-hover:text-foreground transition-colors"}
                                                >
                                                    {cat.name}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell
                                        class="hidden md:table-cell text-muted-foreground text-sm"
                                    >
                                        {cat.description || "-"}
                                    </TableCell>
                                    <TableCell class="text-center">
                                        {#if cat.childrenCount > 0}
                                            <Badge
                                                variant="secondary"
                                                class="font-normal bg-secondary/50 hover:bg-secondary"
                                            >
                                                {cat.childrenCount} sub
                                            </Badge>
                                        {:else}
                                            <span
                                                class="text-muted-foreground/30 text-xs"
                                                >-</span
                                            >
                                        {/if}
                                    </TableCell>
                                    <TableCell class="text-right p-2 pr-6">
                                        <div
                                            class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                        >
                                            {#if !cat.hasChildren}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    class="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                                    title="Kelola Varian"
                                                    onclick={() =>
                                                        openVariantDialog(cat)}
                                                >
                                                    <Layers class="h-4 w-4" />
                                                </Button>
                                            {/if}

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                class="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                title="Tambah Sub-Kategori"
                                                onclick={() =>
                                                    handleAddSub(cat)}
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
                                                <DropdownMenuContent
                                                    align="end"
                                                    class="w-48"
                                                >
                                                    <DropdownMenuItem
                                                        onclick={() =>
                                                            handleEdit(cat)}
                                                    >
                                                        <Pencil
                                                            class="mr-2 h-4 w-4"
                                                        /> Edit Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        class="text-red-600 focus:text-red-700 focus:bg-red-50"
                                                        onclick={() =>
                                                            confirmDelete(
                                                                cat.id,
                                                            )}
                                                    >
                                                        <Trash2
                                                            class="mr-2 h-4 w-4"
                                                        /> Delete Category
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </tr>
                            {/if}
                        {/each}
                    {/if}
                </TableBody>
            </Table>
        </div>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog bind:open onOpenChange={(isOpen) => !isOpen && resetForm()}>
        <DialogContent class="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle class="text-xl font-semibold">
                    {#if editingId}
                        Edit Kategori
                    {:else if parentId}
                        Sub-Kategori Baru
                    {:else}
                        Buat Kategori Baru
                    {/if}
                </DialogTitle>
                <DialogDescription>
                    {#if parentId && !editingId}
                        Menambahkan sub-kategori ke dalam: <span
                            class="font-bold text-primary"
                            >{categories.find((c) => c.id === parentId)
                                ?.name}</span
                        >
                    {:else if editingId}
                        Perbarui informasi kategori.
                    {:else}
                        Tambahkan kategori utama baru ke inventaris.
                    {/if}
                </DialogDescription>
            </DialogHeader>

            <div class="grid gap-6 py-4">
                {#if parentId && !editingId}
                    <div class="relative p-4 rounded-lg border bg-muted/30">
                        <Label
                            class="text-xs font-semibold uppercase text-muted-foreground absolute -top-2 left-3 bg-background px-1"
                            >Induk</Label
                        >
                        <div class="flex items-center gap-2">
                            <CornerDownRight
                                class="h-4 w-4 text-muted-foreground"
                            />
                            <span class="font-medium text-foreground">
                                {categories.find((c) => c.id === parentId)
                                    ?.name}
                            </span>
                        </div>
                    </div>
                {/if}

                <div class="grid gap-2">
                    <Label for="name">Nama Kategori</Label>
                    <Input
                        id="name"
                        bind:value={name}
                        placeholder="Contoh: Sparepart, Aksesoris..."
                        class="transition-all focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                <div class="grid gap-2">
                    <Label for="desc">Deskripsi</Label>
                    <Input
                        id="desc"
                        bind:value={description}
                        placeholder="Keterangan singkat..."
                        class="transition-all focus:ring-2 focus:ring-primary/20"
                    />
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onclick={() => (open = false)}
                    >Batal</Button
                >
                <Button onclick={handleSubmit}>
                    {#if editingId}
                        Simpan Perubahan
                    {:else}
                        Buat Kategori
                    {/if}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <!-- Alert Dialog -->
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
                <AlertDialogAction
                    class="bg-red-600 hover:bg-red-700"
                    onclick={handleDelete}>Ya, Hapus</AlertDialogAction
                >
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <!-- Variant Management Dialog -->
    <Dialog bind:open={variantDialogOpen}>
        <DialogContent class="max-w-lg">
            <DialogHeader>
                <div class="flex items-center gap-3 mb-2">
                    <div class="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        <Layers class="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle>Kelola Varian</DialogTitle>
                        <DialogDescription class="mt-1.5">
                            Kategori: <span class="font-medium text-foreground"
                                >{variantCategoryName}</span
                            >
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            <div class="space-y-6">
                <!-- Add Form -->
                <div class="p-4 bg-muted/30 rounded-xl border space-y-4">
                    <h4 class="text-sm font-semibold flex items-center gap-2">
                        <Plus class="h-3.5 w-3.5" /> Tambah Varian Baru
                    </h4>
                    <div class="grid grid-cols-1 gap-3">
                        <div>
                            <Label
                                class="text-xs mb-1.5 block text-muted-foreground"
                                >Nama Varian</Label
                            >
                            <Input
                                bind:value={newVariantName}
                                placeholder="Contoh: Original, OLED, Incell"
                                class="h-9 bg-background"
                            />
                        </div>
                        <div>
                            <Label
                                class="text-xs mb-1.5 block text-muted-foreground"
                                >Supplier (Opsional)</Label
                            >
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
                        class="w-full h-9"
                        onclick={handleAddVariant}
                        disabled={addVariantMutation.isPending}
                    >
                        {addVariantMutation.isPending
                            ? "Menambahkan..."
                            : "Tambah Varian"}
                    </Button>
                </div>

                <!-- List -->
                <div>
                    <h4
                        class="text-sm font-medium mb-3 flex items-center justify-between"
                    >
                        Daftar Varian
                        <Badge variant="outline" class="font-normal text-xs"
                            >{variantTemplates.length}</Badge
                        >
                    </h4>

                    {#if variantTemplates.length === 0}
                        <div
                            class="text-sm text-center py-8 border-2 border-dashed rounded-xl bg-muted/10"
                        >
                            <p class="text-muted-foreground">
                                Belum ada varian terdaftar.
                            </p>
                        </div>
                    {:else}
                        <div
                            class="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar"
                        >
                            {#each variantTemplates as v}
                                <div
                                    class="flex items-center justify-between p-3 bg-card border rounded-lg shadow-sm hover:border-primary/50 transition-colors group"
                                >
                                    <div class="flex flex-col gap-0.5">
                                        <span class="font-medium text-sm"
                                            >{v.name}</span
                                        >
                                        {#if v.supplier}
                                            <span
                                                class="text-xs text-muted-foreground flex items-center gap-1"
                                            >
                                                <Box class="h-3 w-3" />
                                                {v.supplier.name}
                                            </span>
                                        {/if}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        class="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                        onclick={() =>
                                            removeVariantMutation.mutate(v.id)}
                                        disabled={removeVariantMutation.isPending}
                                    >
                                        <Trash2 class="h-4 w-4" />
                                    </Button>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        </DialogContent>
    </Dialog>
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: hsl(var(--muted-foreground) / 0.3);
        border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: hsl(var(--muted-foreground) / 0.5);
    }
</style>
