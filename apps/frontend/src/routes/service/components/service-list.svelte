<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button";
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
    import { Search, Eye, Plus } from "lucide-svelte";
    import { goto } from "$app/navigation";

    import ReassignTechnicianModal from "./reassign-technician-modal.svelte";

    // Mock data service orders
    let serviceOrders = [
        {
            id: 1,
            no: "SRV-2026-001",
            date: "2026-01-04",
            customer: "Budi Santoso",
            phone: "0812-3456-7890",
            brand: "iPhone",
            model: "15 Pro",
            imei: "354217123456789",
            status: "proses",
            technician: "Agus",
        },
        {
            id: 2,
            no: "SRV-2026-002",
            date: "2026-01-03",
            customer: "Siti Aminah",
            phone: "0821-9876-5432",
            brand: "Samsung",
            model: "Galaxy S24 Ultra",
            imei: "359876543210123",
            status: "selesai",
            technician: "Rudi",
        },
        {
            id: 3,
            no: "SRV-2026-003",
            date: "2026-01-02",
            customer: "Andi Prasetyo",
            phone: "0877-6543-2109",
            brand: "Xiaomi",
            model: "Redmi Note 12",
            imei: "351234567890456",
            status: "menunggu",
            technician: null,
        },
    ];

    let searchQuery = "";
    let filterStatus = "all";
    let filterTechnician = "all";

    // Modal State
    let showReassignModal = false;
    let selectedServiceForReassign: any = null;

    function openReassignModal(order: any) {
        selectedServiceForReassign = order;
        showReassignModal = true;
    }

    function handleReassignConfirm(updatedData: any) {
        // Update local mock data
        serviceOrders = serviceOrders.map((order) =>
            order.id === updatedData.id
                ? { ...order, technician: updatedData.technician }
                : order,
        );
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case "menunggu":
                return { label: "Menunggu", variant: "outline", icon: "⚪" };
            case "proses":
                return {
                    label: "Dalam Proses",
                    variant: "default",
                    icon: "🔴",
                };
            case "selesai":
                return { label: "Selesai", variant: "secondary", icon: "🟢" };
            case "diambil":
                return { label: "Diambil", variant: "secondary", icon: "🟣" };
            case "batal":
                return { label: "Batal", variant: "destructive", icon: "⚫" };
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
                    {#each serviceOrders as order}
                        <TableRow>
                            <TableCell class="font-medium text-primary"
                                >{order.no}</TableCell
                            >
                            <TableCell>{order.date}</TableCell>
                            <TableCell>
                                <div class="flex flex-col">
                                    <span class="font-medium"
                                        >{order.customer}</span
                                    >
                                    <span class="text-sm text-muted-foreground"
                                        >{order.phone}</span
                                    >
                                </div>
                            </TableCell>
                            <TableCell>
                                <div class="flex flex-col">
                                    <span>{order.brand} {order.model}</span>
                                    <span class="text-xs text-muted-foreground"
                                        >IMEI: {order.imei.substring(
                                            0,
                                            10,
                                        )}...</span
                                    >
                                </div>
                            </TableCell>
                            <TableCell>
                                <div class="flex items-center gap-2">
                                    {#if order.technician}
                                        <Badge variant="outline"
                                            >{order.technician}</Badge
                                        >
                                    {:else}
                                        <span
                                            class="text-sm text-muted-foreground"
                                            >Belum assign</span
                                        >
                                    {/if}
                                    <button
                                        class="text-xs text-blue-600 hover:underline"
                                        onclick={() => openReassignModal(order)}
                                    >
                                        (Edit)
                                    </button>
                                </div>
                            </TableCell>
                            <TableCell>
                                {@const statusInfo = getStatusBadge(
                                    order.status,
                                )}
                                <Badge
                                    variant={statusInfo.variant as
                                        | "default"
                                        | "destructive"
                                        | "outline"
                                        | "secondary"}
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
                                    onclick={() => viewServiceDetail(order.id)}
                                >
                                    <Eye class="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    {/each}
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
