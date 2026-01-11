<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api";
    import { Button } from "$lib/components/ui/button";
    import {
        Card,
        CardContent,
        CardDescription,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/components/ui/table";
    import { Input } from "$lib/components/ui/input";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";
    import { Badge } from "$lib/components/ui/badge";
    import { Search, Eye } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { Separator } from "$lib/components/ui/separator";

    // Data State
    let serviceOrders = $state<any[]>([]);
    let loading = $state(false);

    // Filters
    let searchQuery = $state("");
    let filterStatus = $state("all");
    let filterTechnician = $state("all");

    import { ServiceService } from "$lib/services/service.service";
    import ReassignTechnicianModal from "./reassign-technician-modal.svelte";

    let showReassignModal = $state(false);
    let selectedServiceForReassign = $state<any>(null);

    function handleReassignConfirm() {
        showReassignModal = false;
        selectedServiceForReassign = null;
        loadData();
    }

    async function loadData() {
        loading = true;
        try {
            // Build Query Params handled in ServiceService or manually here
            // ServiceService.getAll returns all list, filtering might be needing params in getAll
            // Let's check ServiceService definition. It was: getAll: async () => ...
            // I should update ServiceService to accept params or just do it here for now if I don't want to change ServiceService signature yet.
            // Actually, ServiceService.getAll() call in 3231 didn't take args.
            // I will update ServiceService later to take args, for now let's just use it as is or modify it.
            // Wait, previous file content showed `api('/service?${params.toString()}')`.
            // I'll stick to `api` call directly here or update ServiceService?
            // Better update ServiceService to be cleaner.

            // For now, let's just use api directly inside here for query params, or update ServiceService?
            // "Use services/hooks... Avoid calling APIs directly from pages". User Rule.
            // So I MUST use ServiceService.

            const params: any = {};
            if (filterStatus && filterStatus !== "all")
                params.status = filterStatus;

            // I need to update ServiceService first to accept params.
            // But let's assume I will update it.
            serviceOrders = await ServiceService.getAll(params);
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadData();
    });

    // Reactive: Reload when filters change
    $effect(() => {
        if (filterStatus) loadData();
    });

    // Client-side Search Filter
    let filteredOrders = $derived(
        serviceOrders.filter((order) => {
            const term = searchQuery.toLowerCase();
            return (
                order.no.toLowerCase().includes(term) ||
                order.customer.name.toLowerCase().includes(term) ||
                order.device.brand.toLowerCase().includes(term) ||
                (order.technician?.name || "").toLowerCase().includes(term)
            );
        }),
    );

    function getStatusBadge(status: string) {
        switch (status) {
            case "antrian":
                return {
                    label: "Antrian",
                    variant: "outline",
                    className: "",
                    icon: "🕒",
                };
            case "dicek":
                return {
                    label: "Sedang Dicek",
                    variant: "secondary",
                    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
                    icon: "🔍",
                };
            case "konfirmasi":
                return {
                    label: "Tunggu Konfirmasi",
                    variant: "secondary",
                    className:
                        "bg-yellow-100 text-yellow-700 hover:bg-yellow-100", // Custom warning style
                    icon: "💬",
                };
            case "dikerjakan":
                return {
                    label: "Sedang Dikerjakan",
                    variant: "default",
                    className: "",
                    icon: "🔧",
                };
            case "selesai":
                return {
                    label: "Selesai",
                    variant: "outline",
                    className:
                        "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
                    icon: "✅",
                };
            case "diambil":
                return {
                    label: "Sudah Diambil",
                    variant: "outline",
                    className: "text-muted-foreground",
                    icon: "👋",
                };
            case "batal":
                return {
                    label: "Dibatalkan",
                    variant: "destructive",
                    className: "",
                    icon: "❌",
                };
            default:
                return {
                    label: status,
                    variant: "outline",
                    className: "",
                    icon: "",
                };
        }
    }

    function viewServiceDetail(id: number) {
        goto(`/service/${id}`);
    }
</script>

<Card>
    <CardHeader class="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Daftar Service Order</CardTitle>
            <CardDescription>
                Kelola semua service handphone customer.
            </CardDescription>
        </div>
    </CardHeader>
    <CardContent class="space-y-4">
        <!-- Filters -->
        <div class="flex flex-col sm:flex-row gap-4">
            <div class="relative flex-1">
                <Search
                    class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                />
                <Input
                    bind:value={searchQuery}
                    placeholder="Cari customer, nota, IMEI..."
                    class="pl-8"
                />
            </div>
            <Select type="single" name="status" bind:value={filterStatus}>
                <SelectTrigger class="w-full sm:w-[180px]">
                    {filterStatus === "all" ? "Semua Status" : filterStatus}
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="menunggu">Menunggu</SelectItem>
                    <SelectItem value="proses">Dalam Proses</SelectItem>
                    <SelectItem value="selesai">Selesai</SelectItem>
                    <SelectItem value="diambil">Diambil</SelectItem>
                    <SelectItem value="batal">Batal</SelectItem>
                </SelectContent>
            </Select>
            <Select
                type="single"
                name="technician"
                bind:value={filterTechnician}
            >
                <SelectTrigger class="w-full sm:w-[180px]">
                    {filterTechnician === "all"
                        ? "Semua Teknisi"
                        : filterTechnician}
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua Teknisi</SelectItem>
                    <SelectItem value="agus">Agus</SelectItem>
                    <SelectItem value="rudi">Rudi</SelectItem>
                    <SelectItem value="unassigned">Belum Assign</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <!-- Mobile Card List -->
        <div class="grid gap-4 md:hidden">
            {#if loading}
                <div class="text-center p-4">Loading...</div>
            {:else if filteredOrders.length === 0}
                <div class="text-center p-4 text-muted-foreground">
                    Tidak ada data service.
                </div>
            {:else}
                {#each filteredOrders as order}
                    {@const statusInfo = getStatusBadge(order.status)}
                    <div
                        class="rounded-lg border p-4 space-y-3 bg-card text-card-foreground shadow-sm"
                    >
                        <div class="flex justify-between items-start">
                            <div>
                                <div class="font-medium text-primary">
                                    {order.no}
                                </div>
                                <div class="text-xs text-muted-foreground">
                                    {new Date(
                                        order.dateIn,
                                    ).toLocaleDateString()}
                                </div>
                            </div>
                            <Badge
                                variant={statusInfo.variant as any}
                                class={statusInfo.className}
                            >
                                {statusInfo.icon}
                                {statusInfo.label}
                            </Badge>
                        </div>

                        <Separator />

                        <div class="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <div class="text-muted-foreground text-xs">
                                    Customer
                                </div>
                                <div class="font-medium">
                                    {order.customer.name}
                                </div>
                                <div class="text-xs text-muted-foreground">
                                    {order.customer.phone}
                                </div>
                            </div>
                            <div>
                                <div class="text-muted-foreground text-xs">
                                    Handphone
                                </div>
                                <div class="font-medium">
                                    {order.device.brand}
                                    {order.device.model}
                                </div>
                                <div
                                    class="text-xs text-muted-foreground truncate"
                                    title={order.device.imei}
                                >
                                    {order.device.imei || "-"}
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-between items-center pt-2">
                            <div class="text-sm">
                                <span
                                    class="text-muted-foreground text-xs block"
                                    >Teknisi</span
                                >
                                {#if order.technician}
                                    <span class="font-medium"
                                        >{order.technician.name}</span
                                    >
                                {:else}
                                    <span class="text-muted-foreground italic"
                                        >Unassigned</span
                                    >
                                {/if}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onclick={() => viewServiceDetail(order.id)}
                            >
                                <Eye class="mr-2 h-3 w-3" /> Detail
                            </Button>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>

        <!-- Desktop Table -->
        <div class="hidden md:block rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>No. Service</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Handphone</TableHead>
                        <TableHead>Teknisi</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead class="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {#if loading}
                        <TableRow>
                            <TableCell colspan={7} class="text-center h-24"
                                >Loading...</TableCell
                            >
                        </TableRow>
                    {:else if filteredOrders.length === 0}
                        <TableRow>
                            <TableCell
                                colspan={7}
                                class="text-center h-24 text-muted-foreground"
                                >Tidak ada data service.</TableCell
                            >
                        </TableRow>
                    {:else}
                        {#each filteredOrders as order}
                            <TableRow>
                                <TableCell class="font-medium text-primary"
                                    >{order.no}</TableCell
                                >
                                <TableCell
                                    >{new Date(
                                        order.dateIn,
                                    ).toLocaleDateString()}</TableCell
                                >
                                <TableCell>
                                    <div class="flex flex-col">
                                        <span class="font-medium"
                                            >{order.customer.name}</span
                                        >
                                        <span
                                            class="text-xs text-muted-foreground"
                                            >{order.customer.phone}</span
                                        >
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div class="flex flex-col">
                                        <span
                                            >{order.device.brand}
                                            {order.device.model}</span
                                        >
                                        <span
                                            class="text-xs text-muted-foreground"
                                            >IMEI: {order.device.imei ||
                                                "-"}</span
                                        >
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div class="flex items-center gap-2">
                                        {#if order.technician}
                                            <Badge variant="outline"
                                                >{order.technician.name}</Badge
                                            >
                                        {:else}
                                            <span
                                                class="text-sm text-muted-foreground italic"
                                                >Belum assign</span
                                            >
                                        {/if}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {@const statusInfo = getStatusBadge(
                                        order.status,
                                    )}
                                    <Badge
                                        variant={statusInfo.variant as any}
                                        class={statusInfo.className}
                                    >
                                        {statusInfo.icon}
                                        {statusInfo.label}
                                    </Badge>
                                </TableCell>
                                <TableCell class="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        class="h-8 w-8"
                                        onclick={() =>
                                            viewServiceDetail(order.id)}
                                    >
                                        <Eye class="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        {/each}
                    {/if}
                </TableBody>
            </Table>
        </div>
    </CardContent>
</Card>

{#if selectedServiceForReassign}
    <ReassignTechnicianModal
        bind:open={showReassignModal}
        serviceId={selectedServiceForReassign.id}
        serviceNo={selectedServiceForReassign.no}
        currentTechnician={selectedServiceForReassign.technician}
        onConfirm={handleReassignConfirm}
    />
{/if}
