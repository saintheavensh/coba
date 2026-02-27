<script lang="ts">
    import ProductManagerTable from "$lib/features/products/components/manager/ProductManagerTable.svelte";
</script>

<div class="container mx-auto py-6 space-y-6">
    <header class="flex justify-between items-center">
        <div>
            <h1
                class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
                Produk & Inventaris
            </h1>
            <p class="text-slate-500">
                Kelola katalog produk, harga, dan ketersediaan stok.
            </p>
        </div>
    </header>

    <ProductManagerTable />
</div>
