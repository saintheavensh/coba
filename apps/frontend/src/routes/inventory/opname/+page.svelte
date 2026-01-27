<script lang="ts">
    import { onMount } from "svelte";
    import { InventoryService } from "$lib/services/inventory.service";
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import * as Table from "$lib/components/ui/table";
    import { Badge } from "$lib/components/ui/badge";
    import {
        Plus,
        Search,
        Calendar,
        User,
        ClipboardList,
        ArrowRight,
        Package,
    } from "lucide-svelte";
    import { Input } from "$lib/components/ui/input";
    import { toast } from "svelte-sonner";
    import { goto } from "$app/navigation";
    import { formatDate } from "$lib/utils";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Select from "$lib/components/ui/select";
    import { Label } from "$lib/components/ui/label";

    let sessions = $state<any[]>([]);
    let isLoading = $state(true);
    let categories = $state<any[]>([]);
    let isCreateDialogOpen = $state(false);

    let newSessionNote = $state("");
    let selectedCategoryId = $state("");

    onMount(async () => {
        await Promise.all([fetchSessions(), fetchCategories()]);
    });

    async function fetchSessions() {
        isLoading = true;
        try {
            sessions = await InventoryService.getOpnameSessions();
        } catch (error) {
            toast.error("Failed to fetch sessions");
        } finally {
            isLoading = false;
        }
    }

    async function fetchCategories() {
        try {
            categories = await InventoryService.getCategories();
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    }

    async function handleCreateSession() {
        try {
            const result = await InventoryService.createOpnameSession({
                notes: newSessionNote,
                categoryId: selectedCategoryId || undefined,
            });
            toast.success("Stock opname session created");
            isCreateDialogOpen = false;
            goto(`/inventory/opname/${result.id}`);
        } catch (error) {
            toast.error("Failed to create session");
        }
    }

    function getStatusVariant(status: string) {
        switch (status) {
            case "completed":
                return "default";
            case "draft":
                return "secondary";
            case "cancelled":
                return "destructive";
            default:
                return "outline";
        }
    }
</script>

<div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl font-bold tracking-tight">Stock Opname</h1>
            <p class="text-muted-foreground">
                Manage and track inventory audit sessions.
            </p>
        </div>
        <Button onclick={() => (isCreateDialogOpen = true)}>
            <Plus class="mr-2 h-4 w-4" />
            Mulai Opname Baru
        </Button>
    </div>

    <Card class="p-0 overflow-hidden">
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head>ID Sesi</Table.Head>
                    <Table.Head>Tanggal Mulai</Table.Head>
                    <Table.Head>Petugas</Table.Head>
                    <Table.Head>Status</Table.Head>
                    <Table.Head>Selesai Pada</Table.Head>
                    <Table.Head>Catatan</Table.Head>
                    <Table.Head class="text-right">Aksi</Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#if isLoading}
                    <Table.Row>
                        <Table.Cell colspan={7} class="text-center py-8">
                            <span class="animate-pulse">Memuat data...</span>
                        </Table.Cell>
                    </Table.Row>
                {:else if sessions.length === 0}
                    <Table.Row>
                        <Table.Cell
                            colspan={7}
                            class="text-center py-12 text-muted-foreground"
                        >
                            <Package
                                class="mx-auto h-12 w-12 opacity-20 mb-4"
                            />
                            Belum ada sesi stock opname.
                        </Table.Cell>
                    </Table.Row>
                {:else}
                    {#each sessions as session}
                        <Table.Row>
                            <Table.Cell class="font-mono text-xs"
                                >{session.id}</Table.Cell
                            >
                            <Table.Cell
                                >{formatDate(session.createdAt)}</Table.Cell
                            >
                            <Table.Cell>
                                <div class="flex items-center gap-2">
                                    <div
                                        class="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center"
                                    >
                                        <User class="h-3 w-3 text-primary" />
                                    </div>
                                    <span class="text-sm"
                                        >{session.user?.name || "Unknown"}</span
                                    >
                                </div>
                            </Table.Cell>
                            <Table.Cell>
                                <Badge
                                    variant={getStatusVariant(session.status)}
                                    class="capitalize"
                                >
                                    {session.status}
                                </Badge>
                            </Table.Cell>
                            <Table.Cell>
                                {session.completedAt
                                    ? formatDate(session.completedAt)
                                    : "-"}
                            </Table.Cell>
                            <Table.Cell class="max-w-xs truncate"
                                >{session.notes || "-"}</Table.Cell
                            >
                            <Table.Cell class="text-right">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onclick={() =>
                                        goto(`/inventory/opname/${session.id}`)}
                                >
                                    <ArrowRight class="h-4 w-4" />
                                </Button>
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                {/if}
            </Table.Body>
        </Table.Root>
    </Card>

    <Dialog.Root bind:open={isCreateDialogOpen}>
        <Dialog.Content>
            <Dialog.Header>
                <Dialog.Title>Mulai Sesi Stock Opname</Dialog.Title>
                <Dialog.Description>
                    Pilih kategori atau biarkan kosong untuk audit seluruh stok.
                </Dialog.Description>
            </Dialog.Header>
            <div class="space-y-4 py-4">
                <div class="space-y-2">
                    <Label for="category-select"
                        >Kategori Produk (Opsional)</Label
                    >
                    <Select.Root type="single" bind:value={selectedCategoryId}>
                        <Select.Trigger id="category-select">
                            {categories.find((c) => c.id === selectedCategoryId)
                                ?.name || "Semua Kategori"}
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Item value="">Semua Kategori</Select.Item>
                            {#each categories as cat}
                                <Select.Item value={cat.id}
                                    >{cat.name}</Select.Item
                                >
                            {/each}
                        </Select.Content>
                    </Select.Root>
                </div>
                <div class="space-y-2">
                    <Label for="session-note">Catatan Sesi</Label>
                    <Input
                        id="session-note"
                        bind:value={newSessionNote}
                        placeholder="Contoh: Audit Bulanan Gudang B"
                    />
                </div>
            </div>
            <Dialog.Footer>
                <Button
                    variant="outline"
                    onclick={() => (isCreateDialogOpen = false)}>Batal</Button
                >
                <Button onclick={handleCreateSession}>Mulai Sesi</Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>
</div>
