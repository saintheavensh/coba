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
        SelectValue,
    } from "$lib/components/ui/select";
    import { Badge } from "$lib/components/ui/badge";
    import { Search, Eye } from "lucide-svelte";
    import { goto } from "$app/navigation";

    // Data State
    let serviceOrders: any[] = [];
    let loading = false;

    // Filters
    let searchQuery = "";
    let filterStatus = "all";
    let filterTechnician = "all";

    async function loadData() {
        loading = true;
        try {
            // Build Query Params
            const params = new URLSearchParams();
            if (filterStatus && filterStatus !== "all")
                params.append("status", filterStatus);
            // Technician filter requires User/Technician ID. For now we use "unassigned" or specific ID if we had list.
            // Since we don't have technician dropdown list populated from DB yet, we just keep basic filter logic or 'all'.
            // Ideally we fetch technicians first.

            const res = await api(`/service?${params.toString()}`);
            serviceOrders = res;
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadData();
    });

    // Reactive: Reload when filters change (debounced for search could be better, but simple for now)
    // Actually, backend search is not implemented yet, so we filter search CLIENT SIDE.
    // Status filter is SERVER SIDE (implemented in backend just now).
    $: {
        if (filterStatus) loadData();
    }

    // Client-side Search Filter
    $: filteredOrders = serviceOrders.filter((order) => {
        const term = searchQuery.toLowerCase();
        return (
            order.no.toLowerCase().includes(term) ||
            order.customer.name.toLowerCase().includes(term) ||
            order.device.brand.toLowerCase().includes(term) ||
            (order.technician?.name || "").toLowerCase().includes(term)
        );
    });

    function getStatusBadge(status: string) {
        switch (status) {
            case "antrian":
                return { label: "Antrian", variant: "outline", icon: "🕒" };
            case "dicek":
                return {
                    label: "Sedang Dicek",
                    variant: "secondary",
                    icon: "🔍",
                };
            case "konfirmasi":
                return {
                    label: "Tunggu Konfirmasi",
                    variant: "warning",
                    icon: "💬",
                };
            case "dikerjakan":
                return {
                    label: "Sedang Dikerjakan",
                    variant: "default",
                    icon: "🔧",
                };
            case "selesai":
                return { label: "Selesai", variant: "success", icon: "✅" };
            case "diambil":
                return {
                    label: "Sudah Diambil",
                    variant: "outline",
                    icon: "👋",
                };
            case "batal":
                return {
                    label: "Dibatalkan",
                    variant: "destructive",
                    icon: "❌",
                };
            default:
                return { label: status, variant: "outline", icon: "" };
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

        <!-- Table -->
        <div class="rounded-md border">
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
                                        variant={statusInfo.variant ||
                                            "outline"}
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
