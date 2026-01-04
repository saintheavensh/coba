<script lang="ts">
    import PurchaseList from "../products/components/purchase-list.svelte";
    import { Separator } from "$lib/components/ui/separator";
</script>

<div class="space-y-6">
    <div>
        <h3 class="text-lg font-medium">Data Pembelian</h3>
        <p class="text-sm text-muted-foreground">
            Riwayat transaksi pembelian barang dari supplier.
        </p>
    </div>
    <Separator />
    <PurchaseList />
</div>
