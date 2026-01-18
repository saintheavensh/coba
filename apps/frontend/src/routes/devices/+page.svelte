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
        Smartphone,
        Search,
        Filter,
        MoreVertical,
    } from "lucide-svelte";
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
        SelectValue,
    } from "$lib/components/ui/select";
    import ImageUpload from "$lib/components/custom/image-upload.svelte";
    import { DEFAULT_BRANDS } from "@repo/shared";
    import { API_URL } from "$lib/api";

    // UI State
    const queryClient = useQueryClient();
    let searchTerm = $state("");
    let selectedBrand = $state("all");

    // Query
    const devicesQuery = createQuery(() => ({
        queryKey: ["devices", searchTerm],
        queryFn: () => InventoryService.getDevices(searchTerm),
    }));

    // Derived filtered devices (Client-side brand filter + Search query from API)
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
    let model = $state("");
    let code = $state("");
    let image = $state("");

    let deleteOpen = $state(false);
    let deletingId = $state<string | null>(null);

    function resetForm() {
        editingId = null;
        brand = "";
        model = "";
        code = "";
        image = "";
    }

    function handleCreateNew() {
        resetForm();
        open = true;
    }

    function handleEdit(device: any) {
        editingId = device.id;
        brand = device.brand;
        model = device.model;
        code = device.code || "";
        image = device.image || "";
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
            model,
            code: code || undefined,
            image: image || undefined,
        };

        if (editingId) {
            updateMutation.mutate({ id: editingId, data: payload });
        } else {
            createDeviceMutation.mutate(payload);
        }
    }
</script>

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
            <Button onclick={handleCreateNew} size="lg" class="shadow-sm">
                <Plus class="h-5 w-5 mr-2" /> Tambah Device
            </Button>
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
                                    : selectedBrand}</span
                            >
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Brand</SelectItem>
                        {#each DEFAULT_BRANDS as b}
                            <SelectItem value={b}>{b}</SelectItem>
                        {/each}
                    </SelectContent>
                </Select>
            </div>
        </div>

        <!-- Content Grid -->
        {#if devicesQuery.isLoading}
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {#each Array(10) as _}
                    <div class="space-y-3">
                        <Skeleton class="h-[200px] w-full rounded-xl" />
                        <div class="space-y-2">
                            <Skeleton class="h-4 w-[80%]" />
                            <Skeleton class="h-3 w-[50%]" />
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
            <div
                class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-in fade-in duration-500"
            >
                {#each devices as device (device.id)}
                    <div
                        class="group relative flex flex-col bg-card border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                    >
                        <!-- Card Menu -->
                        <div
                            class="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        class="h-8 w-8 rounded-full shadow-sm bg-white/90 backdrop-blur-sm"
                                    >
                                        <MoreVertical class="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onclick={() => handleEdit(device)}
                                    >
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
                                    src={`${API_URL}${device.image}`}
                                    alt={device.model}
                                    class="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                                />
                            {:else}
                                <div
                                    class="text-center text-muted-foreground/30"
                                >
                                    <Smartphone
                                        class="h-16 w-16 mx-auto mb-2"
                                    />
                                    <span
                                        class="text-xs font-bold uppercase tracking-widest"
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
                        <div class="p-4 flex-1 flex flex-col">
                            <h3
                                class="font-semibold text-lg leading-tight mb-1 group-hover:text-primary transition-colors"
                            >
                                {device.model}
                            </h3>
                            {#if device.code}
                                <p
                                    class="text-xs text-muted-foreground font-mono bg-muted/50 self-start px-1.5 py-0.5 rounded"
                                >
                                    {device.code}
                                </p>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Dialog -->
    <Dialog bind:open onOpenChange={(isOpen) => !isOpen && resetForm()}>
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>
                    {editingId ? "Edit Device" : "Tambah Device Baru"}
                </DialogTitle>
                <DialogDescription>
                    Isi informasi detail spesifikasi device handphone.
                </DialogDescription>
            </DialogHeader>

            <div class="grid gap-4 py-4">
                <div class="flex justify-center mb-2">
                    <ImageUpload bind:value={image} />
                </div>

                <div class="grid gap-2">
                    <Label
                        class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                        >Brand</Label
                    >
                    <Select type="single" bind:value={brand}>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih Brand" />
                        </SelectTrigger>
                        <SelectContent>
                            {#each DEFAULT_BRANDS as b}
                                <SelectItem value={b}>{b}</SelectItem>
                            {/each}
                        </SelectContent>
                    </Select>
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

                <div class="grid gap-2">
                    <Label
                        class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                        >Kode Mesin (Opsional)</Label
                    >
                    <Input
                        bind:value={code}
                        placeholder="Contoh: SM-S928B"
                        class="font-mono"
                    />
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
