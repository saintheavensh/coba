<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { InventoryService } from "$lib/services/inventory.service";
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import * as Table from "$lib/components/ui/table";
    import { Badge } from "$lib/components/ui/badge";
    import { Input } from "$lib/components/ui/input";
    import { toast } from "svelte-sonner";
    import { goto } from "$app/navigation";
    import { formatDate } from "$lib/utils";
    import {
        Check,
        X,
        Save,
        AlertTriangle,
        ChevronLeft,
        Printer,
        CheckCircle2,
        Loader2,
        Search,
    } from "lucide-svelte";

    const sessionId = page.params.id;
    let session = $state<any>(null);
    let isLoading = $state(true);
    let isSaving = $state(false);
    let searchTerm = $state("");

    // Local changes tracker
    let items = $state<any[]>([]);

    onMount(async () => {
        await fetchSession();
    });

    async function fetchSession() {
        isLoading = true;
        try {
            session = await InventoryService.getOpnameSessionDetails(
                sessionId as string,
            );
            if (session) {
                items = [...session.items];
            }
        } catch (error) {
            toast.error("Failed to fetch session details");
        } finally {
            isLoading = false;
        }
    }

    async function updateItem(item: any) {
        try {
            const result = await InventoryService.updateOpnameItem(item.id, {
                physicalStock: item.physicalStock,
                reason: item.adjustmentReason,
            });
            item.difference = result.difference;
            toast.success(`Updated ${item.product?.name}`);
        } catch (error) {
            toast.error("Failed to update item");
        }
    }

    async function handleFinalize() {
        if (
            !confirm(
                "Are you sure you want to finalize this session? This will update system stock levels.",
            )
        )
            return;

        isSaving = true;
        try {
            await InventoryService.finalizeOpnameSession(sessionId as string);
            toast.success("Session finalized successfully");
            await fetchSession();
        } catch (error) {
            toast.error("Failed to finalize session");
        } finally {
            isSaving = false;
        }
    }

    async function handleCancel() {
        if (!confirm("Cancel this session? All counts will be lost.")) return;

        try {
            await InventoryService.cancelOpnameSession(sessionId as string);
            toast.success("Session cancelled");
            goto("/inventory/opname");
        } catch (error) {
            toast.error("Failed to cancel session");
        }
    }

    function calculateTotalDifference() {
        return items.reduce((acc, item) => acc + (item.difference || 0), 0);
    }

    const filteredItems = $derived(
        items.filter(
            (item) =>
                item.product?.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                item.variantName
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()),
        ),
    );
</script>

<div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <Button
                variant="outline"
                size="icon"
                onclick={() => goto("/inventory/opname")}
            >
                <ChevronLeft class="h-4 w-4" />
            </Button>
            <div>
                <div class="flex items-center gap-2">
                    <h1 class="text-3xl font-bold tracking-tight">
                        Session Detail
                    </h1>
                    {#if session}
                        <Badge
                            variant={session.status === "completed"
                                ? "default"
                                : session.status === "draft"
                                  ? "secondary"
                                  : "destructive"}
                            class="capitalize"
                        >
                            {session.status}
                        </Badge>
                    {/if}
                </div>
                <p class="text-muted-foreground font-mono text-xs">
                    {sessionId}
                </p>
            </div>
        </div>
        <div class="flex items-center gap-2">
            {#if session?.status === "draft"}
                <Button
                    variant="outline"
                    onclick={handleCancel}
                    disabled={isSaving}>Batal</Button
                >
                <Button
                    variant="default"
                    onclick={handleFinalize}
                    disabled={isSaving}
                >
                    {#if isSaving}
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    {/if}
                    Selesaikan & Update Stok
                </Button>
            {/if}
            <Button variant="outline">
                <Printer class="mr-2 h-4 w-4" />
                Cetak Laporan
            </Button>
        </div>
    </div>

    {#if isLoading}
        <div class="h-64 flex items-center justify-center">
            <Loader2 class="h-8 w-8 animate-spin text-primary" />
        </div>
    {:else if session}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card class="p-4 space-y-4">
                <h3
                    class="font-semibold text-sm text-muted-foreground uppercase tracking-wider"
                >
                    Info Sesi
                </h3>
                <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-muted-foreground">Dibuat Oleh:</span>
                        <span class="font-medium">{session.user?.name}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-muted-foreground">Kapan:</span>
                        <span class="font-medium"
                            >{formatDate(session.createdAt)}</span
                        >
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-muted-foreground">Status:</span>
                        <span class="font-medium capitalize"
                            >{session.status}</span
                        >
                    </div>
                </div>
            </Card>

            <Card class="p-4 space-y-4">
                <h3
                    class="font-semibold text-sm text-muted-foreground uppercase tracking-wider"
                >
                    Statistik
                </h3>
                <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-muted-foreground">Total Item:</span>
                        <span class="font-medium">{items.length}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-muted-foreground"
                            >Item Terhitung:</span
                        >
                        <span class="font-medium"
                            >{items.filter((i) => i.physicalStock !== null)
                                .length}</span
                        >
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-muted-foreground"
                            >Akumulasi Selisih:</span
                        >
                        <span
                            class="font-medium"
                            class:text-destructive={calculateTotalDifference() !==
                                0}
                        >
                            {calculateTotalDifference()}
                        </span>
                    </div>
                </div>
            </Card>

            <Card class="p-4 md:col-span-2 space-y-4">
                <h3
                    class="font-semibold text-sm text-muted-foreground uppercase tracking-wider"
                >
                    Catatan Sesi
                </h3>
                <p class="text-sm italic">
                    {session.notes || "Tidak ada catatan."}
                </p>
            </Card>
        </div>

        <Card class="p-0 overflow-hidden">
            <div class="p-4 bg-muted/30 border-b flex items-center gap-4">
                <div class="relative flex-1">
                    <Search
                        class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                        bind:value={searchTerm}
                        placeholder="Cari produk atau batch ID..."
                        class="pl-9 bg-background"
                    />
                </div>
            </div>
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head>Produk</Table.Head>
                        <Table.Head>Varian</Table.Head>
                        <Table.Head class="text-center">Stok Sistem</Table.Head>
                        <Table.Head class="text-center">Fisik</Table.Head>
                        <Table.Head class="text-center">Selisih</Table.Head>
                        <Table.Head>Keterangan</Table.Head>
                        {#if session.status === "draft"}
                            <Table.Head class="text-right">Simpan</Table.Head>
                        {/if}
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {#each filteredItems as item}
                        <Table.Row>
                            <Table.Cell>
                                <div class="font-medium">
                                    {item.product?.name}
                                </div>
                            </Table.Cell>
                            <Table.Cell>
                                <div class="font-medium">
                                    {item.variantName || "Standard"}
                                </div>
                            </Table.Cell>
                            <Table.Cell
                                class="text-center font-semibold text-blue-600"
                            >
                                {item.systemStock}
                            </Table.Cell>
                            <Table.Cell class="w-32">
                                {#if session.status === "draft"}
                                    <Input
                                        type="number"
                                        bind:value={item.physicalStock}
                                        class="text-center"
                                        onchange={() =>
                                            (item.difference =
                                                (item.physicalStock || 0) -
                                                item.systemStock)}
                                    />
                                {:else}
                                    <div class="text-center font-bold">
                                        {item.physicalStock ?? "-"}
                                    </div>
                                {/if}
                            </Table.Cell>
                            <Table.Cell class="text-center">
                                {#if item.physicalStock !== null}
                                    <Badge
                                        variant={item.difference === 0
                                            ? "secondary"
                                            : item.difference > 0
                                              ? "default"
                                              : "destructive"}
                                    >
                                        {item.difference > 0
                                            ? `+${item.difference}`
                                            : item.difference}
                                    </Badge>
                                {:else}
                                    <span class="text-muted-foreground">-</span>
                                {/if}
                            </Table.Cell>
                            <Table.Cell>
                                {#if session.status === "draft"}
                                    <Input
                                        bind:value={item.adjustmentReason}
                                        placeholder="Alasan..."
                                    />
                                {:else}
                                    <span class="text-sm"
                                        >{item.adjustmentReason || "-"}</span
                                    >
                                {/if}
                            </Table.Cell>
                            {#if session.status === "draft"}
                                <Table.Cell class="text-right">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onclick={() => updateItem(item)}
                                    >
                                        <Save class="h-4 w-4" />
                                    </Button>
                                </Table.Cell>
                            {/if}
                        </Table.Row>
                    {/each}
                </Table.Body>
            </Table.Root>
        </Card>
    {/if}
</div>
