<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
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
        DialogTrigger,
        DialogFooter,
    } from "$lib/components/ui/dialog";
    import { Label } from "$lib/components/ui/label";
    import { toast } from "svelte-sonner";
    import { Pencil, Trash2, Plus } from "lucide-svelte";
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

    let categories: any[] = [];
    let open = false;
    let loading = false;
    let editingId: string | null = null;

    // Delete state
    let deleteOpen = false;
    let deletingId: string | null = null;

    let newName = "";
    let newDescription = "";

    async function loadCategories() {
        try {
            categories = await api("/categories");
        } catch (e) {
            console.error(e);
        }
    }

    onMount(() => {
        loadCategories();
    });

    function resetForm() {
        newName = "";
        newDescription = "";
        editingId = null;
    }

    function handleEdit(cat: any) {
        editingId = cat.id;
        newName = cat.name;
        newDescription = cat.description || "";
        open = true;
    }

    function confirmDelete(id: string) {
        deletingId = id;
        deleteOpen = true;
    }

    async function handleDelete() {
        if (!deletingId) return;

        try {
            await api(`/categories/${deletingId}`, { method: "DELETE" });
            toast.success("Kategori dihapus");
            loadCategories();
        } catch (e: any) {
            toast.error(e.message || "Gagal menghapus");
        } finally {
            deleteOpen = false;
            deletingId = null;
        }
    }

    async function handleSubmit() {
        if (!newName) return toast.error("Nama wajib diisi");

        loading = true;
        try {
            if (editingId) {
                await api(`/categories/${editingId}`, {
                    method: "PUT",
                    body: { name: newName, description: newDescription },
                });
                toast.success("Update berhasil");
            } else {
                await api("/categories", {
                    method: "POST",
                    body: { name: newName, description: newDescription },
                });
                toast.success("Kategori dibuat");
            }
            open = false;
            resetForm();
            loadCategories();
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold tracking-tight">Kategori Produk</h2>
        <Dialog bind:open onOpenChange={(o) => !o && resetForm()}>
            <DialogTrigger>
                <Button><Plus class="mr-2 h-4 w-4" /> Kategori Baru</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle
                        >{editingId
                            ? "Edit Kategori"
                            : "Buat Kategori"}</DialogTitle
                    >
                </DialogHeader>
                <div class="grid gap-4 py-4">
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Nama</Label>
                        <Input bind:value={newName} class="col-span-3" />
                    </div>
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Deskripsi</Label>
                        <Input bind:value={newDescription} class="col-span-3" />
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

    <div class="rounded-md border bg-card">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#each categories as cat}
                    <TableRow>
                        <TableCell class="font-medium">{cat.name}</TableCell>
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
                                class="text-red-500"
                                onclick={() => confirmDelete(cat.id)}
                            >
                                <Trash2 class="h-4 w-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                {/each}
            </TableBody>
        </Table>
    </div>
    <AlertDialog bind:open={deleteOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
                <AlertDialogDescription>
                    Tindakan ini permanen. Kategori yang dihapus tidak dapat
                    dikembalikan. Pastikan tidak ada produk yang menggunakan
                    kategori ini.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                    class="bg-red-600 hover:bg-red-700"
                    onclick={handleDelete}>Hapus</AlertDialogAction
                >
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</div>
