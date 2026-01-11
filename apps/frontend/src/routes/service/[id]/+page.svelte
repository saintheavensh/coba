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
        Trash2,
    } from "lucide-svelte";
    import PatternLock from "$lib/components/ui/pattern-lock.svelte";

    import { onMount } from "svelte";
    import { ServiceService } from "$lib/services/service.service";
    import { api } from "$lib/api";
    import { generateBarcodeSvg } from "$lib/utils";

    const serviceId = parseInt($page.params.id ?? "0");
    let serviceOrder = $state<any>(null);
    let loading = $state(true);

    async function loadData() {
        loading = true;
        try {
            serviceOrder = await ServiceService.getById(serviceId);
            // Map 'device' to 'phone' for UI compatibility
            if (serviceOrder.device) serviceOrder.phone = serviceOrder.device;
            if (!serviceOrder.parts) serviceOrder.parts = [];
            if (!serviceOrder.timeline) serviceOrder.timeline = [];
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat detail service");
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadData();
    });

    // Computed properties using $derived
    let totalParts = $derived(
        serviceOrder?.parts?.reduce(
            (sum: number, p: any) => sum + (p.subtotal || p.price * p.qty),
            0,
        ) || 0,
    );
    // Calculation logic for grandTotal might differ if backend provides it
    let grandTotal = $derived(
        (serviceOrder?.actualCost || serviceOrder?.costEstimate || 0) +
            totalParts,
    ); // Simplified logic, adjust as needed based on backend response structure.
    // Actually backend `services` table has `actualCost`.

    async function handleSave() {
        // Implement Update Logic (e.g. notes, diagnosis update)
        // For now just partial update status or similar?
        // ServiceService.updateStatus is available.
        toast.info("Update logic needs backend endpoint for full update");
    }

    async function handleComplete() {
        if (!confirm("Tandai service ini selesai?")) return;
        try {
            const userId =
                JSON.parse(localStorage.getItem("user") || "{}").id ||
                "USR-ADMIN";
            await ServiceService.updateStatus(serviceId, {
                status: "selesai",
                userId,
            });
            toast.success("Service selesai!");
            loadData();
        } catch (e) {
            toast.error("Gagal update status");
        }
    }

    async function handleCancel() {
        if (!confirm("Batalkan service ini?")) return;
        try {
            const userId =
                JSON.parse(localStorage.getItem("user") || "{}").id ||
                "USR-ADMIN";
            await ServiceService.updateStatus(serviceId, {
                status: "batal",
                userId,
            });
            toast.success("Service dibatalkan");
            loadData();
        } catch (e) {
            toast.error("Gagal membatalkan");
        }
    }

    function handleAddParts() {
        toast.info("Fitur Tambah Parts akan segera hadir (Gunakan Edit Form)");
    }

    function handleReassignTechnician() {
        toast.info("Gunakan menu di Service List untuk Reassign");
    }

    function handleChatCustomer() {
        if (!serviceOrder) return;
        const phone =
            serviceOrder.customer?.phone?.replace(/[^0-9]/g, "") || "";
        // Format +62
        const formattedPhone = phone.startsWith("0")
            ? "62" + phone.slice(1)
            : phone;

        // Use serviceOrder.phone safely, fallback to empty string if missing
        const brand = serviceOrder.phone?.brand || "HP";
        const model = serviceOrder.phone?.model || "";

        const message = `Halo Kak ${serviceOrder.customer?.name || "Customer"}, mengenai service ${brand} ${model} (No: ${serviceOrder.no})...`;
        const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
    }

    let showPrintLabel = $state(false);
    async function handlePrintLabel() {
        try {
            await ServiceService.print(serviceId);
            toast.success("Perintah cetak dikirim ke server");
        } catch (e: any) {
            console.error(e);
            const errMsg =
                e.response?.data?.errors?.[0] ||
                e.response?.data?.message ||
                e.message;
            toast.error("Gagal mencetak: " + errMsg);
        }
    }
</script>

<div class="space-y-6">
    {#if loading}
        <div class="flex items-center justify-center h-64">Loading...</div>
    {:else if !serviceOrder}
        <div class="flex items-center justify-center h-64">
            Service Order tidak ditemukan
        </div>
    {:else}
        <!-- Header -->
        <div
            class="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
            <div class="flex items-start gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onclick={() => goto("/service")}
                    class="mt-1 md:mt-0"
                >
                    <ArrowLeft class="h-5 w-5" />
                </Button>
                <div>
                    <h3
                        class="text-lg font-medium flex items-center gap-2 flex-wrap"
                    >
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
                        {serviceOrder.customer?.name || "Unknown Customer"} - {serviceOrder
                            .phone?.brand || "Unknown Brand"}
                        {serviceOrder.phone?.model || ""}
                    </p>
                </div>
            </div>
            <Badge
                class="bg-orange-100 text-orange-700 hover:bg-orange-100 self-start md:self-center ml-14 md:ml-0"
            >
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
                                >{serviceOrder.customer?.name || "-"}</span
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
                            >{serviceOrder.customer?.phone || "-"}</span
                        >
                    </div>
                    <div class="flex justify-between">
                        <span class="text-muted-foreground">Alamat</span>
                        <span class="font-medium text-right"
                            >{serviceOrder.customer?.address || "-"}</span
                        >
                    </div>
                    <div class="flex justify-between">
                        <span class="text-muted-foreground">Tipe</span>
                        <Badge variant="outline"
                            >{serviceOrder.isWalkin
                                ? "Walk-in"
                                : "Reguler"}</Badge
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
                            >{serviceOrder.phone?.brand || "-"}
                            {serviceOrder.phone?.model || ""}</span
                        >
                    </div>
                    <div class="flex justify-between">
                        <span class="text-muted-foreground">IMEI</span>
                        <span class="font-mono text-xs"
                            >{serviceOrder.phone?.imei || "-"}</span
                        >
                    </div>
                    <div class="flex justify-between">
                        <span class="text-muted-foreground">Tanggal Masuk</span>
                        <span class="font-medium"
                            >{serviceOrder.dateIn || "-"}</span
                        >
                    </div>
                </CardContent>
            </Card>
        </div>

        <!-- Photos -->
        {#if serviceOrder.photos && serviceOrder.photos.length > 0}
            <Card>
                <CardHeader>
                    <CardTitle class="text-base"
                        >📸 Foto Kondisi Fisik</CardTitle
                    >
                </CardHeader>
                <CardContent>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {#each serviceOrder.photos as photo, i}
                            <button
                                class="aspect-square rounded-md overflow-hidden border p-0 w-full hover:ring-2 hover:ring-primary focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                                onclick={() => {
                                    const url = photo.startsWith("http")
                                        ? photo
                                        : photo;
                                    window.open(url, "_blank");
                                }}
                                title="Lihat foto penuh"
                            >
                                <img
                                    src={photo.startsWith("http")
                                        ? photo
                                        : photo}
                                    alt={`Bukti kondisi fisik ${i + 1}`}
                                    class="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                />
                            </button>
                        {/each}
                    </div>
                </CardContent>
            </Card>
        {/if}

        <!-- Timeline -->
        <Card>
            <CardHeader>
                <CardTitle class="text-base">📅 Timeline Service</CardTitle>
            </CardHeader>
            <CardContent>
                <div class="space-y-4">
                    {#each serviceOrder.timeline || [] as item, i}
                        <div class="flex gap-4">
                            <div class="flex flex-col items-center">
                                <div
                                    class="h-3 w-3 rounded-full bg-primary"
                                ></div>
                                {#if i < (serviceOrder.timeline?.length || 0) - 1}
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
                    <p class="text-sm">{serviceOrder.complaint || "-"}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle class="text-base">Diagnosa Teknisi</CardTitle>
                </CardHeader>
                <CardContent>
                    {#if serviceOrder.diagnosis}
                        {#if typeof serviceOrder.diagnosis === "string" && serviceOrder.diagnosis.startsWith("{")}
                            {@const diag = JSON.parse(serviceOrder.diagnosis)}
                            <div class="space-y-4 text-sm">
                                {#if diag.initial}
                                    <div>
                                        <h4
                                            class="font-medium text-xs text-muted-foreground uppercase mb-1"
                                        >
                                            Diagnosa Awal
                                        </h4>
                                        <p>{diag.initial}</p>
                                    </div>
                                {/if}
                                {#if diag.possibleCauses}
                                    <div>
                                        <h4
                                            class="font-medium text-xs text-muted-foreground uppercase mb-1"
                                        >
                                            Kemungkinan Kerusakan
                                        </h4>
                                        <p>{diag.possibleCauses}</p>
                                    </div>
                                {/if}
                                {#if diag.estimatedCost}
                                    <div>
                                        <h4
                                            class="font-medium text-xs text-muted-foreground uppercase mb-1"
                                        >
                                            Estimasi Biaya
                                        </h4>
                                        <p>{diag.estimatedCost}</p>
                                    </div>
                                {/if}
                            </div>
                        {:else}
                            <p class="text-sm">{serviceOrder.diagnosis}</p>
                        {/if}
                    {:else}
                        <p class="text-sm text-muted-foreground italic">
                            Belum ada diagnosa
                        </p>
                    {/if}
                </CardContent>
            </Card>
        </div>

        <!-- Technician -->
        <Card>
            <CardHeader class="flex flex-row items-center justify-between">
                <CardTitle class="text-base"
                    >👨‍🔧 Teknisi yang Mengerjakan</CardTitle
                >
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
                    <span class="font-medium"
                        >{serviceOrder.technician?.name ||
                            "Belum Ditentukan"}</span
                    >
                    <span class="text-muted-foreground">
                        (Assigned: {serviceOrder.technician?.assignedAt ||
                            "-"})</span
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
                <div class="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Parts</TableHead>
                                <TableHead>Sumber</TableHead>
                                <TableHead class="text-right">Qty</TableHead>
                                <TableHead class="text-right">Harga</TableHead>
                                <TableHead class="text-right"
                                    >Subtotal</TableHead
                                >
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each serviceOrder.parts || [] as part}
                                <TableRow>
                                    <TableCell class="font-medium"
                                        >{part.name}</TableCell
                                    >
                                    <TableCell>
                                        <Badge variant="outline"
                                            >{part.source}</Badge
                                        >
                                    </TableCell>
                                    <TableCell class="text-right"
                                        >{part.qty}</TableCell
                                    >
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
                </div>
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
                    <span
                        >Rp {(
                            serviceOrder.serviceFee || 0
                        ).toLocaleString()}</span
                    >
                </div>
                <div class="flex justify-between text-sm">
                    <span>Biaya Parts</span>
                    <span>Rp {(totalParts || 0).toLocaleString()}</span>
                </div>
                <Separator />
                <div class="flex justify-between font-bold text-lg">
                    <span>TOTAL BIAYA</span>
                    <span>Rp {(grandTotal || 0).toLocaleString()}</span>
                </div>
            </CardContent>
        </Card>

        <!-- Actions -->
        <!-- Actions -->
        <!-- Actions -->
        {@const isReadOnly =
            serviceOrder.status === "selesai" ||
            serviceOrder.status === "batal" ||
            serviceOrder.status === "diambil"}
        {#if !isReadOnly}
            <div class="flex flex-col-reverse md:flex-row gap-2 justify-end">
                <Button
                    variant="outline"
                    onclick={handleCancel}
                    class="w-full md:w-auto text-red-600 hover:text-red-700"
                >
                    <XCircle class="mr-2 h-4 w-4" />
                    Batalkan Service
                </Button>
                <Button
                    variant="secondary"
                    onclick={handleSave}
                    class="w-full md:w-auto"
                >
                    <Save class="mr-2 h-4 w-4" />
                    Simpan Perubahan
                </Button>
                <Button onclick={handleComplete} class="w-full md:w-auto">
                    <CheckCircle class="mr-2 h-4 w-4" />
                    Tandai Selesai
                </Button>
            </div>
        {:else}
            <div
                class="flex justify-center p-4 bg-muted/50 rounded-lg text-muted-foreground text-sm italic"
            >
                Service status {serviceOrder.status} - Data terkunci.
            </div>
            <!-- Add Delete Here if needed, or keep in List only. Let's add it for consistency if user wants to delete closed ones too. -->
            <div class="flex justify-end mt-2">
                <Button
                    variant="outline"
                    class="text-red-500 border-red-200 hover:bg-red-50"
                    onclick={async () => {
                        if (!confirm("Hapus permanen history service ini?"))
                            return;
                        try {
                            await api.delete(`/service/${serviceId}`);
                            toast.success("Service dihapus");
                            goto("/service");
                        } catch (e) {
                            toast.error("Gagal hapus");
                        }
                    }}
                >
                    <Trash2 class="mr-2 h-4 w-4" /> Hapus Data
                </Button>
            </div>
        {/if}
    {/if}
</div>
