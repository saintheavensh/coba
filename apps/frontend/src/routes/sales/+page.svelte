<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { ShoppingCart } from "lucide-svelte";
</script>

<div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl font-bold tracking-tight">Penjualan</h1>
            <p class="text-muted-foreground">
                Kelola transaksi penjualan harian.
            </p>
        </div>
        <Button>
            <ShoppingCart class="mr-2 h-4 w-4" />
            Penjualan Baru
        </Button>
    </div>

    <div
        class="rounded-lg border border-dashed p-8 text-center text-muted-foreground"
    >
        Form Penjualan akan diimplementasikan di sini.
    </div>
</div>
