<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import { ShoppingCart, Search, User, Wrench, History } from "lucide-svelte";
    import { authStore } from "$lib/features/auth/auth.svelte";

    const user = $derived(authStore.user);
</script>

<div class="space-y-6">
    <div class="flex flex-col gap-2">
        <h1 class="text-3xl font-bold tracking-tight">Kasir Counter</h1>
        <p class="text-muted-foreground">
            Halo {user?.name || "Kasir"}, siap melayani pelanggan hari ini.
        </p>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card class="bg-blue-600 text-white border-none shadow-lg">
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium text-blue-100"
                    >Penjualan Hari Ini</CardTitle
                >
                <ShoppingCart class="h-4 w-4 text-blue-100" />
            </CardHeader>
            <CardContent>
                <div class="text-3xl font-bold">Rp 2.500.000</div>
                <p class="text-xs text-blue-200">12 Transaksi</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium"
                    >Service Selesai</CardTitle
                >
                <Wrench class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">3</div>
                <p class="text-xs text-muted-foreground">
                    Siap diambil pelanggan
                </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium">Pelanggan Baru</CardTitle
                >
                <User class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">5</div>
                <p class="text-xs text-muted-foreground">Terdaftar hari ini</p>
            </CardContent>
        </Card>
    </div>

    <!-- Quick Actions -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Button
            size="lg"
            class="h-32 flex flex-col gap-3 text-lg"
            href="/sales"
        >
            <ShoppingCart class="h-8 w-8" />
            <span>Transaksi Baru</span>
        </Button>

        <div class="grid grid-rows-2 gap-4">
            <Button
                variant="outline"
                class="h-full flex gap-2 justify-start px-6"
                href="/customers"
            >
                <User class="h-5 w-5" />
                <span>Pelanggan</span>
            </Button>
            <Button
                variant="outline"
                class="h-full flex gap-2 justify-start px-6"
                href="/service"
            >
                <Wrench class="h-5 w-5" />
                <span>Ambil Service</span>
            </Button>
        </div>

        <div class="grid grid-rows-2 gap-4">
            <Button
                variant="outline"
                class="h-full flex gap-2 justify-start px-6"
                href="/searchproduct"
            >
                <Search class="h-5 w-5" />
                <span>Cari Stok</span>
            </Button>
            <Button
                variant="outline"
                class="h-full flex gap-2 justify-start px-6"
                href="#"
            >
                <History class="h-5 w-5" />
                <span>Riwayat Transaksi</span>
            </Button>
        </div>
    </div>
</div>
