<script lang="ts">
    import {
        createQuery,
        createMutation,
        useQueryClient,
    } from "@tanstack/svelte-query";
    import { InventoryService } from "$lib/services/inventory.service";
    import { BrandsService } from "$lib/services/brands.service";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import {
        Plus,
        Pencil,
        Trash2,
        Smartphone,
        Search,
        Filter,
        MoreVertical,
        ChevronRight,
        ChevronDown,
        Link,
        Loader2,
        X,
        CheckSquare,
        Download,
        FileSpreadsheet,
        Upload,
    } from "lucide-svelte";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { cn } from "$lib/utils";
    import SearchInput from "$lib/components/custom/search-input.svelte";
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
        DropdownMenuSeparator,
        DropdownMenuLabel,
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
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";
    import ImageUpload from "$lib/components/custom/image-upload.svelte";
    import { API_URL } from "$lib/api";

    // UI State
    const queryClient = useQueryClient();
    let searchTerm = $state("");
    let selectedBrand = $state("all");
    let collapsedBrands = $state<Record<string, boolean>>({});
    let selectedDevice = $state<any>(null);
    let detailOpen = $state(false);

    // Queries
    const brandsQuery = createQuery(() => ({
        queryKey: ["brands"],
        queryFn: BrandsService.getAll,
    }));

    const devicesQuery = createQuery(() => ({
        queryKey: ["devices", searchTerm],
        queryFn: () => InventoryService.getDevices(searchTerm),
    }));

    // Derived State
    let brandList = $derived(brandsQuery.data || []);
    let brandMap = $derived(
        Object.fromEntries(brandList.map((b) => [b.id, b])),
    );

    let devices = $derived(
        (devicesQuery.data || []).filter(
            (d) => selectedBrand === "all" || d.brand === selectedBrand,
        ),
    );

    // Mutations
    const createDeviceMutation = createMutation(() => ({
        mutationFn: InventoryService.createDevice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["devices"] });
            toast.success("Device berhasil dibuat");
            open = false;
            resetForm();
        },
        onError: () => toast.error("Gagal membuat device"),
    }));

    const updateMutation = createMutation(() => ({
        mutationFn: (vars: { id: string; data: any }) =>
            InventoryService.updateDevice(vars.id, vars.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["devices"] });
            toast.success("Device berhasil diupdate");
            open = false;
            resetForm();
        },
        onError: () => toast.error("Gagal update device"),
    }));

    const deleteMutation = createMutation(() => ({
        mutationFn: InventoryService.deleteDevice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["devices"] });
            toast.success("Device dihapus");
            deleteOpen = false;
        },
        onError: () => toast.error("Gagal menghapus device"),
    }));

    const bulkDeleteMutation = createMutation(() => ({
        mutationFn: InventoryService.bulkDeleteDevices,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["devices"] });
            toast.success(`${selectedIds.length} device dihapus`);
            selectedIds = [];
            deleteOpen = false;
        },
        onError: () => toast.error("Gagal menghapus devices"),
    }));

    // Form State
    let open = $state(false);
    let editingId = $state<string | null>(null);
    let brand = $state("");
    let series = $state("");
    let model = $state("");
    let code = $state("");
    let image = $state("");
    let specs = $state("");
    let chipset = $state("");
    let colors = $state(""); // Comma separated string for input
    // New Fields
    let os = $state("");
    let display = $state("");
    let displayType = $state(""); // New
    let network = $state(""); // New
    let release = $state(""); // New
    let usb = $state(""); // New
    let mainCamera = $state("");
    let selfieCamera = $state("");
    let battery = $state("");

    let deleteOpen = $state(false);
    let deletingId = $state<string | null>(null);
    let selectedIds = $state<string[]>([]);
    let isBulkDeleting = $state(false);

    // Grouping Logic
    let groupedDevices = $derived.by(() => {
        const brands: Record<
            string,
            {
                flat: any[];
                series: Record<string, any[]>;
                count: number;
            }
        > = {};

        // Initializes groups
        devices.forEach((d) => {
            if (!brands[d.brand]) {
                brands[d.brand] = { flat: [], series: {}, count: 0 };
            }
            brands[d.brand].count++;

            if (d.series) {
                if (!brands[d.brand].series[d.series]) {
                    brands[d.brand].series[d.series] = [];
                }
                brands[d.brand].series[d.series].push(d);
            } else {
                brands[d.brand].flat.push(d);
            }
        });

        return Object.entries(brands).sort((a, b) => a[0].localeCompare(b[0]));
    });

    function resetForm() {
        editingId = null;
        brand = "";
        series = "";
        model = "";
        code = "";
        image = "";
        specs = "";
        chipset = "";
        colors = "";
        os = "";
        display = "";
        displayType = "";
        network = "";
        release = "";
        usb = "";
        mainCamera = "";
        selfieCamera = "";
        battery = "";
    }

    function handleCreateNew() {
        resetForm();
        open = true;
    }

    function handleEdit(device: any) {
        editingId = device.id;
        brand = device.brand;
        series = device.series || "";
        model = device.model;
        code = device.code || "";
        image = device.image || "";
        specs = device.specs || "";
        chipset = device.chipset || "";
        colors = (device.colors || []).join(", ");

        // Populate new fields from specifications
        const s = device.specifications || {};
        os = s.OS || "";
        display = s.display_size || s.Display || "";
        displayType = s.display_type || s.Display_Type || "";
        network = s.network_technology || s.Network || "";
        release = s.announced || s.Release || "";
        usb = s.USB || "";
        mainCamera = s.primary_camera || s.Main_Camera || "";
        selfieCamera = s.secondary_camera || s.Selfie_Camera || "";
        battery = s.battery || s.Battery || "";

        open = true;
    }

    function confirmDelete(id: string) {
        deletingId = id;
        deleteOpen = true;
    }

    function handleDelete() {
        if (isBulkDeleting) {
            bulkDeleteMutation.mutate(selectedIds);
            isBulkDeleting = false;
        } else {
            if (!deletingId) return;
            deleteMutation.mutate(deletingId);
        }
    }

    function toggleSelect(id: string) {
        if (selectedIds.includes(id)) {
            selectedIds = selectedIds.filter((i) => i !== id);
        } else {
            selectedIds = [...selectedIds, id];
        }
    }

    let allVisibleSelected = $derived(
        devices.length > 0 && devices.every((d) => selectedIds.includes(d.id)),
    );

    function selectAll() {
        const visibleIds = devices.map((d: any) => d.id);
        if (allVisibleSelected) {
            selectedIds = selectedIds.filter((id) => !visibleIds.includes(id));
        } else {
            const newSet = new Set(selectedIds);
            visibleIds.forEach((id) => newSet.add(id));
            selectedIds = Array.from(newSet);
        }
    }

    function selectAllBrand(brandName: string) {
        // Get all device IDs for this brand
        const brandDeviceIds = devices
            .filter((d) => d.brand === brandName)
            .map((d) => d.id);

        // Check if all are already selected
        const allSelected = brandDeviceIds.every((id) =>
            selectedIds.includes(id),
        );

        if (allSelected) {
            // Deselect all from this brand
            selectedIds = selectedIds.filter(
                (id) => !brandDeviceIds.includes(id),
            );
        } else {
            // Select all from this brand
            const newSet = new Set(selectedIds);
            brandDeviceIds.forEach((id) => newSet.add(id));
            selectedIds = Array.from(newSet);
        }
    }

    function confirmBulkDelete() {
        if (selectedIds.length === 0) return;
        isBulkDeleting = true;
        deleteOpen = true;
    }

    function handleSubmit() {
        if (!brand || !model) return toast.error("Brand dan Model wajib diisi");

        const payload = {
            brand,
            series: series || undefined,
            model,
            code: code || undefined,
            image: image || undefined,
            specs: specs || undefined,
            chipset: chipset || undefined,
            colors: colors
                ? colors
                      .split(",")
                      .map((c) => c.trim())
                      .filter((c) => c)
                : undefined,
            specifications: {
                OS: os || undefined,
                display_size: display || undefined,
                display_type: displayType || undefined,
                network_technology: network || undefined,
                announced: release || undefined,
                USB: usb || undefined,
                primary_camera: mainCamera || undefined,
                secondary_camera: selfieCamera || undefined,
                battery: battery || undefined,
            },
        };

        if (editingId) {
            updateMutation.mutate({ id: editingId, data: payload });
        } else {
            createDeviceMutation.mutate(payload);
        }
    }

    function toggleBrand(brandName: string) {
        collapsedBrands[brandName] = !collapsedBrands[brandName];
    }

    let isScraping = $state(false);
    let scrapeUrl = $state("");

    async function handleScrape() {
        if (!scrapeUrl) return toast.error("Masukkan URL GSMArena");

        isScraping = true;
        try {
            const data = await InventoryService.scrapeDevice(scrapeUrl);

            // Auto-populate
            model = data.model || model;
            image = data.image || image; // Now enabled for local download
            chipset = data.chipset || chipset;
            specs = data.specs_ram_storage || specs;
            code = data.code || code;

            if (data.specifications) {
                os = data.specifications.os || os;
                display = data.specifications.display_size || display;
                displayType = data.specifications.display_type || displayType;
                network = data.specifications.network_technology || network;
                release = data.specifications.announced || release;
                usb = data.specifications.usb || usb;
                mainCamera = data.specifications.primary_camera || mainCamera;
                selfieCamera =
                    data.specifications.secondary_camera || selfieCamera;
                battery = data.specifications.battery || battery;
                colors = data.specifications.colors || colors;

                // Try to match brand if simple text match
                const foundBrand = brandList.find(
                    (b) => b.name.toLowerCase() === data.brand?.toLowerCase(),
                );
                if (foundBrand) {
                    brand = foundBrand.id;
                }
            }

            toast.success("Data berhasil diimport!");
        } catch (e) {
            toast.error("Gagal import data URL");
            console.error(e);
        } finally {
            isScraping = false;
        }
    }

    // Bulk Import State
    let bulkImportOpen = $state(false);
    let bulkImportUrl = $state("");
    let bulkImportList = $state<
        {
            name: string;
            url: string;
            selected: boolean;
            existing?: boolean;
            status?: "pending" | "success" | "error";
        }[]
    >([]);
    let bulkImportStep = $state<"input" | "selection" | "progress" | "summary">(
        "input",
    );
    let bulkImportProgress = $state({
        current: 0,
        total: 0,
        success: 0,
        failed: 0,
    });

    function resetBulkImport() {
        bulkImportUrl = "";
        bulkImportList = [];
        bulkImportStep = "input";
        bulkImportProgress = { current: 0, total: 0, success: 0, failed: 0 };
    }

    async function handleScanUrl() {
        if (!bulkImportUrl) return toast.error("Masukkan URL List");
        isScraping = true;
        try {
            const list = await InventoryService.getDeviceList(bulkImportUrl);
            if (list.length === 0) {
                toast.error("Tidak ditemukan device pada URL tersebut");
                return;
            }

            // Get existing device models to compare (use full name for exact matching)
            const existingDevices = devicesQuery.data || [];
            const existingModels = new Set(
                existingDevices.map((d) => {
                    // Create full name like "Samsung Galaxy S24" for comparison
                    const fullName = `${d.brand} ${d.model}`
                        .toLowerCase()
                        .trim();
                    return fullName;
                }),
            );
            // Also create a set of just model names for fallback
            const existingModelNames = new Set(
                existingDevices.map((d) => d.model.toLowerCase().trim()),
            );

            // Mark devices that already exist as unselected
            let existingCount = 0;
            bulkImportList = list.map((item) => {
                // GSMArena names are like "Vivo Y21" - use exact matching
                const itemName = item.name.toLowerCase().trim();

                // Only match if EXACT full name matches or EXACT model name matches
                const isExisting =
                    existingModels.has(itemName) ||
                    existingModelNames.has(itemName);

                if (isExisting) existingCount++;

                return {
                    ...item,
                    selected: !isExisting,
                    existing: isExisting,
                };
            });

            if (existingCount > 0) {
                toast.info(
                    `${existingCount} device sudah ada di database (otomatis tidak dipilih)`,
                );
            }

            bulkImportStep = "selection";
        } catch (e) {
            toast.error("Gagal scan URL");
        } finally {
            isScraping = false;
        }
    }

    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function handleBulkImport() {
        const selected = bulkImportList.filter((i) => i.selected);
        if (selected.length === 0) return;

        bulkImportStep = "progress";
        bulkImportProgress.total = selected.length;
        bulkImportProgress.current = 0;
        bulkImportProgress.success = 0;
        bulkImportProgress.failed = 0;

        // Process sequentially to be nice to the server/target
        // Add random delays to mimic human browsing behavior
        for (let i = 0; i < bulkImportList.length; i++) {
            if (!bulkImportList[i].selected) continue;

            const item = bulkImportList[i];
            item.status = "pending";

            try {
                // Wait random time (6s to 10s) - faster but still polite
                const waitTime = Math.floor(Math.random() * 4000) + 6000;
                await delay(waitTime);

                const res = await InventoryService.importDeviceFromUrl(
                    item.url,
                );

                if (res && res.error) {
                    throw new Error(res.error);
                }

                item.status = "success";
                bulkImportProgress.success++;
            } catch (e: any) {
                console.error(e);
                item.status = "error";
                bulkImportProgress.failed++;

                // If 429 (rate limit), wait 60 seconds before continuing
                if (
                    e.message?.includes("429") ||
                    e.message?.includes("Too Many Requests")
                ) {
                    toast.warning("Rate limit hit, pausing for 60s...");
                    await delay(60000);
                }
            } finally {
                bulkImportProgress.current++;
            }
        }

        bulkImportStep = "summary";
        toast.success(
            `Import selesai. Sukses: ${bulkImportProgress.success}, Gagal: ${bulkImportProgress.failed}`,
        );
    }

    function openDetail(device: any) {
        selectedDevice = device;
        detailOpen = true;
    }
</script>

{#snippet deviceCard(device: any)}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class={cn(
            "group relative flex flex-col bg-card border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer",
            selectedIds.includes(device.id) &&
                "ring-2 ring-primary border-primary bg-primary/5",
        )}
        onclick={() => {
            if (selectedIds.length > 0) {
                toggleSelect(device.id);
            } else {
                openDetail(device);
            }
        }}
    >
        <!-- Selection Checkbox -->
        <div
            class="absolute top-2 left-2 z-20"
            onclick={(e) => e.stopPropagation()}
        >
            <Checkbox
                checked={selectedIds.includes(device.id)}
                onCheckedChange={() => toggleSelect(device.id)}
                class="bg-white/90 backdrop-blur-sm shadow-sm data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-muted-foreground/40"
            />
        </div>
        <!-- Card Menu -->
        <div
            class="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            onclick={(e) => e.stopPropagation()}
        >
            <DropdownMenu>
                <DropdownMenuTrigger
                    class={cn(
                        buttonVariants({ variant: "secondary", size: "icon" }),
                        "h-8 w-8 rounded-full shadow-sm bg-white/90 backdrop-blur-sm",
                    )}
                >
                    <MoreVertical class="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onclick={() => handleEdit(device)}>
                        <Pencil class="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        class="text-red-600"
                        onclick={() => confirmDelete(device.id)}
                    >
                        <Trash2 class="mr-2 h-4 w-4" /> Hapus
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <!-- Image / Brand Placeholder -->
        <div
            class="aspect-[4/3] bg-muted relative overflow-hidden flex items-center justify-center p-6"
        >
            {#if device.image}
                <img
                    src={device.image?.startsWith("http")
                        ? device.image
                        : `${API_URL}${device.image}`}
                    alt={device.model}
                    class="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                />
            {:else}
                <div class="text-center text-muted-foreground/30">
                    <Smartphone class="h-16 w-16 mx-auto mb-2" />
                    <span class="text-xs font-bold uppercase tracking-widest"
                        >{device.brand}</span
                    >
                </div>
            {/if}

            <Badge
                class="absolute bottom-2 left-2 bg-white/90 text-foreground shadow-sm hover:bg-white border text-[10px] backdrop-blur-sm"
            >
                {device.brand}
            </Badge>
        </div>

        <!-- Info -->
        <div class="p-4 flex-1 flex flex-col gap-1">
            <h3
                class="font-semibold text-lg leading-tight group-hover:text-primary transition-colors"
            >
                {device.model}
            </h3>

            <div class="flex flex-wrap gap-1 mt-1">
                {#if device.code}
                    <span
                        class="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded"
                    >
                        {device.code}
                    </span>
                {/if}
                {#if device.chipset}
                    <span
                        class="text-xs text-muted-foreground border px-1.5 py-0.5 rounded bg-muted/50"
                        title="Chipset"
                    >
                        {device.chipset}
                    </span>
                {/if}
                {#if device.specs}
                    <span
                        class="text-xs text-muted-foreground border px-1.5 py-0.5 rounded"
                        title="Internal Storage/RAM"
                    >
                        {device.specs}
                    </span>
                {/if}
            </div>
            {#if device.colors && device.colors.length > 0}
                <div class="flex items-center gap-1 mt-1">
                    {#each device.colors.slice(0, 3) as color}
                        <div
                            class="w-2 h-2 rounded-full border shadow-sm"
                            style="background-color: {color.toLowerCase()};"
                            title={color}
                        ></div>
                    {/each}
                    {#if device.colors.length > 3}
                        <span class="text-[10px] text-muted-foreground"
                            >+{device.colors.length - 3}</span
                        >
                    {/if}
                </div>
            {/if}
        </div>
    </div>
{/snippet}

<div class="container mx-auto py-8">
    <div class="flex flex-col gap-6">
        <!-- Header -->
        <div
            class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6"
        >
            <div>
                <h2 class="text-3xl font-bold tracking-tight">Data Device</h2>
                <p class="text-muted-foreground mt-1">
                    Kelola database handphone untuk referensi service.
                </p>
            </div>
            <div class="flex items-center gap-2">
                {#if selectedIds.length > 0}
                    <Button
                        variant="destructive"
                        size="lg"
                        onclick={confirmBulkDelete}
                        class="animate-in fade-in zoom-in duration-200"
                    >
                        <Trash2 class="h-4 w-4 mr-2" />
                        Hapus ({selectedIds.length})
                    </Button>
                    <Button
                        variant="ghost"
                        size="lg"
                        onclick={() => (selectedIds = [])}
                    >
                        <X class="h-4 w-4 mr-2" /> Batal
                    </Button>
                {:else}
                    <Button variant="outline" href="/brands" size="lg">
                        Kelola Brand
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Button variant="outline" size="lg">
                                <FileSpreadsheet class="h-4 w-4 mr-2" />
                                Excel / CSV
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Export Data</DropdownMenuLabel>
                            <DropdownMenuItem
                                onclick={() =>
                                    InventoryService.exportDevices("excel")}
                            >
                                <FileSpreadsheet class="h-4 w-4 mr-2" /> Export Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onclick={() =>
                                    InventoryService.exportDevices("csv")}
                            >
                                <Download class="h-4 w-4 mr-2" /> Export CSV
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Import Data</DropdownMenuLabel>
                            <DropdownMenuItem
                                onclick={() =>
                                    document
                                        .getElementById("import-file")
                                        ?.click()}
                            >
                                <Upload class="h-4 w-4 mr-2" /> Import Excel/CSV
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <input
                        type="file"
                        id="import-file"
                        class="hidden"
                        accept=".xlsx,.xls,.csv"
                        onchange={async (e) => {
                            const file = e.currentTarget.files?.[0];
                            if (file) {
                                try {
                                    const res =
                                        await InventoryService.importDevices(
                                            file,
                                        );
                                    if (
                                        res.skipped > 0 ||
                                        res.errors.length > 0
                                    ) {
                                        toast.warning(
                                            `Import: ${res.imported} sukses, ${res.skipped} dilewati`,
                                        );
                                    } else {
                                        toast.success(
                                            `Import sukses: ${res.imported} device`,
                                        );
                                    }
                                    if (res.errors.length > 0) {
                                        console.error(res.errors);
                                        toast.error(
                                            "Cek console untuk detail error",
                                        );
                                    }
                                    devicesQuery.refetch();
                                } catch (e) {
                                    toast.error("Gagal import file");
                                }
                                e.currentTarget.value = ""; // Reset
                            }
                        }}
                    />
                    <Button
                        variant="secondary"
                        size="lg"
                        onclick={() => (bulkImportOpen = true)}
                        class="shadow-sm"
                    >
                        <Download class="h-5 w-5 mr-2" /> Import Bulk
                    </Button>
                    <Button
                        onclick={handleCreateNew}
                        size="lg"
                        class="shadow-sm"
                    >
                        <Plus class="h-5 w-5 mr-2" /> Tambah Device
                    </Button>
                {/if}
            </div>
        </div>

        <!-- Filters -->
        <div
            class="flex flex-col md:flex-row gap-4 items-center bg-muted/30 p-4 rounded-lg border"
        >
            <div class="w-full md:w-auto flex-1">
                <SearchInput
                    bind:value={searchTerm}
                    placeholder="Cari model, kode mesin..."
                    class="w-full bg-background"
                />
            </div>
            <div class="w-full md:w-[250px]">
                <Select type="single" bind:value={selectedBrand}>
                    <SelectTrigger class="bg-background">
                        <div class="flex items-center gap-2">
                            <Filter class="h-4 w-4 text-muted-foreground" />
                            <span
                                >{selectedBrand === "all"
                                    ? "Semua Brand"
                                    : brandMap[selectedBrand]?.name ||
                                      selectedBrand}</span
                            >
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Brand</SelectItem>
                        {#each brandList as b}
                            <SelectItem value={b.id}>{b.name}</SelectItem>
                        {/each}
                    </SelectContent>
                </Select>
            </div>
            <Button
                variant="ghost"
                class={cn("shrink-0", allVisibleSelected && "text-primary")}
                onclick={selectAll}
                disabled={devices.length === 0}
            >
                <CheckSquare class="h-4 w-4 mr-2" />
                {allVisibleSelected ? "Deselect All" : "Select All"}
            </Button>
        </div>

        <!-- Content Grid -->
        {#if devicesQuery.isLoading}
            <div class="space-y-4">
                {#each Array(3) as _}
                    <div class="space-y-3">
                        <Skeleton class="h-8 w-48 rounded" />
                        <div
                            class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4"
                        >
                            {#each Array(5) as _}
                                <Skeleton class="h-[200px] w-full rounded-xl" />
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        {:else if devices.length === 0}
            <div
                class="flex flex-col items-center justify-center py-20 text-center space-y-4 border-2 border-dashed rounded-xl bg-muted/10"
            >
                <div class="bg-muted p-4 rounded-full">
                    <Smartphone class="h-10 w-10 text-muted-foreground" />
                </div>
                <div class="max-w-md space-y-1">
                    <h3 class="font-semibold text-lg">
                        Tidak ada device ditemukan
                    </h3>
                    <p class="text-muted-foreground text-sm">
                        Coba ubah kata kunci pencarian atau filter brand, atau
                        tambahkan device baru.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onclick={() => {
                        searchTerm = "";
                        selectedBrand = "all";
                    }}
                >
                    Reset Filter
                </Button>
            </div>
        {:else}
            <div class="space-y-4 animate-in fade-in duration-500">
                {#each groupedDevices as [brandName, group]}
                    <div
                        class="space-y-2 border rounded-xl overflow-hidden bg-muted/5"
                    >
                        <!-- Brand Header (Collapsible Trigger) -->
                        <button
                            class="w-full flex items-center justify-between p-4 hover:bg-muted/10 transition-colors"
                            onclick={() => toggleBrand(brandName)}
                        >
                            <div class="flex items-center gap-3">
                                <ChevronDown
                                    class={cn(
                                        "h-5 w-5 transition-transform duration-200",
                                        collapsedBrands[brandName]
                                            ? "-rotate-90"
                                            : "rotate-0",
                                    )}
                                />
                                <Badge
                                    variant="outline"
                                    class="text-lg px-3 py-1 font-bold tracking-wider bg-background"
                                >
                                    {brandName}
                                </Badge>
                                <span class="text-muted-foreground text-sm"
                                    >({group.count} devices)</span
                                >
                            </div>
                            <!-- Select All Brand Button -->
                            <Button
                                variant="ghost"
                                size="sm"
                                onclick={(e: MouseEvent) => {
                                    e.stopPropagation();
                                    selectAllBrand(brandName);
                                }}
                                class="text-xs"
                            >
                                <CheckSquare class="h-3 w-3 mr-1" />
                                {devices
                                    .filter((d) => d.brand === brandName)
                                    .every((d) => selectedIds.includes(d.id))
                                    ? "Deselect"
                                    : "Select All"}
                            </Button>
                        </button>

                        {#if !collapsedBrands[brandName]}
                            <div
                                class="p-4 pt-0 animate-in slide-in-from-top-2 duration-300"
                            >
                                <!-- 1. Render Series Groups -->
                                {#each Object.entries(group.series) as [seriesName, seriesDevices]}
                                    {@const seriesId = `${brandName}-${seriesName}`}
                                    <div class="ml-2 md:ml-6 space-y-3 mb-6">
                                        <div class="flex items-center gap-2">
                                            <div
                                                class="h-px bg-border flex-1 max-w-[20px]"
                                            ></div>
                                            <h4
                                                class="font-semibold text-base text-foreground/80"
                                            >
                                                {seriesName}
                                            </h4>
                                            <span
                                                class="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
                                            >
                                                {seriesDevices.length}
                                            </span>
                                            <div
                                                class="h-px bg-border flex-1 opacity-50"
                                            ></div>
                                        </div>

                                        <div
                                            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                                        >
                                            {#each seriesDevices as device (device.id)}
                                                {@render deviceCard(device)}
                                            {/each}
                                        </div>
                                    </div>
                                {/each}

                                <!-- 2. Render Flat Devices (No Series) -->
                                {#if group.flat.length > 0}
                                    <div
                                        class={Object.keys(group.series)
                                            .length > 0
                                            ? "ml-2 md:ml-6"
                                            : ""}
                                    >
                                        {#if Object.keys(group.series).length > 0}
                                            <div
                                                class="flex items-center gap-2 mb-3"
                                            >
                                                <div
                                                    class="h-px bg-border flex-1 max-w-[20px]"
                                                ></div>
                                                <h4
                                                    class="font-semibold text-base text-muted-foreground"
                                                >
                                                    Lainnya
                                                </h4>
                                                <div
                                                    class="h-px bg-border flex-1 opacity-50"
                                                ></div>
                                            </div>
                                        {/if}
                                        <div
                                            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                                        >
                                            {#each group.flat as device (device.id)}
                                                {@render deviceCard(device)}
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Dialog -->
    <Dialog bind:open onOpenChange={(isOpen) => !isOpen && resetForm()}>
        <DialogContent class="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>
                    {editingId ? "Edit Device" : "Tambah Device Baru"}
                </DialogTitle>
                <DialogDescription>
                    Isi informasi detail spesifikasi device handphone.
                </DialogDescription>
            </DialogHeader>

            <div class="grid gap-4 py-4">
                <!-- Scraper Input -->
                <div
                    class="flex items-end gap-2 p-3 bg-muted/20 border rounded-lg mb-2"
                >
                    <div class="grid gap-2 flex-1">
                        <Label
                            class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                        >
                            Import from GSMArena
                        </Label>
                        <div class="relative">
                            <Link
                                class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                            />
                            <Input
                                bind:value={scrapeUrl}
                                placeholder="Paste Link (https://www.gsmarena.com/...)"
                                class="pl-9"
                                disabled={isScraping}
                            />
                        </div>
                    </div>
                    <Button
                        variant="secondary"
                        onclick={handleScrape}
                        disabled={isScraping || !scrapeUrl}
                    >
                        {#if isScraping}
                            <Loader2 class="h-4 w-4 animate-spin" />
                        {:else}
                            Fetch
                        {/if}
                    </Button>
                </div>

                <div class="flex justify-center mb-2">
                    <ImageUpload
                        bind:value={image}
                        folder={brand
                            ? brandMap[brand]?.name || brand
                            : "devices"}
                    />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label
                            class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                            >Brand</Label
                        >
                        <Select type="single" bind:value={brand}>
                            <SelectTrigger>
                                <span
                                    >{brand
                                        ? brandMap[brand]?.name || brand
                                        : "Pilih Brand"}</span
                                >
                            </SelectTrigger>
                            <SelectContent>
                                {#each brandList as b}
                                    <SelectItem value={b.id}
                                        >{b.name}</SelectItem
                                    >
                                {/each}
                            </SelectContent>
                        </Select>
                    </div>

                    <div class="grid gap-2">
                        <Label
                            class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                            >Series (Optional)</Label
                        >
                        <Input bind:value={series} placeholder="Ex: S Series" />
                    </div>
                </div>

                <div class="grid gap-2">
                    <Label
                        class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                        >Model / Tipe</Label
                    >
                    <Input
                        bind:value={model}
                        placeholder="Contoh: Galaxy S24 Ultra"
                    />
                </div>

                <!-- Network & Launch -->
                <div class="border rounded-lg p-3 space-y-3 bg-muted/10">
                    <h4 class="text-sm font-semibold flex items-center gap-2">
                        <Smartphone class="h-3.5 w-3.5" /> Network & Launch
                    </h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="grid gap-2">
                            <Label
                                class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                            >
                                Network
                            </Label>
                            <Input
                                bind:value={network}
                                placeholder="GSM / HSPA / LTE / 5G"
                            />
                        </div>
                        <div class="grid gap-2">
                            <Label
                                class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                            >
                                Announced
                            </Label>
                            <Input
                                bind:value={release}
                                placeholder="2024, January 17"
                            />
                        </div>
                    </div>
                </div>

                <!-- Hardware Specs -->
                <div class="border rounded-lg p-3 space-y-3 bg-muted/10">
                    <h4 class="text-sm font-semibold flex items-center gap-2">
                        <Smartphone class="h-3.5 w-3.5" /> Hardware & Platform
                    </h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="grid gap-2">
                            <Label
                                class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                                >Chipset</Label
                            >
                            <Input
                                bind:value={chipset}
                                placeholder="Snapdragon 8 Gen 3"
                            />
                        </div>
                        <div class="grid gap-2">
                            <Label
                                class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                                >OS</Label
                            >
                            <Input
                                bind:value={os}
                                placeholder="Android 14, One UI 6.1"
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="grid gap-2">
                            <Label
                                class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                                >Internal Storage/RAM</Label
                            >
                            <Input
                                bind:value={specs}
                                placeholder="128GB/256GB"
                            />
                        </div>
                        <div class="grid gap-2">
                            <Label
                                class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                            >
                                USB
                            </Label>
                            <Input
                                bind:value={usb}
                                placeholder="USB Type-C 3.2"
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="grid gap-2">
                            <Label
                                class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                                >Display Size</Label
                            >
                            <Input
                                bind:value={display}
                                placeholder="6.8 inches"
                            />
                        </div>
                        <div class="grid gap-2">
                            <Label
                                class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                            >
                                Display Type
                            </Label>
                            <Input
                                bind:value={displayType}
                                placeholder="Dynamic LTPO AMOLED 2X"
                            />
                        </div>
                    </div>
                </div>

                <!-- Camera & Battery -->
                <div class="border rounded-lg p-3 space-y-3 bg-muted/10">
                    <h4 class="text-sm font-semibold flex items-center gap-2">
                        <Smartphone class="h-3.5 w-3.5" /> Camera & Battery
                    </h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="grid gap-2">
                            <Label
                                class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                                >Main Camera</Label
                            >
                            <Input
                                bind:value={mainCamera}
                                placeholder="200 MP + 50 MP + ..."
                            />
                        </div>
                        <div class="grid gap-2">
                            <Label
                                class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                                >Selfie Camera</Label
                            >
                            <Input
                                bind:value={selfieCamera}
                                placeholder="12 MP"
                            />
                        </div>
                    </div>
                    <div class="grid gap-2">
                        <Label
                            class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                            >Battery</Label
                        >
                        <Input
                            bind:value={battery}
                            placeholder="5000 mAh, 45W wired"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label
                            class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                            >Kode Mesin</Label
                        >
                        <Input
                            bind:value={code}
                            placeholder="SM-S928B"
                            class="font-mono"
                        />
                        <p class="text-[10px] text-muted-foreground">
                            Pisahkan dengan koma jika banyak
                        </p>
                    </div>
                    <div class="grid gap-2">
                        <Label
                            class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                            >Warna</Label
                        >
                        <Input
                            bind:value={colors}
                            placeholder="Hitam, Putih (koma)"
                        />
                        <p class="text-[10px] text-muted-foreground">
                            Pisahkan dengan koma
                        </p>
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button variant="ghost" onclick={() => (open = false)}
                    >Batal</Button
                >
                <Button
                    onclick={handleSubmit}
                    disabled={createDeviceMutation.isPending ||
                        updateMutation.isPending}
                >
                    {createDeviceMutation.isPending || updateMutation.isPending
                        ? "Menyimpan..."
                        : "Simpan"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <!-- Detail Dialog -->
    <Dialog bind:open={detailOpen}>
        <DialogContent class="max-w-3xl max-h-[90vh] overflow-y-auto">
            {#if selectedDevice}
                <DialogHeader>
                    <div class="flex items-start gap-4">
                        {#if selectedDevice.image}
                            <div
                                class="h-24 w-24 border rounded-lg bg-muted flex items-center justify-center p-2 flex-shrink-0"
                            >
                                <img
                                    src={selectedDevice.image?.startsWith(
                                        "http",
                                    )
                                        ? selectedDevice.image
                                        : `${API_URL}${selectedDevice.image}`}
                                    alt={selectedDevice.model}
                                    class="max-w-full max-h-full object-contain mix-blend-multiply"
                                />
                            </div>
                        {/if}
                        <div>
                            <DialogTitle class="text-2xl"
                                >{selectedDevice.model}</DialogTitle
                            >
                            <DialogDescription class="text-base mt-2">
                                <Badge variant="secondary" class="mr-2"
                                    >{selectedDevice.brand}</Badge
                                >
                                {#if selectedDevice.series}<Badge
                                        variant="outline"
                                        >{selectedDevice.series}</Badge
                                    >{/if}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div class="space-y-6">
                    <!-- Main Info -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="p-4 bg-muted/20 rounded-lg border">
                            <h4
                                class="font-semibold mb-2 flex items-center gap-2"
                            >
                                <Smartphone class="h-4 w-4" /> Hardware
                            </h4>
                            <dl class="space-y-1 text-sm">
                                <div class="flex justify-between border-b pb-1">
                                    <dt class="text-muted-foreground">
                                        Chipset
                                    </dt>
                                    <dd class="font-medium">
                                        {selectedDevice.chipset || "-"}
                                    </dd>
                                </div>
                                <div
                                    class="flex justify-between border-b pb-1 pt-1"
                                >
                                    <dt class="text-muted-foreground">CPU</dt>
                                    <dd class="font-medium">
                                        {selectedDevice.specifications?.CPU ||
                                            "-"}
                                    </dd>
                                </div>
                                <div
                                    class="flex justify-between border-b pb-1 pt-1"
                                >
                                    <dt class="text-muted-foreground">GPU</dt>
                                    <dd class="font-medium">
                                        {selectedDevice.specifications?.GPU ||
                                            "-"}
                                    </dd>
                                </div>
                                <div class="flex justify-between pt-1">
                                    <dt class="text-muted-foreground">OS</dt>
                                    <dd class="font-medium">
                                        {selectedDevice.specifications?.OS ||
                                            "-"}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                        <div class="p-4 bg-muted/20 rounded-lg border">
                            <h4
                                class="font-semibold mb-2 flex items-center gap-2"
                            >
                                <Smartphone class="h-4 w-4" /> Memory & Storage
                            </h4>
                            <dl class="space-y-1 text-sm">
                                <div class="flex justify-between border-b pb-1">
                                    <dt class="text-muted-foreground">
                                        Memory Card
                                    </dt>
                                    <dd class="font-medium">
                                        {selectedDevice.specifications
                                            ?.memory_card || "-"}
                                    </dd>
                                </div>
                                <div
                                    class="flex justify-between border-b pb-1 pt-1"
                                >
                                    <dt class="text-muted-foreground">
                                        Internal
                                    </dt>
                                    <dd class="font-medium">
                                        {selectedDevice.specifications
                                            ?.internal_memory || "-"}
                                    </dd>
                                </div>
                                <div class="flex justify-between pt-1">
                                    <dt class="text-muted-foreground">RAM</dt>
                                    <dd class="font-medium">
                                        {selectedDevice.specifications?.RAM ||
                                            "-"}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    <!-- Specs Grid -->
                    <div class="grid gap-4">
                        <h4 class="font-semibold text-lg border-b pb-2">
                            Full Specifications
                        </h4>
                        <div
                            class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm"
                        >
                            <div class="grid grid-cols-3 gap-2 border-b pb-1">
                                <dt class="text-muted-foreground font-medium">
                                    Network
                                </dt>
                                <dd
                                    class="col-span-2 break-words text-foreground"
                                >
                                    {selectedDevice.specifications
                                        ?.network_technology ||
                                        selectedDevice.specifications
                                            ?.Network ||
                                        "-"}
                                </dd>
                            </div>
                            <div class="grid grid-cols-3 gap-2 border-b pb-1">
                                <dt class="text-muted-foreground font-medium">
                                    Release
                                </dt>
                                <dd
                                    class="col-span-2 break-words text-foreground"
                                >
                                    {selectedDevice.specifications?.announced ||
                                        selectedDevice.specifications
                                            ?.Release ||
                                        "-"}
                                </dd>
                            </div>
                            <div class="grid grid-cols-3 gap-2 border-b pb-1">
                                <dt class="text-muted-foreground font-medium">
                                    Display Type
                                </dt>
                                <dd
                                    class="col-span-2 break-words text-foreground"
                                >
                                    {selectedDevice.specifications
                                        ?.display_type ||
                                        selectedDevice.specifications
                                            ?.Display_Type ||
                                        "-"}
                                </dd>
                            </div>
                            <div class="grid grid-cols-3 gap-2 border-b pb-1">
                                <dt class="text-muted-foreground font-medium">
                                    USB
                                </dt>
                                <dd
                                    class="col-span-2 break-words text-foreground"
                                >
                                    {selectedDevice.specifications?.USB || "-"}
                                </dd>
                            </div>
                            <div class="grid grid-cols-3 gap-2 border-b pb-1">
                                <dt class="text-muted-foreground font-medium">
                                    Battery
                                </dt>
                                <dd
                                    class="col-span-2 break-words text-foreground"
                                >
                                    {selectedDevice.specifications?.battery ||
                                        selectedDevice.specifications
                                            ?.Battery ||
                                        "-"}
                                </dd>
                            </div>
                            <div class="grid grid-cols-3 gap-2 border-b pb-1">
                                <dt class="text-muted-foreground font-medium">
                                    Model Number
                                </dt>
                                <dd
                                    class="col-span-2 break-words font-mono text-foreground"
                                >
                                    {selectedDevice.code || "-"}
                                </dd>
                            </div>
                            <div class="grid grid-cols-3 gap-2 border-b pb-1">
                                <dt class="text-muted-foreground font-medium">
                                    Color
                                </dt>
                                <dd
                                    class="col-span-2 break-words text-foreground"
                                >
                                    {(selectedDevice.colors || []).join(", ") ||
                                        "-"}
                                </dd>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
        </DialogContent>
    </Dialog>

    <!-- Delete Confirmation -->
    <AlertDialog bind:open={deleteOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Hapus Device?</AlertDialogTitle>
                <AlertDialogDescription>
                    Tindakan ini tidak dapat dibatalkan. Pastikan data ini sudah
                    tidak digunakan dalam referensi service/kompatibilitas.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel
                    onclick={() => {
                        deleteOpen = false;
                        deletingId = null;
                        isBulkDeleting = false;
                    }}>Batal</AlertDialogCancel
                >
                <AlertDialogAction
                    class="bg-red-500 hover:bg-red-600"
                    onclick={handleDelete}
                >
                    {isBulkDeleting
                        ? `Hapus ${selectedIds.length} Device`
                        : "Hapus"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <!-- Bulk Import Dialog -->
    <Dialog
        bind:open={bulkImportOpen}
        onOpenChange={(v) => !v && resetBulkImport()}
    >
        <DialogContent class="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Import Bulk Device</DialogTitle>
                <DialogDescription>
                    Import banyak data device sekaligus dari halaman list
                    GSMArena.
                </DialogDescription>
            </DialogHeader>

            <div class="py-4 space-y-4">
                {#if bulkImportStep === "input"}
                    <div class="grid gap-2">
                        <Label>URL List GSMArena</Label>
                        <div class="flex gap-2">
                            <Input
                                bind:value={bulkImportUrl}
                                placeholder="https://www.gsmarena.com/samsung-phones-9.php or result.php3?..."
                            />
                            <Button
                                onclick={handleScanUrl}
                                disabled={isScraping}
                            >
                                {#if isScraping}
                                    <Loader2
                                        class="h-4 w-4 animate-spin mr-2"
                                    />
                                    Scanning...
                                {:else}
                                    Scan
                                {/if}
                            </Button>
                        </div>
                        <p class="text-xs text-muted-foreground">
                            Masukkan URL halaman list brand atau hasil pencarian
                            GSMArena.
                        </p>
                    </div>
                {:else if bulkImportStep === "selection"}
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <h4 class="font-medium text-sm">
                                Ditemukan {bulkImportList.length} device
                            </h4>
                            <div class="space-x-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onclick={() => {
                                        bulkImportList = bulkImportList.map(
                                            (i) => ({ ...i, selected: true }),
                                        );
                                    }}
                                >
                                    Select All
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onclick={() => {
                                        bulkImportList = bulkImportList.map(
                                            (i) => ({ ...i, selected: false }),
                                        );
                                    }}
                                >
                                    Deselect All
                                </Button>
                            </div>
                        </div>
                        <div
                            class="border rounded-md max-h-[400px] overflow-y-auto p-2 space-y-1"
                        >
                            {#each bulkImportList as item, i (i)}
                                <div
                                    class={cn(
                                        "flex items-center gap-2 p-2 hover:bg-muted rounded text-sm",
                                        item.existing &&
                                            "opacity-50 bg-muted/50",
                                    )}
                                >
                                    <Checkbox
                                        checked={item.selected}
                                        onCheckedChange={(
                                            checked: boolean | "indeterminate",
                                        ) => {
                                            bulkImportList[i].selected =
                                                !!checked;
                                        }}
                                    />
                                    <span
                                        class={cn(
                                            "truncate flex-1",
                                            item.existing && "line-through",
                                        )}>{item.name}</span
                                    >
                                    {#if item.existing}
                                        <Badge
                                            variant="secondary"
                                            class="text-[10px] shrink-0"
                                            >Sudah Ada</Badge
                                        >
                                    {/if}
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        class="text-xs text-blue-500 hover:underline shrink-0"
                                    >
                                        Link
                                    </a>
                                </div>
                            {/each}
                        </div>
                    </div>
                {:else if bulkImportStep === "progress" || bulkImportStep === "summary"}
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <div class="flex justify-between text-sm">
                                <span>Proses Import...</span>
                                <span
                                    >{Math.round(
                                        (bulkImportProgress.current /
                                            bulkImportProgress.total) *
                                            100,
                                    )}%</span
                                >
                            </div>
                            <div
                                class="h-2 w-full bg-secondary rounded-full overflow-hidden"
                            >
                                <div
                                    class="h-full bg-primary transition-all duration-300"
                                    style="width: {(bulkImportProgress.current /
                                        bulkImportProgress.total) *
                                        100}%"
                                ></div>
                            </div>
                            <div
                                class="flex gap-4 text-sm text-muted-foreground justify-center"
                            >
                                <span class="text-green-600"
                                    >Success: {bulkImportProgress.success}</span
                                >
                                <span class="text-red-500"
                                    >Failed: {bulkImportProgress.failed}</span
                                >
                            </div>
                        </div>

                        <div
                            class="border rounded-md max-h-[300px] overflow-y-auto p-2 text-xs font-mono space-y-1"
                        >
                            {#each bulkImportList.filter((i) => i.selected) as item}
                                {#if item.status}
                                    <div
                                        class={cn(
                                            "flex items-center gap-2",
                                            item.status === "success" &&
                                                "text-green-600",
                                            item.status === "error" &&
                                                "text-red-600",
                                            item.status === "pending" &&
                                                "text-muted-foreground",
                                        )}
                                    >
                                        {#if item.status === "pending"}
                                            <Loader2
                                                class="h-3 w-3 animate-spin"
                                            />
                                        {:else if item.status === "success"}
                                            <CheckSquare class="h-3 w-3" />
                                        {:else}
                                            <X class="h-3 w-3" />
                                        {/if}
                                        {item.name}
                                    </div>
                                {/if}
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>

            <DialogFooter>
                {#if bulkImportStep === "input"}
                    <Button
                        variant="ghost"
                        onclick={() => (bulkImportOpen = false)}>Batal</Button
                    >
                {:else if bulkImportStep === "selection"}
                    <Button
                        variant="ghost"
                        onclick={() => (bulkImportStep = "input")}>Back</Button
                    >
                    <Button
                        onclick={handleBulkImport}
                        disabled={!bulkImportList.some((i) => i.selected)}
                    >
                        Import Selected ({bulkImportList.filter(
                            (i) => i.selected,
                        ).length})
                    </Button>
                {:else if bulkImportStep === "summary"}
                    <Button
                        onclick={() => {
                            bulkImportOpen = false;
                            queryClient.invalidateQueries({
                                queryKey: ["devices"],
                            });
                            resetBulkImport();
                        }}>Selesai</Button
                    >
                {/if}
            </DialogFooter>
        </DialogContent>
    </Dialog>
</div>
