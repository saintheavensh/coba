<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Download } from "lucide-svelte";
</script>

<div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl font-bold tracking-tight">
                Laporan Keuntungan
            </h1>
            <p class="text-muted-foreground">
                Analisis keuntungan dan stok (FIFO).
            </p>
        </div>
        <Button variant="outline">
            <Download class="mr-2 h-4 w-4" />
            Export
        </Button>
    </div>

    <div
        class="rounded-lg border border-dashed p-8 text-center text-muted-foreground"
    >
        Laporan Keuntungan akan diimplementasikan di sini.
    </div>
</div>
