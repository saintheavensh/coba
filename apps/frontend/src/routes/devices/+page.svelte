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
        MoreHorizontal,
        Search,
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

    // UI State
    const queryClient = useQueryClient();
    let searchTerm = $state("");

    // Query
    const devicesQuery = createQuery(() => ({
        queryKey: ["devices", searchTerm],
        queryFn: () => InventoryService.getDevices(searchTerm),
    }));

    let devices = $derived(devicesQuery.data || []);

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

    let deleteOpen = $state(false);
    let deletingId = $state<string | null>(null);

    function resetForm() {
        editingId = null;
        brand = "";
        model = "";
        code = "";
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
        };

        if (editingId) {
            updateMutation.mutate({ id: editingId, data: payload });
        } else {
            createDeviceMutation.mutate(payload);
        }
    }
</script>

<div class="container mx-auto py-6 space-y-6">
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
        <div>
            <h2 class="text-3xl font-bold tracking-tight">Data Device</h2>
            <p class="text-muted-foreground">
                Kelola database handphone untuk referensi service.
            </p>
        </div>
        <Button onclick={handleCreateNew}>
            <Plus class="h-4 w-4 mr-2" /> Tambah Device
        </Button>
    </div>

    <!-- Search Bar -->
    <div
        class="flex items-center space-x-2 bg-white p-2 rounded-lg border w-full md:max-w-sm"
    >
        <Search class="h-4 w-4 text-muted-foreground" />
        <Input
            bind:value={searchTerm}
            placeholder="Cari Brand, Model atau Kode..."
            class="border-0 focus-visible:ring-0 px-0 h-auto"
        />
    </div>

    <!-- Dialog -->
    <Dialog bind:open onOpenChange={(isOpen) => !isOpen && resetForm()}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    {editingId ? "Edit Device" : "Tambah Device Baru"}
                </DialogTitle>
                <DialogDescription>
                    Isi informasi detail device.
                </DialogDescription>
            </DialogHeader>

            <div class="grid gap-4 py-4">
                <div class="grid gap-2">
                    <Label>Brand (Merek)</Label>
                    <Input
                        bind:value={brand}
                        placeholder="Contoh: Samsung, Apple, Xiaomi"
                    />
                </div>

                <div class="grid gap-2">
                    <Label>Model (Tipe)</Label>
                    <Input
                        bind:value={model}
                        placeholder="Contoh: Galaxy S24, iPhone 15"
                    />
                </div>

                <div class="grid gap-2">
                    <Label>Kode Mesin / Model Number (Opsional)</Label>
                    <Input
                        bind:value={code}
                        placeholder="Contoh: SM-S928B, A3090"
                    />
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onclick={() => (open = false)}
                    >Batal</Button
                >
                <Button onclick={handleSubmit}>Simpan</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <!-- Table -->
    <div class="rounded-md border bg-card">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead class="text-right w-[100px]">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#if devicesQuery.isLoading}
                    {#each Array(5) as _}
                        <TableRow>
                            <TableCell><Skeleton class="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton class="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton class="h-4 w-24" /></TableCell>
                            <TableCell
                                ><Skeleton class="h-8 w-8 ml-auto" /></TableCell
                            >
                        </TableRow>
                    {/each}
                {:else if devices.length === 0}
                    <TableRow>
                        <TableCell
                            colspan={4}
                            class="h-24 text-center text-muted-foreground"
                        >
                            {#if searchTerm}
                                Tidak ditemukan device dengan kata kunci "{searchTerm}".
                            {:else}
                                Belum ada data device. Silakan tambah baru.
                            {/if}
                        </TableCell>
                    </TableRow>
                {:else}
                    {#each devices as device}
                        <TableRow class="hover:bg-muted/50">
                            <TableCell class="font-medium">
                                <span
                                    class="uppercase tracking-wider text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md"
                                >
                                    {device.brand}
                                </span>
                            </TableCell>
                            <TableCell class="font-semibold text-base"
                                >{device.model}</TableCell
                            >
                            <TableCell
                                class="text-muted-foreground font-mono text-sm"
                                >{device.code || "-"}</TableCell
                            >
                            <TableCell class="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        class={buttonVariants({
                                            variant: "ghost",
                                            size: "icon",
                                            className: "h-8 w-8",
                                        })}
                                    >
                                        <MoreHorizontal class="h-4 w-4" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onclick={() => handleEdit(device)}
                                        >
                                            <Pencil class="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            class="text-red-600"
                                            onclick={() =>
                                                confirmDelete(device.id)}
                                        >
                                            <Trash2 class="mr-2 h-4 w-4" /> Hapus
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    {/each}
                {/if}
            </TableBody>
        </Table>
    </div>

    <AlertDialog bind:open={deleteOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Hapus Device?</AlertDialogTitle>
                <AlertDialogDescription>
                    Tindakan ini tidak dapat dibatalkan. Pastikan data ini sudah
                    tidak digunakan.
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
