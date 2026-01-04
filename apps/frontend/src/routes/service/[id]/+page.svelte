<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
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
    import { Badge } from "$lib/components/ui/badge";
    import { Separator } from "$lib/components/ui/separator";
    import { toast } from "$lib/components/ui/sonner";
    import {
        ArrowLeft,
        Save,
        CheckCircle,
        XCircle,
        Plus,
        Repeat,
    } from "lucide-svelte";

    const serviceId = $page.params.id;

    // Mock service order data
    const serviceOrder = {
        id: 1,
        no: "SRV-2026-001",
        dateIn: "2026-01-04 10:00",
        dateOut: null,
        isWalkin: false,
        customer: {
            name: "Budi Santoso",
            phone: "0812-3456-7890",
            address: "Jl. Merdeka No. 45, Jakarta",
        },
        phone: {
            brand: "Apple",
            model: "iPhone 15 Pro",
            imei: "354217123456789",
        },
        complaint:
            "Layar tidak menyala, HP panas saat dicas, tombol power rusak",
        diagnosis:
            "LCD pecah total, touchscreen tidak responsif. Perlu ganti LCD original Samsung.",
        status: "proses",
        technician: {
            id: 1,
            name: "Agus",
            assignedAt: "2026-01-04 11:00",
        },
        estimate: 2300000,
        serviceFee: 500000,
        parts: [
            {
                id: 1,
                name: "LCD iPhone 15 Original",
                source: "inventory",
                qty: 1,
                price: 1500000,
                subtotal: 1500000,
            },
            {
                id: 2,
                name: "Touchscreen Assembly",
                source: "inventory",
                qty: 1,
                price: 300000,
                subtotal: 300000,
            },
        ],
        timeline: [
            {
                time: "2026-01-04 10:00",
                event: "Service Diterima",
                by: "Kasir: Siti",
            },
            {
                time: "2026-01-04 11:00",
                event: "Assigned ke Teknisi",
                by: "Teknisi: Agus",
            },
            {
                time: "2026-01-04 11:30",
                event: "Diagnosa Selesai",
                by: "Teknisi: Agus",
            },
            {
                time: "2026-01-04 14:00",
                event: "Dalam Perbaikan",
                by: "Teknisi: Agus",
            },
        ],
        notes: "",
    };

    $: totalParts = serviceOrder.parts.reduce((sum, p) => sum + p.subtotal, 0);
    $: grandTotal = serviceOrder.serviceFee + totalParts;

    function handleSave() {
        toast.success("Perubahan service order berhasil disimpan");
    }

    function handleComplete() {
        toast.success("Service order ditandai selesai. Siap diambil customer.");
    }

    function handleCancel() {
        toast.error("Service order dibatalkan");
    }

    function handleAddParts() {
        toast.info("Modal Add Parts - Coming soon");
    }

    function handleReassignTechnician() {
        toast.info("Modal Reassign Technician - Coming soon");
    }
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <Button
                variant="ghost"
                size="icon"
                onclick={() => goto("/service")}
            >
                <ArrowLeft class="h-5 w-5" />
            </Button>
            <div>
                <h3 class="text-lg font-medium">
                    Detail Service: {serviceOrder.no}
                </h3>
                <p class="text-sm text-muted-foreground">
                    {serviceOrder.customer.name} - {serviceOrder.phone.brand}
                    {serviceOrder.phone.model}
                </p>
            </div>
        </div>
        <Badge class="bg-orange-100 text-orange-700 hover:bg-orange-100">
            🔴 {serviceOrder.status}
        </Badge>
    </div>

    <Separator />

    <!-- Customer & Phone Info -->
    <div class="grid gap-4 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle class="text-base">Informasi Customer</CardTitle>
            </CardHeader>
            <CardContent class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-muted-foreground">Nama</span>
                    <span class="font-medium">{serviceOrder.customer.name}</span
                    >
                </div>
                <div class="flex justify-between">
                    <span class="text-muted-foreground">Telepon</span>
                    <span class="font-medium"
                        >{serviceOrder.customer.phone}</span
                    >
                </div>
                <div class="flex justify-between">
                    <span class="text-muted-foreground">Alamat</span>
                    <span class="font-medium text-right"
                        >{serviceOrder.customer.address}</span
                    >
                </div>
                <div class="flex justify-between">
                    <span class="text-muted-foreground">Tipe</span>
                    <Badge variant="outline"
                        >{serviceOrder.isWalkin ? "Walk-in" : "Reguler"}</Badge
                    >
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle class="text-base">Informasi Handphone</CardTitle>
            </CardHeader>
            <CardContent class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-muted-foreground">Merk/Model</span>
                    <span class="font-medium"
                        >{serviceOrder.phone.brand}
                        {serviceOrder.phone.model}</span
                    >
                </div>
                <div class="flex justify-between">
                    <span class="text-muted-foreground">IMEI</span>
                    <span class="font-mono text-xs"
                        >{serviceOrder.phone.imei}</span
                    >
                </div>
                <div class="flex justify-between">
                    <span class="text-muted-foreground">Tanggal Masuk</span>
                    <span class="font-medium">{serviceOrder.dateIn}</span>
                </div>
            </CardContent>
        </Card>
    </div>

    <!-- Timeline -->
    <Card>
        <CardHeader>
            <CardTitle class="text-base">📅 Timeline Service</CardTitle>
        </CardHeader>
        <CardContent>
            <div class="space-y-4">
                {#each serviceOrder.timeline as item, i}
                    <div class="flex gap-4">
                        <div class="flex flex-col items-center">
                            <div class="h-3 w-3 rounded-full bg-primary"></div>
                            {#if i < serviceOrder.timeline.length - 1}
                                <div class="h-full w-0.5 bg-border"></div>
                            {/if}
                        </div>
                        <div class="flex-1 pb-4">
                            <p class="font-medium">{item.event}</p>
                            <p class="text-sm text-muted-foreground">
                                {item.by}
                            </p>
                            <p class="text-xs text-muted-foreground">
                                {item.time}
                            </p>
                        </div>
                    </div>
                {/each}
            </div>
        </CardContent>
    </Card>

    <!-- Complaint & Diagnosis -->
    <div class="grid gap-4 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle class="text-base">Keluhan Customer</CardTitle>
            </CardHeader>
            <CardContent>
                <p class="text-sm">{serviceOrder.complaint}</p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle class="text-base">Diagnosa Teknisi</CardTitle>
            </CardHeader>
            <CardContent>
                <p class="text-sm">
                    {serviceOrder.diagnosis || "Belum ada diagnosa"}
                </p>
            </CardContent>
        </Card>
    </div>

    <!-- Technician -->
    <Card>
        <CardHeader class="flex flex-row items-center justify-between">
            <CardTitle class="text-base">👨‍🔧 Teknisi yang Mengerjakan</CardTitle>
            <Button
                variant="outline"
                size="sm"
                onclick={handleReassignTechnician}
            >
                <Repeat class="mr-2 h-4 w-4" />
                Ganti Teknisi
            </Button>
        </CardHeader>
        <CardContent>
            <div class="text-sm">
                <span class="font-medium">{serviceOrder.technician.name}</span>
                <span class="text-muted-foreground">
                    (Assigned: {serviceOrder.technician.assignedAt})</span
                >
            </div>
        </CardContent>
    </Card>

    <!-- Spare Parts -->
    <Card>
        <CardHeader class="flex flex-row items-center justify-between">
            <CardTitle class="text-base"
                >📦 Spare Parts yang Digunakan</CardTitle
            >
            <Button variant="outline" size="sm" onclick={handleAddParts}>
                <Plus class="mr-2 h-4 w-4" />
                Tambah Parts
            </Button>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama Parts</TableHead>
                        <TableHead>Sumber</TableHead>
                        <TableHead class="text-right">Qty</TableHead>
                        <TableHead class="text-right">Harga</TableHead>
                        <TableHead class="text-right">Subtotal</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {#each serviceOrder.parts as part}
                        <TableRow>
                            <TableCell class="font-medium"
                                >{part.name}</TableCell
                            >
                            <TableCell>
                                <Badge variant="outline">{part.source}</Badge>
                            </TableCell>
                            <TableCell class="text-right">{part.qty}</TableCell>
                            <TableCell class="text-right"
                                >Rp {part.price.toLocaleString()}</TableCell
                            >
                            <TableCell class="text-right"
                                >Rp {part.subtotal.toLocaleString()}</TableCell
                            >
                        </TableRow>
                    {/each}
                </TableBody>
            </Table>
        </CardContent>
    </Card>

    <!-- Cost Summary -->
    <Card>
        <CardHeader>
            <CardTitle class="text-base">💰 Rincian Biaya</CardTitle>
        </CardHeader>
        <CardContent class="space-y-2">
            <div class="flex justify-between text-sm">
                <span>Biaya Jasa</span>
                <span>Rp {serviceOrder.serviceFee.toLocaleString()}</span>
            </div>
            <div class="flex justify-between text-sm">
                <span>Biaya Parts</span>
                <span>Rp {totalParts.toLocaleString()}</span>
            </div>
            <Separator />
            <div class="flex justify-between font-bold text-lg">
                <span>TOTAL BIAYA</span>
                <span>Rp {grandTotal.toLocaleString()}</span>
            </div>
        </CardContent>
    </Card>

    <!-- Actions -->
    <div class="flex gap-2 justify-end">
        <Button variant="outline" onclick={handleCancel}>
            <XCircle class="mr-2 h-4 w-4" />
            Batalkan Service
        </Button>
        <Button variant="secondary" onclick={handleSave}>
            <Save class="mr-2 h-4 w-4" />
            Simpan Perubahan
        </Button>
        <Button onclick={handleComplete}>
            <CheckCircle class="mr-2 h-4 w-4" />
            Tandai Selesai
        </Button>
    </div>
</div>
