<script lang="ts">
    import WarehouseStockTable from "$lib/features/products/components/warehouse/WarehouseStockTable.svelte";
</script>

<div class="container mx-auto py-6 space-y-6">
    <header class="flex justify-between items-center">
        <div>
            <h1
                class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
                Stok Gudang
            </h1>
            <p class="text-slate-500">
                Monitor lokasi barang, batch, dan tanggal kadaluarsa.
            </p>
        </div>
    </header>

    <WarehouseStockTable />
</div>
