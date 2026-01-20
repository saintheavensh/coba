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
    } from "lucide-svelte";
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
        if (!deletingId) return;
        deleteMutation.mutate(deletingId);
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

    function openDetail(device: any) {
        selectedDevice = device;
        detailOpen = true;
    }
</script>

{#snippet deviceCard(device: any)}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="group relative flex flex-col bg-card border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
        onclick={() => openDetail(device)}
    >
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
                <Button variant="outline" href="/brands" size="lg">
                    Kelola Brand
                </Button>
                <Button onclick={handleCreateNew} size="lg" class="shadow-sm">
                    <Plus class="h-5 w-5 mr-2" /> Tambah Device
                </Button>
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
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                    class="bg-red-500 hover:bg-red-600"
                    onclick={handleDelete}
                >
                    Hapus
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</div>
