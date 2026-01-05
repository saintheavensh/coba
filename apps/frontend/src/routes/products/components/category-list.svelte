<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
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
        DialogFooter,
        DialogDescription,
    } from "$lib/components/ui/dialog";
    import { Pencil, Trash2, Plus } from "lucide-svelte";
    import { toast } from "svelte-sonner";

    let categories: any[] = [];
    let loading = false;
    let open = false;
    let editingId: string | null = null;

    // Form
    let name = "";
    let description = "";

    async function load() {
        try {
            categories = await api("/categories");
        } catch (e) {
            console.error(e);
        }
    }

    onMount(() => {
        load();
    });

    function reset() {
        name = "";
        description = "";
        editingId = null;
    }

    function handleEdit(cat: any) {
        editingId = cat.id;
        name = cat.name;
        description = cat.description || "";
        open = true;
    }

    async function handleDelete(id: string) {
        if (!confirm("Hapus kategori ini?")) return;
        try {
            await api(`/categories/${id}`, { method: "DELETE" });
            toast.success("Kategori dihapus");
            load();
        } catch (e) {
            // handled by api
        }
    }

    async function handleSubmit() {
        if (!name) return toast.error("Nama wajib diisi");

        loading = true;
        try {
            if (editingId) {
                await api(`/categories/${editingId}`, {
                    method: "PUT",
                    body: { name, description },
                });
                toast.success("Kategori diupdate");
            } else {
                await api("/categories", {
                    method: "POST",
                    body: { name, description },
                });
                toast.success("Kategori dibuat");
            }
            open = false;
            reset();
            load();
        } catch (e) {
            // handled
        } finally {
            loading = false;
        }
    }
</script>

<div class="space-y-4">
    <div class="flex justify-between items-center">
        <h3 class="text-lg font-medium">Daftar Kategori</h3>
        <Button onclick={() => (open = true)} size="sm">
            <Plus class="h-4 w-4 mr-2" /> Tambah Kategori
        </Button>
    </div>

    <div class="rounded-md border">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nama Kategori</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#if categories.length === 0}
                    <TableRow>
                        <TableCell
                            colspan={3}
                            class="text-center h-24 text-muted-foreground"
                        >
                            Belum ada kategori.
                        </TableCell>
                    </TableRow>
                {:else}
                    {#each categories as cat}
                        <TableRow>
                            <TableCell class="font-medium">{cat.name}</TableCell
                            >
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
                                    class="text-red-600"
                                    onclick={() => handleDelete(cat.id)}
                                >
                                    <Trash2 class="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    {/each}
                {/if}
            </TableBody>
        </Table>
    </div>

    <Dialog bind:open onOpenChange={(isOpen) => !isOpen && reset()}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle
                    >{editingId ? "Edit" : "Tambah"} Kategori</DialogTitle
                >
                <DialogDescription
                    >Kelola master data kategori produk.</DialogDescription
                >
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label class="text-right">Nama</Label>
                    <Input
                        bind:value={name}
                        class="col-span-3"
                        placeholder="Contoh: Handphone"
                    />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label class="text-right">Deskripsi</Label>
                    <Input
                        bind:value={description}
                        class="col-span-3"
                        placeholder="Opsional"
                    />
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
