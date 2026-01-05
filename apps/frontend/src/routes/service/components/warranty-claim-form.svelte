<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
        CardDescription,
        CardFooter,
    } from "$lib/components/ui/card";
    import { Badge } from "$lib/components/ui/badge";
    import { Textarea } from "$lib/components/ui/textarea";
    import {
        Search,
        AlertTriangle,
        CheckCircle,
        Calendar,
        Smartphone,
        User,
    } from "lucide-svelte";
    import { toast } from "svelte-sonner";

    let searchQuery = "";
    let searchResult: any = null;
    let isSearching = false;
    let claimDescription = "";

    // Mock Database of Finished Services
    const mockServices = [
        {
            id: 101,
            no: "SRV-2026-001",
            date: "2026-01-01", // Finished date
            customer: "Budi Santoso",
            phone: "0812-3456-7890",
            brand: "iPhone 15 Pro",
            imei: "354217123456789",
            warrantyDuration: 7, // days
            status: "selesai",
            totalCost: 1500000,
        },
        {
            id: 102,
            no: "SRV-2026-002",
            date: "2025-12-25",
            customer: "Siti Aminah",
            phone: "0821-9876-0000",
            brand: "Samsung S24 Ultra",
            imei: "359876543210123",
            warrantyDuration: 30, // days
            status: "selesai",
            totalCost: 500000,
        },
    ];

    function handleSearch() {
        if (!searchQuery) return;
        isSearching = true;

        // Simulate API call
        setTimeout(() => {
            const found = mockServices.find(
                (s) =>
                    s.no.toLowerCase() === searchQuery.toLowerCase() ||
                    s.imei === searchQuery ||
                    s.phone === searchQuery,
            );

            searchResult = found || null;
            isSearching = false;

            if (!found) {
                toast.error("Data service tidak ditemukan atau belum selesai.");
            }
        }, 800);
    }

    function checkWarrantyStatus(dateStr: string, duration: number) {
        const finishDate = new Date(dateStr);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - finishDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const isExpired = diffDays > duration;
        const remainingDays = duration - diffDays;

        return { isExpired, diffDays, remainingDays };
    }

    function handleSubmitClaim() {
        if (!claimDescription) {
            toast.error("Mohon isi keterangan keluhan garansi.");
            return;
        }

        // Simulate submission
        toast.success(
            `Klaim garansi untuk nota ${searchResult.no} berhasil dibuat!`,
            {
                description:
                    "Tiket service baru telah dibuat dengan status 'Claim'.",
            },
        );

        // Reset
        searchQuery = "";
        searchResult = null;
        claimDescription = "";
    }
</script>

<div class="max-w-2xl mx-auto space-y-6">
    <Card>
        <CardHeader>
            <CardTitle>Cari Data Service</CardTitle>
            <CardDescription
                >Masukkan Nomor Nota, IMEI, atau No. HP untuk mengecek garansi.</CardDescription
            >
        </CardHeader>
        <CardContent>
            <div class="flex gap-4">
                <div class="relative flex-1">
                    <Search
                        class="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                        placeholder="Contoh: SRV-2026-001 atau IMEI"
                        class="pl-9"
                        bind:value={searchQuery}
                        onkeydown={(e) => e.key === "Enter" && handleSearch()}
                    />
                </div>
                <Button onclick={handleSearch} disabled={isSearching}>
                    {isSearching ? "Mencari..." : "Cek Garansi"}
                </Button>
            </div>
        </CardContent>
    </Card>

    {#if searchResult}
        {@const warranty = checkWarrantyStatus(
            searchResult.date,
            searchResult.warrantyDuration,
        )}

        <div class="grid gap-6 animate-in fade-in slide-in-from-bottom-4">
            <!-- Service Details Card -->
            <Card
                class="border-l-4 {warranty.isExpired
                    ? 'border-l-red-500'
                    : 'border-l-green-500'}"
            >
                <CardHeader>
                    <div class="flex justify-between items-start">
                        <div>
                            <CardTitle class="text-lg flex items-center gap-2">
                                {searchResult.brand}
                                <Badge variant="outline"
                                    >{searchResult.status.toUpperCase()}</Badge
                                >
                            </CardTitle>
                            <CardDescription
                                >No. Nota: {searchResult.no}</CardDescription
                            >
                        </div>
                        <div class="text-right">
                            {#if warranty.isExpired}
                                <Badge
                                    variant="destructive"
                                    class="text-sm px-3 py-1"
                                    >GARANSI EXPIRED</Badge
                                >
                            {:else}
                                <Badge
                                    variant="default"
                                    class="bg-green-600 hover:bg-green-700 text-sm px-3 py-1"
                                    >GARANSI AKTIF</Badge
                                >
                            {/if}
                        </div>
                    </div>
                </CardHeader>
                <CardContent class="grid md:grid-cols-2 gap-4 text-sm">
                    <div class="space-y-3">
                        <div class="flex items-center gap-2">
                            <User class="h-4 w-4 text-muted-foreground" />
                            <span class="font-medium"
                                >{searchResult.customer}</span
                            >
                        </div>
                        <div class="flex items-center gap-2">
                            <Smartphone class="h-4 w-4 text-muted-foreground" />
                            <span
                                >{searchResult.phone} / {searchResult.imei}</span
                            >
                        </div>
                    </div>
                    <div class="space-y-3">
                        <div class="flex items-center gap-2">
                            <Calendar class="h-4 w-4 text-muted-foreground" />
                            <span
                                >Tanggal Selesai: <strong
                                    >{searchResult.date}</strong
                                ></span
                            >
                        </div>
                        <div class="flex items-center gap-2">
                            <CheckCircle
                                class="h-4 w-4 text-muted-foreground"
                            />
                            <span
                                >Masa Garansi: <strong
                                    >{searchResult.warrantyDuration} Hari</strong
                                ></span
                            >
                        </div>
                        <div class="p-2 bg-muted rounded text-xs">
                            {#if warranty.isExpired}
                                <span class="text-red-600 font-medium"
                                    >Lewat {Math.abs(warranty.remainingDays)} hari
                                    dari masa garansi.</span
                                >
                            {:else}
                                <span class="text-green-600 font-medium"
                                    >Sisa waktu garansi: {warranty.remainingDays}
                                    hari lagi.</span
                                >
                            {/if}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Claim Form (Only if Warranty Active) -->
            {#if !warranty.isExpired}
                <Card>
                    <CardHeader>
                        <CardTitle>Formulir Klaim</CardTitle>
                        <CardDescription
                            >Isi detail keluhan untuk diproses ulang.</CardDescription
                        >
                    </CardHeader>
                    <CardContent class="space-y-4">
                        <div class="space-y-2">
                            <Label>Keluhan / Kerusakan Kembali</Label>
                            <Textarea
                                placeholder="Jelaskan kendala yang dialami customer..."
                                rows={4}
                                bind:value={claimDescription}
                            />
                        </div>
                        <div
                            class="bg-yellow-50 p-3 rounded-md border border-yellow-200 flex gap-2 text-sm text-yellow-800"
                        >
                            <AlertTriangle class="h-5 w-5 shrink-0" />
                            <p>
                                Pastikan segel garansi masih utuh dan kerusakan
                                bukan disebabkan oleh kesalahan pengguna (Human
                                Error).
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button class="w-full" onclick={handleSubmitClaim}
                            >Proses Klaim Garansi</Button
                        >
                    </CardFooter>
                </Card>
            {:else}
                <div
                    class="p-4 rounded-lg border bg-muted text-center space-y-2"
                >
                    <h4 class="font-medium">Garansi Tidak Tersedia</h4>
                    <p class="text-sm text-muted-foreground">
                        Masa garansi untuk unit ini telah habis. Silakan buat
                        Service Order baru (Reguler) jika ingin diperbaiki
                        kembali.
                    </p>
                </div>
            {/if}
        </div>
    {/if}
</div>
