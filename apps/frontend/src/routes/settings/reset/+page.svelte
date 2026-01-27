<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import {
        Card,
        CardContent,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import {
        Alert,
        AlertDescription,
        AlertTitle,
    } from "$lib/components/ui/alert";
    import { SettingsService } from "$lib/services/settings.service";
    import { toast } from "svelte-sonner";
    import {
        Loader2,
        Database,
        AlertTriangle,
        RefreshCcw,
    } from "lucide-svelte";

    let loading = $state(false);
    let confirmMode = $state<"data" | "full" | null>(null);
    let confirmInput = $state("");

    async function handleReset() {
        if (!confirmMode) return;
        if (confirmInput !== "RESET") {
            toast.error("Konfirmasi salah. Ketik 'RESET' dengan huruf besar.");
            return;
        }

        loading = true;
        try {
            await SettingsService.factoryReset(confirmMode);
            toast.success(
                "Factory Reset berhasil dilakukan. Sistem telah direset.",
            );
            confirmMode = null;
            confirmInput = "";
            // Optional: Reload page or logout
            setTimeout(() => (window.location.href = "/"), 1500);
        } catch (e) {
            toast.error("Gagal melakukan Factory Reset. Hubungi admin.");
            console.error(e);
        } finally {
            loading = false;
        }
    }

    function startReset(mode: "data" | "full") {
        confirmMode = mode;
        confirmInput = "";
    }

    function cancelReset() {
        confirmMode = null;
        confirmInput = "";
    }
</script>

<div class="space-y-6 max-w-3xl mx-auto py-8">
    <div>
        <h3
            class="text-2xl font-bold tracking-tight flex items-center gap-2 text-destructive"
        >
            <Database class="h-6 w-6" /> Factory Reset
        </h3>
        <p class="text-muted-foreground">
            Area berbahaya. Tindakan di sini tidak dapat dibatalkan.
        </p>
    </div>

    {#if confirmMode}
        <Card
            class="border-destructive shadow-lg animate-in fade-in zoom-in duration-300"
        >
            <CardHeader>
                <CardTitle class="text-destructive flex items-center gap-2">
                    <AlertTriangle class="h-5 w-5" />
                    Konfirmasi {confirmMode === "full"
                        ? "Full System Reset"
                        : "Reset Data Transaksi"}
                </CardTitle>
                <CardDescription>
                    Anda akan menghapus {confirmMode === "full"
                        ? "SEMUA data termasuk produk dan master data"
                        : "semua data transaksi (service, penjualan, laporan)"}.
                    <br />
                    <strong
                        >Tindakan ini permanen dan tidak dapat dibatalkan.</strong
                    >
                </CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
                <div class="space-y-2">
                    <Label>Ketik <strong>RESET</strong> untuk konfirmasi:</Label
                    >
                    <Input
                        bind:value={confirmInput}
                        placeholder="RESET"
                        class="border-destructive focus-visible:ring-destructive"
                    />
                </div>
            </CardContent>
            <CardFooter class="flex justify-between">
                <Button
                    variant="outline"
                    onclick={cancelReset}
                    disabled={loading}>Batal</Button
                >
                <Button
                    variant="destructive"
                    onclick={handleReset}
                    disabled={loading || confirmInput !== "RESET"}
                >
                    {#if loading}
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    {:else}
                        <RefreshCcw class="mr-2 h-4 w-4" />
                    {/if}
                    Ya, Reset Sekarang
                </Button>
            </CardFooter>
        </Card>
    {:else}
        <div class="grid gap-6 md:grid-cols-2">
            <!-- Data Only Reset -->
            <Card>
                <CardHeader>
                    <CardTitle>Reset Data Transaksi</CardTitle>
                    <CardDescription>
                        Bersihkan semua data transaksi untuk memulai pembukuan
                        baru.
                    </CardDescription>
                </CardHeader>
                <CardContent class="space-y-2 text-sm text-muted-foreground">
                    <p>Yang akan dihapus:</p>
                    <ul class="list-disc pl-4 space-y-1">
                        <li>Data Service & Penjualan</li>
                        <li>Laporan Keuangan</li>
                        <li>Riwayat Log Aktivitas</li>
                        <li>Stok barang akan direset (opsional)</li>
                    </ul>
                    <p class="mt-4 font-semibold text-foreground">
                        Master data (Produk, Kategori, User) TETAP AMAN.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button
                        variant="outline"
                        class="w-full border-destructive text-destructive hover:bg-destructive hover:text-white"
                        onclick={() => startReset("data")}
                    >
                        Reset Transaksi Saja
                    </Button>
                </CardFooter>
            </Card>

            <!-- Full Reset -->
            <Card class="border-destructive/50 bg-destructive/5">
                <CardHeader>
                    <CardTitle class="text-destructive"
                        >Full Factory Reset</CardTitle
                    >
                    <CardDescription>
                        Kembalikan sistem ke pengaturan awal seperti baru
                        install.
                    </CardDescription>
                </CardHeader>
                <CardContent class="space-y-2 text-sm text-muted-foreground">
                    <p>Yang akan dihapus:</p>
                    <ul class="list-disc pl-4 space-y-1">
                        <li><strong>SEMUA</strong> Data Transaksi</li>
                        <li><strong>SEMUA</strong> Data Produk & Inventori</li>
                        <li><strong>SEMUA</strong> Data Supplier & Kategori</li>
                        <li><strong>SEMUA</strong> Data Member</li>
                    </ul>
                    <p class="mt-4 font-semibold text-destructive">
                        Hanya akun Admin & Pengaturan yang tersisa.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button
                        variant="destructive"
                        class="w-full"
                        onclick={() => startReset("full")}
                    >
                        Full Reset (Dangerous)
                    </Button>
                </CardFooter>
            </Card>
        </div>
    {/if}
</div>
