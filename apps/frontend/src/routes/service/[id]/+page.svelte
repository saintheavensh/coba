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
        Printer,
        MessageCircle,
    } from "lucide-svelte";
    import PatternLock from "$lib/components/ui/pattern-lock.svelte";

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

    function handleChatCustomer() {
        const phone = serviceOrder.customer.phone.replace(/[^0-9]/g, "");
        // Format +62
        const formattedPhone = phone.startsWith("0")
            ? "62" + phone.slice(1)
            : phone;
        const message = `Halo Kak ${serviceOrder.customer.name}, mengenai service HP ${serviceOrder.phone.brand} ${serviceOrder.phone.model} (No: ${serviceOrder.no})...`;
        const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
    }

    let showPrintLabel = false;
    function handlePrintLabel() {
        showPrintLabel = true;
        setTimeout(() => {
            window.print();
            showPrintLabel = false;
        }, 500);
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
                <h3 class="text-lg font-medium flex items-center gap-2">
                    Detail Service: {serviceOrder.no}
                    <Button
                        variant="ghost"
                        size="icon"
                        onclick={handlePrintLabel}
                        title="Cetak Label"
                    >
                        <Printer class="h-4 w-4" />
                    </Button>
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
                    <div class="flex items-center gap-2">
                        <span class="font-medium"
                            >{serviceOrder.customer.name}</span
                        >
                        <Button
                            variant="ghost"
                            size="icon"
                            class="h-4 w-4 text-green-600"
                            onclick={handleChatCustomer}
                            title="Chat WhatsApp"
                        >
                            <MessageCircle class="h-4 w-4" />
                        </Button>
                    </div>
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

<!-- Printable Label (Sticker Layout: 6.5cm x 3.2cm) -->
{#if showPrintLabel}
    <div
        class="fixed inset-0 bg-white z-[9999] print-area flex items-center justify-center"
    >
        <!-- Container simulating the label size for screen preview -->
        <div
            class="w-[65mm] h-[32mm] border border-gray-200 p-[2mm] flex gap-[2mm] overflow-hidden bg-white text-black relative"
        >
            <!-- Left Info -->
            <div class="flex-1 flex flex-col justify-between overflow-hidden">
                <div>
                    <h2 class="font-bold text-[10pt] leading-none mb-[1mm]">
                        {serviceOrder.no}
                    </h2>
                    <p class="text-[6pt] mb-[1mm]">
                        {serviceOrder.dateIn.split(" ")[0]}
                    </p>
                    <p class="text-[7pt] font-semibold truncate leading-tight">
                        {serviceOrder.phone.brand}
                        {serviceOrder.phone.model}
                    </p>
                </div>
                <div class="mt-auto">
                    <p class="text-[5pt] leading-tight text-gray-600">
                        Keluhan:
                    </p>
                    <p class="text-[6pt] leading-tight line-clamp-2">
                        {serviceOrder.complaint}
                    </p>
                </div>
            </div>

            <!-- Right: Pattern -->
            <div
                class="w-[20mm] flex flex-col items-center justify-center border-l border-black pl-[1mm]"
            >
                <p class="text-[5pt] mb-[1mm] text-center">Pola / PIN</p>
                <div
                    class="w-[15mm] h-[15mm] border border-black border-dashed flex items-center justify-center relative"
                >
                    <!-- 3x3 Grid Dots Visual -->
                    <div class="grid grid-cols-3 gap-[3mm]">
                        {#each Array(9) as _, i}
                            <div
                                class="w-[1mm] h-[1mm] bg-black rounded-full"
                            ></div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    @media print {
        @page {
            size: 65mm 32mm;
            margin: 0;
        }
        :global(body > *:not(.print-area)) {
            display: none !important;
        }
        :global(body) {
            margin: 0;
            padding: 0;
            visibility: hidden;
        }
        .print-area {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 65mm !important;
            height: 32mm !important;
            display: block !important;
            background: white;
            padding: 0; /* Remove screen preview padding */
            display: flex !important;
            align-items: flex-start !important; /* Align top-left for printer */
            justify-content: flex-start !important;
        }
        /* Remove preview border logic */
        .print-area > div {
            border: none;
            margin: 0;
            width: 100%;
            height: 100%;
        }
    }
</style>
