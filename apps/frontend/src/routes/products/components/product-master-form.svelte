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
    let manualNameParts = $state<string[]>([]); // Parts not matching devices
    let nameSuggestions = $state<{ device: any; matched: string }[]>([]);
    let deviceSearchQuery = $state(""); // Search within suggestions dropdown

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

    // Derived Device List
    let devices = $derived(devicesQuery.data || []);

    // Selected devices for display
    let selectedDevices = $derived(
        devices.filter((d: any) => compatibility.includes(d.id)),
    );

    // Helper: Build product name from selected compatibility devices
    function buildNameFromCompatibility(): string {
        const selected = devices.filter((d: any) =>
            compatibility.includes(d.id),
        );
        if (selected.length === 0) return manualNameParts.join(" / ");

        // Group by brand
        const byBrand: Record<string, any[]> = {};
        for (const d of selected) {
            if (!byBrand[d.brand]) byBrand[d.brand] = [];
            byBrand[d.brand].push(d);
        }

        // Build: "Oppo A3s / A5s / A31" then "Realme 2"
        const parts: string[] = [];
        for (const [brand, models] of Object.entries(byBrand).sort()) {
            // Sort models alphabetically
            models.sort((a, b) => a.model.localeCompare(b.model));
            // First with brand, rest model only
            parts.push(`${brand} ${models[0].model}`);
            for (let i = 1; i < models.length; i++) {
                parts.push(models[i].model);
            }
        }

        // Append manual parts
        parts.push(...manualNameParts);

        return parts.join(" / ");
    }

    // Helper: Update name when compatibility changes
    function updateNameFromCompatibility() {
        name = buildNameFromCompatibility();
    }

    // Helper: Parse name and find matching devices for suggestions
    function parseNameForSuggestions(inputName: string) {
        const parts = inputName.split(/\s*\/\s*/);
        const suggestions: { device: any; matched: string }[] = [];
        const newManualParts: string[] = [];
        let currentBrand = "";

        for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed) continue;

            // Try to find exact match with brand + model
            let match = devices.find((d: any) => {
                const fullName = `${d.brand} ${d.model}`.toLowerCase();
                return fullName === trimmed.toLowerCase();
            });

            // If no exact match, try model-only match with current brand context
            if (!match && currentBrand) {
                match = devices.find((d: any) => {
                    return (
                        d.brand.toLowerCase() === currentBrand.toLowerCase() &&
                        d.model.toLowerCase() === trimmed.toLowerCase()
                    );
                });
            }

            // If still no match, try model-only match across all devices
            if (!match) {
                match = devices.find(
                    (d: any) => d.model.toLowerCase() === trimmed.toLowerCase(),
                );
            }

            if (match) {
                currentBrand = match.brand; // Set context for next parts
                if (!compatibility.includes(match.id)) {
                    suggestions.push({ device: match, matched: trimmed });
                }
            } else {
                // No match - this is a manual part
                newManualParts.push(trimmed);
            }
        }

        nameSuggestions = suggestions;
        manualNameParts = newManualParts;
    }

    // Handle name input change
    function handleNameChange(newName: string) {
        name = newName;
        parseNameForSuggestions(newName);
    }

    // Handle suggestion click - add device to compatibility
    function applySuggestion(suggestion: { device: any; matched: string }) {
        compatibility = [...compatibility, suggestion.device.id];
        nameSuggestions = nameSuggestions.filter(
            (s) => s.device.id !== suggestion.device.id,
        );
        deviceSearchQuery = ""; // Reset search when adding
    }

    // Apply all suggestions at once (GO button)
    function applyAllSuggestions() {
        const deviceIds = filteredSuggestions.map((s) => s.device.id);
        compatibility = [...compatibility, ...deviceIds];
        nameSuggestions = nameSuggestions.filter(
            (s) => !deviceIds.includes(s.device.id),
        );
        deviceSearchQuery = "";
    }

    // Filter suggestions based on search query
    let filteredSuggestions = $derived(
        deviceSearchQuery.trim()
            ? nameSuggestions.filter((s) => {
                  const term = deviceSearchQuery.trim().toLowerCase();
                  return (
                      s.device.brand.toLowerCase().includes(term) ||
                      s.device.model.toLowerCase().includes(term) ||
                      (s.device.code &&
                          s.device.code.toLowerCase().includes(term))
                  );
              })
            : nameSuggestions,
    );

    // Remove device from compatibility
    function removeDevice(deviceId: string) {
        compatibility = compatibility.filter((id) => id !== deviceId);
        updateNameFromCompatibility();
    }

    // Remove manual name part
    function removeManualPart(index: number) {
        manualNameParts = manualNameParts.filter((_, i) => i !== index);
        updateNameFromCompatibility();
    }

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
        manualNameParts = [];
        nameSuggestions = [];
        deviceSearchQuery = "";
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

                    <!-- Name with Autocomplete Device Suggestions -->
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <Label class="text-sm font-medium"
                                >Nama Produk <span class="text-destructive"
                                    >*</span
                                ></Label
                            >
                            {#if compatibility.length > 0 || manualNameParts.length > 0}
                                <Badge
                                    variant="secondary"
                                    class="font-normal text-xs"
                                >
                                    <Smartphone class="h-3 w-3 mr-1" />
                                    {compatibility.length} device{#if manualNameParts.length > 0}
                                        + {manualNameParts.length} manual{/if}
                                </Badge>
                            {/if}
                        </div>

                        <Input
                            value={name}
                            oninput={(e) =>
                                handleNameChange(e.currentTarget.value)}
                            placeholder="Ketik nama device (Mis: Oppo A3s / A5s / Realme 2)"
                            class="text-base"
                        />

                        <!-- Device Suggestions Dropdown -->
                        {#if nameSuggestions.length > 0}
                            <div
                                class="border rounded-lg shadow-lg bg-card overflow-hidden"
                            >
                                <!-- Search Header -->
                                <div
                                    class="flex items-center gap-2 p-2 border-b bg-muted/30"
                                >
                                    <div class="relative flex-1">
                                        <Search
                                            class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                                        />
                                        <Input
                                            value={deviceSearchQuery}
                                            oninput={(e) =>
                                                (deviceSearchQuery =
                                                    e.currentTarget.value)}
                                            placeholder="Cari device..."
                                            class="pl-8 h-9 text-sm"
                                        />
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        class="h-9 px-3 text-xs"
                                        onclick={() => applyAllSuggestions()}
                                    >
                                        GO
                                    </Button>
                                </div>

                                <!-- Devices Header -->
                                <div class="px-3 py-2 bg-muted/20 border-b">
                                    <span
                                        class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                                        >DEVICES</span
                                    >
                                </div>

                                <!-- Device List -->
                                <div class="max-h-[250px] overflow-y-auto">
                                    {#each filteredSuggestions as suggestion, index}
                                        <button
                                            type="button"
                                            class="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 transition-colors border-b border-muted/30 last:border-b-0 text-left"
                                            onclick={() =>
                                                applySuggestion(suggestion)}
                                        >
                                            <!-- Device Image -->
                                            <div
                                                class="w-12 h-12 rounded-md bg-muted/30 flex items-center justify-center overflow-hidden shrink-0"
                                            >
                                                {#if suggestion.device.image}
                                                    <img
                                                        src={suggestion.device
                                                            .image}
                                                        alt="{suggestion.device
                                                            .brand} {suggestion
                                                            .device.model}"
                                                        class="w-full h-full object-contain"
                                                    />
                                                {:else}
                                                    <Smartphone
                                                        class="h-6 w-6 text-muted-foreground/50"
                                                    />
                                                {/if}
                                            </div>

                                            <!-- Device Info -->
                                            <div class="flex-1 min-w-0">
                                                <div
                                                    class="font-medium text-sm text-foreground"
                                                >
                                                    {suggestion.device.brand}
                                                    {suggestion.device.model}
                                                </div>
                                                {#if suggestion.device.code}
                                                    <div
                                                        class="text-xs text-muted-foreground truncate"
                                                    >
                                                        {suggestion.device.code}
                                                    </div>
                                                {/if}
                                            </div>

                                            <!-- Add Icon -->
                                            <Plus
                                                class="h-4 w-4 text-primary shrink-0"
                                            />
                                        </button>
                                    {/each}

                                    {#if filteredSuggestions.length === 0}
                                        <div
                                            class="p-4 text-center text-sm text-muted-foreground"
                                        >
                                            Tidak ada device yang cocok
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/if}

                        <!-- Selected Devices -->
                        {#if compatibility.length > 0 || manualNameParts.length > 0}
                            <div class="flex flex-wrap gap-2">
                                {#each selectedDevices as device (device.id)}
                                    <span
                                        class="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm bg-primary/10 text-primary rounded-full border border-primary/20"
                                    >
                                        <Smartphone class="h-3.5 w-3.5" />
                                        {device.brand}
                                        {device.model}
                                        <button
                                            type="button"
                                            class="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                            onclick={() =>
                                                removeDevice(device.id)}
                                            aria-label="Hapus {device.brand} {device.model}"
                                        >
                                            <svg
                                                class="h-3 w-3"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="2"
                                            >
                                                <path
                                                    d="M18 6L6 18M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    </span>
                                {/each}
                                {#each manualNameParts as part, i}
                                    <span
                                        class="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm bg-muted text-muted-foreground rounded-full border"
                                    >
                                        🔤 {part}
                                        <button
                                            type="button"
                                            class="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                                            onclick={() => removeManualPart(i)}
                                            aria-label="Hapus {part}"
                                        >
                                            <svg
                                                class="h-3 w-3"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="2"
                                            >
                                                <path
                                                    d="M18 6L6 18M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    </span>
                                {/each}
                            </div>
                        {/if}

                        <p class="text-[10px] text-muted-foreground">
                            Ketik nama device dipisahkan dengan " / ". Saran
                            akan muncul untuk device yang cocok.
                        </p>
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
