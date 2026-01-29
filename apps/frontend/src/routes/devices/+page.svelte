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
        Tags,
        Boxes,
        Database,
        Network,
        Calendar,
        Cpu,
        Camera,
        Battery,
        QrCode,
        Palette,
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

    // Customize brand name for display
    function normalizeBrandDisplay(name: string): string {
        if (!name || name.trim().length === 0) return name;
        const trimmed = name.trim();
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    }

    let devices = $derived(
        (devicesQuery.data || []).filter(
            (d) => selectedBrand === "all" || d.brand === selectedBrand,
        ),
    );

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

    // Stats Calculations
    let totalDevices = $derived(devices.length);
    let topBrand = $derived.by(() => {
        if (devices.length === 0) return "-";
        const counts: Record<string, number> = {};
        let max = 0;
        let best = "-";
        devices.forEach((d) => {
            const b = d.brand || "Unknown";
            counts[b] = (counts[b] || 0) + 1;
            if (counts[b] > max) {
                max = counts[b];
                best = b;
            }
        });
        return best;
    });
    let totalBrands = $derived(Object.keys(groupedDevices).length);
    let withSpecsCount = $derived(
        devices.filter(
            (d) => d.specifications && Object.keys(d.specifications).length > 0,
        ).length,
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

        // Normalize brand name: capitalize first letter
        const normalizeBrandName = (name: string): string => {
            if (!name || name.trim().length === 0) return name;
            const trimmed = name.trim();
            return (
                trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
            );
        };

        const payload = {
            brand: normalizeBrandName(brand), // Normalize brand name
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

                // Normalize brand name and try to match brand (case-insensitive)
                const normalizeBrandName = (name: string): string => {
                    if (!name || name.trim().length === 0) return name;
                    const trimmed = name.trim();
                    return (
                        trimmed.charAt(0).toUpperCase() +
                        trimmed.slice(1).toLowerCase()
                    );
                };

                const normalizedBrand = data.brand
                    ? normalizeBrandName(data.brand)
                    : "";
                const foundBrand = brandList.find(
                    (b) =>
                        b.name.toLowerCase() === normalizedBrand.toLowerCase(),
                );

                // Use normalized brand name (not ID) for consistency
                if (normalizedBrand) {
                    brand = normalizedBrand; // Use normalized brand name
                } else if (foundBrand) {
                    brand = foundBrand.name; // Fallback to found brand's normalized name
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
        startTime: 0,
        estimatedTimeLeft: 0, // in seconds
    });

    function resetBulkImport() {
        bulkImportUrl = "";
        bulkImportList = [];
        bulkImportStep = "input";
        bulkImportProgress = {
            current: 0,
            total: 0,
            success: 0,
            failed: 0,
            startTime: 0,
            estimatedTimeLeft: 0,
        };
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

    function formatTime(seconds: number): string {
        if (seconds < 60) {
            return `${seconds} detik`;
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (minutes < 60) {
            return remainingSeconds > 0
                ? `${minutes} menit ${remainingSeconds} detik`
                : `${minutes} menit`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (remainingMinutes > 0) {
            return `${hours} jam ${remainingMinutes} menit`;
        }
        return `${hours} jam`;
    }

    async function handleBulkImport() {
        const selected = bulkImportList.filter((i) => i.selected);
        if (selected.length === 0) return;

        bulkImportStep = "progress";
        bulkImportProgress.total = selected.length;
        bulkImportProgress.current = 0;
        bulkImportProgress.success = 0;
        bulkImportProgress.failed = 0;
        bulkImportProgress.startTime = Date.now();
        bulkImportProgress.estimatedTimeLeft = 0;

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

                // Calculate estimated time left
                if (bulkImportProgress.current > 0) {
                    const elapsed =
                        (Date.now() - bulkImportProgress.startTime) / 1000; // seconds
                    const avgTimePerItem = elapsed / bulkImportProgress.current;
                    const remaining =
                        bulkImportProgress.total - bulkImportProgress.current;
                    bulkImportProgress.estimatedTimeLeft = Math.round(
                        avgTimePerItem * remaining,
                    );
                }
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
            "group relative flex flex-col bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-white/5 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer outline-none focus:outline-none",
            selectedIds.includes(device.id) &&
                "ring-2 ring-blue-500 border-blue-500/50 bg-blue-50/50 dark:bg-blue-900/20",
        )}
        tabindex="-1"
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
            class="absolute top-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            class:opacity-100={selectedIds.includes(device.id)}
            onclick={(e) => e.stopPropagation()}
        >
            <Checkbox
                checked={selectedIds.includes(device.id)}
                onCheckedChange={() => toggleSelect(device.id)}
                class="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm border-slate-200 dark:border-slate-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-5 w-5 rounded-md"
            />
        </div>

        <!-- Card Menu -->
        <div
            class="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onclick={(e) => e.stopPropagation()}
        >
            <DropdownMenu>
                <DropdownMenuTrigger
                    class={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "h-8 w-8 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm hover:bg-white dark:hover:bg-slate-800",
                    )}
                >
                    <MoreVertical class="h-4 w-4 text-slate-500" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="rounded-xl">
                    <DropdownMenuItem onclick={() => handleEdit(device)}>
                        <Pencil class="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        class="text-red-600 focus:text-red-600"
                        onclick={() => confirmDelete(device.id)}
                    >
                        <Trash2 class="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <!-- Image Area -->
        <div
            class="aspect-[4/3] bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/30 dark:to-transparent relative overflow-hidden flex items-center justify-center p-8"
        >
            {#if device.image}
                <img
                    src={device.image?.startsWith("http")
                        ? device.image
                        : `${API_URL}${device.image}`}
                    alt={device.model}
                    class="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500 drop-shadow-xl"
                />
            {:else}
                <div
                    class="flex flex-col items-center justify-center text-slate-300 dark:text-slate-700"
                >
                    <Smartphone class="h-16 w-16 mb-2" />
                </div>
            {/if}

            <!-- Brand Badge -->
            <div class="absolute bottom-3 left-3">
                <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-100 dark:border-slate-700 shadow-sm text-slate-900 dark:text-slate-100"
                >
                    {normalizeBrandDisplay(device.brand)}
                </span>
            </div>
        </div>

        <!-- Content -->
        <div class="p-5 flex-1 flex flex-col gap-2 relative">
            <div>
                <h3
                    class="font-bold text-base leading-tight text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1"
                    title={device.model}
                >
                    {device.model}
                </h3>
                <div class="flex flex-wrap gap-2 mt-2">
                    {#if device.chipset}
                        <span
                            class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-md"
                        >
                            <span
                                class="w-1.5 h-1.5 rounded-full bg-blue-500/50"
                            ></span>
                            {device.chipset}
                        </span>
                    {/if}
                    {#if device.specs}
                        <span
                            class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-md"
                        >
                            <Database class="w-3 h-3 opacity-50" />
                            {device.specs}
                        </span>
                    {/if}
                    {#if device.code}
                        <span
                            class="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800 px-1.5 py-0.5 rounded ml-auto"
                        >
                            {device.code}
                        </span>
                    {/if}
                </div>
            </div>

            {#if device.colors && device.colors.length > 0}
                <div
                    class="mt-auto pt-3 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800/50"
                >
                    {#each device.colors.slice(0, 4) as color}
                        <div
                            class="w-2.5 h-2.5 rounded-full border border-black/5 dark:border-white/10 shadow-sm ring-1 ring-inset ring-black/5"
                            style="background-color: {color.toLowerCase()};"
                            title={color}
                        ></div>
                    {/each}
                    {#if device.colors.length > 4}
                        <span class="text-[10px] font-medium text-slate-400"
                            >+{device.colors.length - 4}</span
                        >
                    {/if}
                </div>
            {/if}
        </div>
    </div>
{/snippet}

<div class="container mx-auto py-8">
    <div class="space-y-6 pb-20">
        <!-- Added padding for scroll -->
        <!-- Dashboard Header & Stats -->
        <div class="flex flex-col gap-6">
            <div>
                <h1
                    class="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400 bg-clip-text text-transparent"
                >
                    Device Database
                </h1>
                <p class="text-slate-500 dark:text-slate-400 mt-1">
                    Manage your phone specifications and inventory reference
                    data.
                </p>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                    class="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800"
                >
                    <div
                        class="absolute right-0 top-0 -mt-2 -mr-2 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl"
                    ></div>
                    <div class="flex items-center gap-4">
                        <div
                            class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500"
                        >
                            <Smartphone class="h-6 w-6" />
                        </div>
                        <div>
                            <p
                                class="text-sm font-medium text-slate-500 dark:text-slate-400"
                            >
                                Total Devices
                            </p>
                            <h3
                                class="text-2xl font-bold text-slate-900 dark:text-white"
                            >
                                {totalDevices}
                            </h3>
                        </div>
                    </div>
                </div>

                <div
                    class="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800"
                >
                    <div
                        class="absolute right-0 top-0 -mt-2 -mr-2 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl"
                    ></div>
                    <div class="flex items-center gap-4">
                        <div
                            class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500"
                        >
                            <Tags class="h-6 w-6" />
                        </div>
                        <div>
                            <p
                                class="text-sm font-medium text-slate-500 dark:text-slate-400"
                            >
                                Top Brand
                            </p>
                            <h3
                                class="text-2xl font-bold text-slate-900 dark:text-white truncate max-w-[120px]"
                                title={topBrand}
                            >
                                {normalizeBrandDisplay(topBrand)}
                            </h3>
                        </div>
                    </div>
                </div>

                <div
                    class="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800"
                >
                    <div
                        class="absolute right-0 top-0 -mt-2 -mr-2 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl"
                    ></div>
                    <div class="flex items-center gap-4">
                        <div
                            class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500"
                        >
                            <Boxes class="h-6 w-6" />
                        </div>
                        <div>
                            <p
                                class="text-sm font-medium text-slate-500 dark:text-slate-400"
                            >
                                Brands
                            </p>
                            <h3
                                class="text-2xl font-bold text-slate-900 dark:text-white"
                            >
                                {totalBrands}
                            </h3>
                        </div>
                    </div>
                </div>

                <div
                    class="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800"
                >
                    <div
                        class="absolute right-0 top-0 -mt-2 -mr-2 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl"
                    ></div>
                    <div class="flex items-center gap-4">
                        <div
                            class="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500"
                        >
                            <CheckSquare class="h-6 w-6" />
                        </div>
                        <div>
                            <p
                                class="text-sm font-medium text-slate-500 dark:text-slate-400"
                            >
                                With Specs
                            </p>
                            <div class="flex items-baseline gap-1">
                                <h3
                                    class="text-2xl font-bold text-slate-900 dark:text-white"
                                >
                                    {withSpecsCount}
                                </h3>
                                <span class="text-xs text-slate-400"
                                    >/ {totalDevices}</span
                                >
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Toolbar (Action Bar) -->
        <div
            class="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-16 z-20 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-sm"
        >
            <div class="flex items-center gap-2">
                {#if selectedIds.length > 0}
                    <Button
                        variant="destructive"
                        size="lg"
                        onclick={confirmBulkDelete}
                        class="animate-in fade-in zoom-in duration-200"
                    >
                        <Trash2 class="h-4 w-4 mr-2" />
                        Delete ({selectedIds.length})
                    </Button>
                    <Button
                        variant="ghost"
                        size="lg"
                        onclick={() => (selectedIds = [])}
                    >
                        <X class="h-4 w-4 mr-2" /> Cancel
                    </Button>
                {:else}
                    <div class="relative w-full md:w-64">
                        <Search
                            class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                        />
                        <Input
                            type="search"
                            bind:value={searchTerm}
                            placeholder="Search devices..."
                            class="pl-9 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger
                            class={cn(
                                buttonVariants({
                                    variant: "outline",
                                    size: "lg",
                                }),
                                "h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
                            )}
                        >
                            <Filter class="h-4 w-4 mr-2 text-slate-500" />
                            {selectedBrand === "all"
                                ? "All Brands"
                                : normalizeBrandDisplay(selectedBrand)}
                            <ChevronDown class="ml-2 h-4 w-4 text-slate-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            class="max-h-[300px] overflow-y-auto"
                        >
                            <DropdownMenuItem
                                onclick={() => (selectedBrand = "all")}
                            >
                                All Brands
                            </DropdownMenuItem>
                            {#each brandList as brandItem}
                                <DropdownMenuItem
                                    onclick={() =>
                                        (selectedBrand = brandItem.name)}
                                >
                                    {normalizeBrandDisplay(brandItem.name)}
                                </DropdownMenuItem>
                            {/each}
                        </DropdownMenuContent>
                    </DropdownMenu>
                {/if}
            </div>

            <div class="flex items-center gap-2">
                {#if selectedIds.length === 0}
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            class={cn(
                                buttonVariants({
                                    variant: "outline",
                                    size: "lg",
                                }),
                                "h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
                            )}
                        >
                            <FileSpreadsheet
                                class="h-4 w-4 mr-2 text-slate-500"
                            /> Actions
                            <ChevronDown class="ml-2 h-4 w-4 text-slate-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" class="w-48">
                            <DropdownMenuLabel>Import</DropdownMenuLabel>
                            <DropdownMenuItem
                                onclick={() => (isScraping = true)}
                            >
                                <Link class="mr-2 h-4 w-4" /> Scrape from URL
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onclick={() => (bulkImportOpen = true)}
                            >
                                <FileSpreadsheet class="mr-2 h-4 w-4" /> Bulk Import
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onclick={() =>
                                    document
                                        .getElementById("import-file")
                                        ?.click()}
                            >
                                <Upload class="mr-2 h-4 w-4" /> Import Excel/CSV
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Export</DropdownMenuLabel>
                            <DropdownMenuItem
                                onclick={() =>
                                    InventoryService.exportDevices("excel")}
                            >
                                <FileSpreadsheet class="mr-2 h-4 w-4" /> Export Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onclick={() =>
                                    InventoryService.exportDevices("csv")}
                            >
                                <Download class="mr-2 h-4 w-4" /> Export CSV
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        onclick={handleCreateNew}
                        size="lg"
                        class="h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 border-0"
                    >
                        <Plus class="h-4 w-4 mr-2" /> Add Device
                    </Button>
                {/if}
            </div>
        </div>

        <input
            type="file"
            id="import-file"
            class="hidden"
            accept=".xlsx,.xls,.csv"
            onchange={async (e) => {
                const file = e.currentTarget.files?.[0];
                if (file) {
                    try {
                        const res = await InventoryService.importDevices(file);
                        if (res.skipped > 0 || res.errors.length > 0) {
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
                            toast.error("Cek console untuk detail error");
                        }
                        devicesQuery.refetch();
                    } catch (e) {
                        toast.error("Gagal import file");
                    }
                    e.currentTarget.value = ""; // Reset
                }
            }}
        />

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
                                    {normalizeBrandDisplay(brandName)}
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
        <DialogContent
            class="sm:max-w-[750px] max-h-[90vh] overflow-y-auto p-0 gap-0 overflow-x-hidden"
        >
            <div
                class="px-6 py-4 border-b bg-background/95 backdrop-blur z-10 sticky top-0"
            >
                <DialogHeader>
                    <DialogTitle
                        class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                    >
                        {editingId ? "Edit Device" : "Tambah Device Baru"}
                    </DialogTitle>
                    <DialogDescription>
                        Isi informasi detail spesifikasi device handphone.
                    </DialogDescription>
                </DialogHeader>
            </div>

            <div class="p-6 space-y-6">
                <!-- Scraper Input -->
                <div
                    class="rounded-xl border border-blue-200/50 bg-blue-50/30 dark:bg-blue-900/10 p-4 space-y-3"
                >
                    <div
                        class="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold text-sm"
                    >
                        <Download class="h-4 w-4" />
                        <span>Import dari GSMArena</span>
                    </div>
                    <div class="flex gap-3">
                        <div class="relative flex-1">
                            <Link
                                class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                            />
                            <Input
                                bind:value={scrapeUrl}
                                placeholder="Paste Link (https://www.gsmarena.com/...)"
                                class="pl-9 bg-background/50 border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20"
                                disabled={isScraping}
                            />
                        </div>
                        <Button
                            onclick={handleScrape}
                            disabled={isScraping || !scrapeUrl}
                            class="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all"
                        >
                            {#if isScraping}
                                <Loader2 class="h-4 w-4 animate-spin mr-2" />
                                Analyzing...
                            {:else}
                                Fetch Data
                            {/if}
                        </Button>
                    </div>
                </div>

                <!-- Basic Info -->
                <div class="space-y-4">
                    <h4
                        class="text-sm font-semibold text-foreground/70 border-b pb-2"
                    >
                        Informasi Utama
                    </h4>

                    <div class="flex justify-center py-2">
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
                                class="text-xs font-semibold uppercase text-muted-foreground"
                                >Brand</Label
                            >
                            <Select type="single" bind:value={brand}>
                                <SelectTrigger
                                    class="bg-secondary/10 border-border/50"
                                >
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
                                class="text-xs font-semibold uppercase text-muted-foreground"
                                >Series (Optional)</Label
                            >
                            <Input
                                bind:value={series}
                                placeholder="Ex: S Series"
                                class="bg-secondary/10 border-border/50"
                            />
                        </div>
                    </div>

                    <div class="grid gap-2">
                        <Label
                            class="text-xs font-semibold uppercase text-muted-foreground"
                            >Model / Tipe</Label
                        >
                        <div class="relative">
                            <Smartphone
                                class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                            />
                            <Input
                                bind:value={model}
                                placeholder="Contoh: Galaxy S24 Ultra"
                                class="pl-9 bg-secondary/10 border-border/50 font-medium"
                            />
                        </div>
                    </div>
                </div>

                <!-- Network & Launch -->
                <div class="space-y-4">
                    <h4
                        class="text-sm font-semibold text-foreground/70 border-b pb-2 flex items-center gap-2"
                    >
                        <Network class="h-4 w-4" /> Network & Launch
                    </h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="grid gap-2">
                            <Label
                                class="text-xs font-semibold uppercase text-muted-foreground"
                                >Technology</Label
                            >
                            <Input
                                bind:value={network}
                                placeholder="GSM / HSPA / LTE / 5G"
                                class="bg-secondary/10 border-border/50"
                            />
                        </div>
                        <div class="grid gap-2">
                            <Label
                                class="text-xs font-semibold uppercase text-muted-foreground"
                                >Announced</Label
                            >
                            <div class="relative">
                                <Calendar
                                    class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                                />
                                <Input
                                    bind:value={release}
                                    placeholder="2024, January 17"
                                    class="pl-9 bg-secondary/10 border-border/50"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Hardware Specs -->
                <div class="space-y-4">
                    <h4
                        class="text-sm font-semibold text-foreground/70 border-b pb-2 flex items-center gap-2"
                    >
                        <Cpu class="h-4 w-4" /> Hardware & Platform
                    </h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="grid gap-2">
                            <Label
                                class="text-xs font-semibold uppercase text-muted-foreground"
                                >Chipset</Label
                            >
                            <Input
                                bind:value={chipset}
                                placeholder="Snapdragon 8 Gen 3"
                                class="bg-secondary/10 border-border/50"
                            />
                        </div>
                        <div class="grid gap-2">
                            <Label
                                class="text-xs font-semibold uppercase text-muted-foreground"
                                >OS</Label
                            >
                            <Input
                                bind:value={os}
                                placeholder="Android 14, One UI 6.1"
                                class="bg-secondary/10 border-border/50"
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="grid gap-2">
                            <Label
                                class="text-xs font-semibold uppercase text-muted-foreground"
                                >Storage/RAM</Label
                            >
                            <div class="relative">
                                <Database
                                    class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                                />
                                <Input
                                    bind:value={specs}
                                    placeholder="128GB/256GB"
                                    class="pl-9 bg-secondary/10 border-border/50"
                                />
                            </div>
                        </div>
                        <div class="grid gap-2">
                            <Label
                                class="text-xs font-semibold uppercase text-muted-foreground"
                                >USB Type</Label
                            >
                            <Input
                                bind:value={usb}
                                placeholder="USB Type-C 3.2"
                                class="bg-secondary/10 border-border/50"
                            />
                        </div>
                    </div>

                    <div class="grid gap-2">
                        <Label
                            class="text-xs font-semibold uppercase text-muted-foreground"
                            >Display</Label
                        >
                        <div class="grid grid-cols-2 gap-4">
                            <Input
                                bind:value={display}
                                placeholder="Size (6.8 inches)"
                                class="bg-secondary/10 border-border/50"
                            />
                            <Input
                                bind:value={displayType}
                                placeholder="Type (AMOLED 2X)"
                                class="bg-secondary/10 border-border/50"
                            />
                        </div>
                    </div>
                </div>

                <!-- Camera & Battery -->
                <div class="space-y-4">
                    <h4
                        class="text-sm font-semibold text-foreground/70 border-b pb-2 flex items-center gap-2"
                    >
                        <Camera class="h-4 w-4" /> Camera & Battery
                    </h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="grid gap-2">
                            <Label
                                class="text-xs font-semibold uppercase text-muted-foreground"
                                >Main Camera</Label
                            >
                            <Input
                                bind:value={mainCamera}
                                placeholder="200 MP + 50 MP + ..."
                                class="bg-secondary/10 border-border/50"
                            />
                        </div>
                        <div class="grid gap-2">
                            <Label
                                class="text-xs font-semibold uppercase text-muted-foreground"
                                >Selfie Camera</Label
                            >
                            <Input
                                bind:value={selfieCamera}
                                placeholder="12 MP"
                                class="bg-secondary/10 border-border/50"
                            />
                        </div>
                    </div>
                    <div class="grid gap-2">
                        <Label
                            class="text-xs font-semibold uppercase text-muted-foreground"
                            >Battery</Label
                        >
                        <div class="relative">
                            <Battery
                                class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                            />
                            <Input
                                bind:value={battery}
                                placeholder="5000 mAh, 45W wired"
                                class="pl-9 bg-secondary/10 border-border/50"
                            />
                        </div>
                    </div>
                </div>

                <!-- Other -->
                <div class="space-y-4">
                    <h4
                        class="text-sm font-semibold text-foreground/70 border-b pb-2"
                    >
                        Lainnya
                    </h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="grid gap-2">
                            <Label
                                class="text-xs font-semibold uppercase text-muted-foreground"
                                >Kode Mesin</Label
                            >
                            <div class="relative">
                                <QrCode
                                    class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                                />
                                <Input
                                    bind:value={code}
                                    placeholder="SM-S928B"
                                    class="pl-9 font-mono bg-secondary/10 border-border/50"
                                />
                            </div>
                        </div>
                        <div class="grid gap-2">
                            <Label
                                class="text-xs font-semibold uppercase text-muted-foreground"
                                >Warna</Label
                            >
                            <div class="relative">
                                <Palette
                                    class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                                />
                                <Input
                                    bind:value={colors}
                                    placeholder="Hitam, Putih"
                                    class="pl-9 bg-secondary/10 border-border/50"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                class="p-6 border-t bg-background/95 backdrop-blur z-10 sticky bottom-0"
            >
                <DialogFooter>
                    <Button
                        variant="outline"
                        onclick={() => (open = false)}
                        class="mr-2">Batal</Button
                    >
                    <Button
                        onclick={handleSubmit}
                        disabled={createDeviceMutation.isPending ||
                            updateMutation.isPending}
                        class="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                    >
                        {#if createDeviceMutation.isPending || updateMutation.isPending}
                            <Loader2 class="h-4 w-4 animate-spin mr-2" />
                            Saving...
                        {:else}
                            Simpan Data
                        {/if}
                    </Button>
                </DialogFooter>
            </div>
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
                                    >{normalizeBrandDisplay(
                                        selectedDevice.brand,
                                    )}</Badge
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
                            <div>
                                <h4 class="font-medium text-sm">
                                    Ditemukan {bulkImportList.length} device
                                </h4>
                                <p class="text-xs text-muted-foreground mt-1">
                                    {bulkImportList.filter((i) => i.selected)
                                        .length} dipilih • Estimasi: ~{Math.ceil(
                                        (bulkImportList.filter(
                                            (i) => i.selected,
                                        ).length *
                                            10) /
                                            60,
                                    )} menit
                                </p>
                            </div>
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
                                <div class="flex flex-col">
                                    <span>Proses Import...</span>
                                    {#if bulkImportStep === "progress" && bulkImportProgress.current > 0 && bulkImportProgress.estimatedTimeLeft > 0}
                                        <span
                                            class="text-xs text-muted-foreground"
                                        >
                                            Estimasi waktu tersisa: {formatTime(
                                                bulkImportProgress.estimatedTimeLeft,
                                            )}
                                        </span>
                                    {/if}
                                </div>
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
