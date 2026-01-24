<script lang="ts">
    import { InventoryService } from "$lib/services/inventory.service";
    import ImageUpload from "$lib/components/custom/image-upload.svelte";
    import { Input } from "$lib/components/ui/input";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import { Label } from "$lib/components/ui/label";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/components/ui/dialog";
    import {
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
    } from "$lib/components/ui/tabs";
    import { Badge } from "$lib/components/ui/badge";
    import {
        Loader2,
        Search,
        Filter,
        Smartphone,
        Check,
        Trash2,
        Plus,
        Tag,
    } from "lucide-svelte";
    import {
        createQuery,
        createMutation,
        useQueryClient,
    } from "@tanstack/svelte-query";
    import { toast } from "svelte-sonner";
    import { cn } from "$lib/utils";

    let {
        open = $bindable(false),
        editData = null,
        onClose,
    } = $props<{
        open: boolean;
        editData?: any;
        onClose?: () => void;
    }>();

    const queryClient = useQueryClient();

    // State (Using Runes)
    let name = $state("");
    let code = $state("");
    let categoryId = $state("");
    let minStock = $state(5);
    let image = $state("");
    let compatibility = $state<string[]>([]); // Device IDs

    // Queries
    const categoriesQuery = createQuery(() => ({
        queryKey: ["categories"],
        queryFn: InventoryService.getCategories,
    }));

    const devicesQuery = createQuery(() => ({
        queryKey: ["devices"],
        queryFn: () => InventoryService.getDevices(),
    }));

    // Variant Logic
    let activeTab = $state("general");

    const variantsQuery = createQuery(() => ({
        queryKey: ["variants", editData?.id],
        queryFn: () =>
            editData ? InventoryService.getProductVariants(editData.id) : [],
        enabled: !!editData,
    }));

    let variants = $derived(variantsQuery.data || []);
    let newVariantName = $state("");
    let newVariantPrice = $state(0);

    const createVariantMutation = createMutation(() => ({
        mutationFn: InventoryService.createVariant,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["variants"] });
            newVariantName = "";
            newVariantPrice = 0;
            toast.success("Varian ditambahkan");
        },
        onError: () => toast.error("Gagal menambah varian"),
    }));

    const deleteVariantMutation = createMutation(() => ({
        mutationFn: InventoryService.deleteVariant,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["variants"] });
            toast.success("Varian dihapus");
        },
    }));

    function handleAddVariant() {
        if (!editData) return;
        if (!newVariantName) return toast.error("Nama varian wajib diisi");
        createVariantMutation.mutate({
            productId: editData.id,
            name: newVariantName,
            defaultPrice: newVariantPrice,
        });
    }

    // Helpers
    function buildCategoryHierarchy(
        cats: any[],
        parentId: string | null = null,
        level = 0,
    ): {
        id: string;
        name: string;
        level: number;
        variantTemplates?: {
            name: string;
            supplier?: { name: string } | null;
        }[];
    }[] {
        const result: {
            id: string;
            name: string;
            level: number;
            variantTemplates?: {
                name: string;
                supplier?: { name: string } | null;
            }[];
        }[] = [];
        const children = cats
            .filter((c) => (c.parentId || null) === parentId)
            .sort((a, b) => a.name.localeCompare(b.name));

        for (const child of children) {
            result.push({
                id: child.id,
                name: child.name,
                level: level,
                variantTemplates: child.variantTemplates,
            });
            const subResult = buildCategoryHierarchy(cats, child.id, level + 1);
            result.push(...subResult);
        }
        return result;
    }

    let categories = $derived(categoriesQuery.data || []);
    let hierarchicalCategories = $derived(buildCategoryHierarchy(categories));

    // Derived Device List with Optimization
    let deviceSearch = $state("");
    let devices = $derived(devicesQuery.data || []);
    let filteredDevices = $derived(
        devices.filter((d: any) => {
            if (!deviceSearch) return true;
            const term = deviceSearch.toLowerCase();
            return (
                d.brand.toLowerCase().includes(term) ||
                d.model.toLowerCase().includes(term) ||
                (d.code && d.code.toLowerCase().includes(term))
            );
        }),
    );
    // Limit visible devices for performance if search is empty
    let visibleDevices = $derived(
        !deviceSearch ? filteredDevices.slice(0, 50) : filteredDevices,
    );

    // Effect to populate form on open/editData change
    $effect(() => {
        if (open) {
            if (editData) {
                name = editData.name;
                code = editData.code || "";
                categoryId = editData.categoryId || "";
                minStock = editData.minStock || 5;
                image = editData.image || "";

                // Fetch compatibility if not present (usually lazy loaded)
                InventoryService.getProduct(editData.id).then((detail) => {
                    compatibility = (detail.compatibility || []).map(
                        (d: any) => d.id,
                    );
                });
            } else {
                reset();
            }
        }
    });

    function reset() {
        name = "";
        code = "";
        categoryId = "";
        minStock = 5;
        image = "";
        compatibility = [];
        deviceSearch = "";
        activeTab = "general";
        newVariantName = "";
    }

    // Mutations
    const createProductMutation = createMutation(() => ({
        mutationFn: InventoryService.createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Produk berhasil dibuat! Stok awal 0.");
            open = false;
            reset();
            if (onClose) onClose();
        },
        onError: () => toast.error("Gagal menyimpan produk"),
    }));

    const updateProductMutation = createMutation(() => ({
        mutationFn: (vars: { id: string; data: any }) =>
            InventoryService.updateProduct(vars.id, vars.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
            toast.success("Produk berhasil diupdate!");
            open = false;
            reset();
            if (onClose) onClose();
        },
        onError: () => toast.error("Gagal update produk"),
    }));

    function handleSubmit() {
        if (!name) {
            toast.error("Nama produk wajib diisi");
            return;
        }

        const payload = {
            name,
            code: code || undefined,
            categoryId: categoryId || undefined,
            minStock: Number(minStock) || 5,
            image: image || undefined,
            compatibility,
        };

        if (editData) {
            updateProductMutation.mutate({ id: editData.id, data: payload });
        } else {
            createProductMutation.mutate(payload);
        }
    }

    function generateCode() {
        if (!categoryId) {
            toast.error("Pilih kategori terlebih dahulu untuk generate kode");
            return;
        }
        const cat = categories.find((c: any) => c.id === categoryId);
        const prefix = cat
            ? cat.name
                  .replace(/[^a-zA-Z]/g, "")
                  .substring(0, 3)
                  .toUpperCase()
            : "GEN";
        const random = Math.floor(1000 + Math.random() * 9000);
        code = `${prefix}${random}`;
    }

    let isSubmitting = $derived(
        createProductMutation.isPending || updateProductMutation.isPending,
    );
</script>

<Dialog bind:open onOpenChange={(v) => !v && reset()}>
    <DialogContent
        class="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0"
    >
        <DialogHeader
            class="px-6 py-4 border-b sticky top-0 z-10 bg-background/95 backdrop-blur-sm"
        >
            <DialogTitle class="text-xl font-bold tracking-tight text-primary">
                {editData ? "Edit Master Produk" : "Buat Master Produk Baru"}
            </DialogTitle>
            <DialogDescription>
                Buat template produk. Stok masuk dilakukan melalui menu <b
                    >Pembelian</b
                >.
            </DialogDescription>
        </DialogHeader>

        <Tabs
            bind:value={activeTab}
            class="flex-1 flex flex-col overflow-hidden"
        >
            <div class="px-6 py-2 border-b bg-muted/50">
                <TabsList class="grid w-full grid-cols-2">
                    <TabsTrigger value="general">Informasi Umum</TabsTrigger>
                    <TabsTrigger value="variants" disabled={!editData}
                        >Varian Produk</TabsTrigger
                    >
                </TabsList>
            </div>
            <div class="flex-1 overflow-y-auto p-6">
                <TabsContent value="general" class="space-y-6 mt-0">
                    <!-- Kategori & Code Row -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <Label class="text-sm font-medium"
                                >Kategori Produk <span class="text-destructive"
                                    >*</span
                                ></Label
                            >
                            <div class="relative">
                                {#if categoriesQuery.isLoading}
                                    <div
                                        class="h-10 w-full animate-pulse rounded-md bg-secondary"
                                    ></div>
                                {:else}
                                    <select
                                        bind:value={categoryId}
                                        class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value=""
                                            >-- Pilih Kategori --</option
                                        >
                                        {#each hierarchicalCategories as cat}
                                            <option value={cat.id}>
                                                {@html "&nbsp;".repeat(
                                                    cat.level * 4,
                                                )}
                                                {cat.level > 0
                                                    ? "↳ "
                                                    : ""}{cat.name}
                                            </option>
                                        {/each}
                                    </select>
                                {/if}
                            </div>
                        </div>

                        <div class="space-y-2">
                            <Label class="text-sm font-medium"
                                >Kode SKU / Barcode</Label
                            >
                            <div class="flex gap-2">
                                <div class="relative flex-1">
                                    <Input
                                        bind:value={code}
                                        placeholder="Scan atau Auto-generate"
                                        class="pl-9 font-mono"
                                    />
                                    <Smartphone
                                        class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onclick={generateCode}
                                    title="Generate Otomatis"
                                    disabled={!categoryId}
                                >
                                    <Filter class="h-4 w-4" />
                                </Button>
                            </div>
                            <p class="text-[10px] text-muted-foreground">
                                Otomatis / Scan
                            </p>
                        </div>
                    </div>

                    <!-- Name -->
                    <div class="space-y-2">
                        <Label class="text-sm font-medium"
                            >Nama Produk <span class="text-destructive">*</span
                            ></Label
                        >
                        <Input
                            bind:value={name}
                            placeholder="Nama Produk (Mis: LCD Samsung)"
                            class="text-base"
                        />
                    </div>

                    <!-- Details Row -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <Label class="text-sm font-medium"
                                >Minimum Stok (Alert)</Label
                            >
                            <Input
                                type="number"
                                bind:value={minStock}
                                min="0"
                            />
                            <p class="text-[10px] text-muted-foreground">
                                Peringatan saat stok di bawah jumlah ini.
                            </p>
                        </div>

                        <div class="space-y-2">
                            <Label class="text-sm font-medium"
                                >Gambar Produk</Label
                            >
                            <div class="border rounded-md p-2 bg-muted/10">
                                <div class="w-full h-32">
                                    <ImageUpload bind:value={image} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Compatibility Section - OPTIMIZED -->
                    <div class="space-y-3 pt-2">
                        <div class="flex items-center justify-between">
                            <Label class="text-sm font-medium"
                                >Kompatibilitas Device ({compatibility.length})</Label
                            >
                            <Badge
                                variant="outline"
                                class="font-normal bg-primary/5"
                            >
                                {compatibility.length} terpilih
                            </Badge>
                        </div>

                        <div
                            class="border rounded-lg overflow-hidden bg-card text-card-foreground shadow-sm"
                        >
                            <div
                                class="p-2 border-b bg-muted/20 flex gap-2 items-center"
                            >
                                <div class="relative flex-1">
                                    <Search
                                        class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                                    />
                                    <Input
                                        bind:value={deviceSearch}
                                        placeholder="Cari Brand, Model, atau Kode Device..."
                                        class="pl-8 h-9 border-none focus-visible:ring-0 bg-transparent shadow-none"
                                    />
                                </div>
                                {#if compatibility.length > 0}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        class="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onclick={() => (compatibility = [])}
                                    >
                                        Reset
                                    </Button>
                                {/if}
                            </div>

                            <div
                                class="h-[200px] overflow-y-auto p-1 bg-white dark:bg-zinc-950/50"
                            >
                                {#if devicesQuery.isLoading}
                                    <div
                                        class="flex items-center justify-center h-full text-muted-foreground gap-2"
                                    >
                                        <Loader2 class="h-4 w-4 animate-spin" />
                                        Memuat data device...
                                    </div>
                                {:else if filteredDevices.length === 0}
                                    <div
                                        class="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center"
                                    >
                                        <Smartphone
                                            class="h-8 w-8 mb-2 opacity-20"
                                        />
                                        <span class="text-sm"
                                            >Tidak ada device yang cocok dengan
                                            "{deviceSearch}"</span
                                        >
                                    </div>
                                {:else}
                                    <div
                                        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1"
                                    >
                                        {#each visibleDevices as device (device.id)}
                                            {@const isSelected =
                                                compatibility.includes(
                                                    device.id,
                                                )}
                                            <label
                                                class={cn(
                                                    "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all border select-none group",
                                                    isSelected
                                                        ? "bg-primary/5 border-primary/20"
                                                        : "border-transparent hover:bg-muted",
                                                )}
                                            >
                                                <div
                                                    class="relative flex items-center justify-center"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        class="peer sr-only"
                                                        checked={isSelected}
                                                        onchange={(e) => {
                                                            if (
                                                                e.currentTarget
                                                                    .checked
                                                            ) {
                                                                compatibility =
                                                                    [
                                                                        ...compatibility,
                                                                        device.id,
                                                                    ];
                                                            } else {
                                                                compatibility =
                                                                    compatibility.filter(
                                                                        (id) =>
                                                                            id !==
                                                                            device.id,
                                                                    );
                                                            }
                                                        }}
                                                    />
                                                    <div
                                                        class={cn(
                                                            "h-4 w-4 rounded border border-muted-foreground/30 shadow-sm flex items-center justify-center transition-colors bg-background",
                                                            isSelected
                                                                ? "bg-primary border-primary text-primary-foreground"
                                                                : "group-hover:border-primary/50",
                                                        )}
                                                    >
                                                        {#if isSelected}<Check
                                                                class="h-3 w-3 stroke-[3px]"
                                                            />{/if}
                                                    </div>
                                                </div>
                                                <div
                                                    class="flex-1 min-w-0 flex flex-col justify-center"
                                                >
                                                    <div
                                                        class="text-sm font-medium leading-none truncate text-foreground/90"
                                                    >
                                                        {device.brand}
                                                        {device.model}
                                                    </div>
                                                    {#if device.code}
                                                        <div
                                                            class="text-[10px] text-muted-foreground truncate font-mono mt-0.5 opacity-70"
                                                        >
                                                            {device.code}
                                                        </div>
                                                    {/if}
                                                </div>
                                            </label>
                                        {/each}
                                    </div>
                                    {#if !deviceSearch && devices.length > 50}
                                        <div
                                            class="text-xs text-center text-muted-foreground py-2 italic border-t mt-1 bg-muted/10"
                                        >
                                            + {devices.length - 50} device lainnya
                                            disembunyikan. Cari untuk menampilkan.
                                        </div>
                                    {/if}
                                {/if}
                            </div>
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="variants" class="space-y-4 mt-0">
                    {@const selectedCat = hierarchicalCategories.find(
                        (c) => c.id === categoryId,
                    )}

                    {#if selectedCat && selectedCat.variantTemplates && selectedCat.variantTemplates.length > 0}
                        <!-- Category Variants (Read-only) -->
                        <div
                            class="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm mb-4"
                        >
                            <p class="font-semibold mb-1">
                                ℹ️ Varian Kategori "{selectedCat.name}"
                            </p>
                            <p class="text-xs opacity-80">
                                Varian berikut didefinisikan di kategori dan
                                otomatis berlaku untuk produk ini. Untuk
                                mengelola varian, kunjungi halaman Kategori.
                            </p>
                        </div>

                        <div class="space-y-2">
                            {#each selectedCat.variantTemplates as v}
                                <div
                                    class="flex items-center justify-between p-3 border rounded-lg bg-card"
                                >
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center"
                                        >
                                            <Tag
                                                class="h-4 w-4 text-purple-600"
                                            />
                                        </div>
                                        <div>
                                            <div class="font-medium">
                                                {v.name}
                                            </div>
                                            <div
                                                class="text-xs text-muted-foreground"
                                            >
                                                Supplier: {v.supplier?.name ||
                                                    "-"}
                                            </div>
                                        </div>
                                    </div>
                                    <span
                                        class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                                    >
                                        Dari Kategori
                                    </span>
                                </div>
                            {/each}
                        </div>

                        <div class="text-center mt-4">
                            <a
                                href="/categories"
                                class="text-sm text-primary hover:underline"
                            >
                                Kelola varian di halaman Kategori →
                            </a>
                        </div>
                    {:else}
                        <!-- No Variants - Empty State -->
                        <div
                            class="text-center py-12 border rounded-lg border-dashed bg-muted/20"
                        >
                            <Tag
                                class="h-12 w-12 mx-auto text-muted-foreground/50 mb-4"
                            />
                            <h3 class="font-semibold text-lg mb-2">
                                Belum Ada Varian
                            </h3>
                            <p
                                class="text-sm text-muted-foreground max-w-sm mx-auto mb-4"
                            >
                                Varian produk didefinisikan di tingkat kategori
                                dan otomatis berlaku untuk semua produk dalam
                                kategori tersebut.
                            </p>
                            <a
                                href="/categories"
                                class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                            >
                                <Tag class="h-4 w-4" />
                                Kelola Varian di Kategori
                            </a>
                        </div>
                    {/if}
                </TabsContent>
            </div>
        </Tabs>

        <DialogFooter
            class="px-6 py-4 border-t flex items-center justify-between sm:justify-end gap-3 sticky bottom-0 z-10 bg-background/95 backdrop-blur-sm"
        >
            <Button variant="outline" onclick={() => (open = false)}
                >Batal</Button
            >
            <Button
                onclick={handleSubmit}
                disabled={isSubmitting}
                class="min-w-[120px]"
            >
                {#if isSubmitting}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    {editData ? "Menyimpan" : "Simpan"}
                {:else}
                    {editData ? "Simpan Perubahan" : "Simpan Produk"}
                {/if}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
