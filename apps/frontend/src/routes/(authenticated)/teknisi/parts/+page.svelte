<script lang="ts">
    import TeknisiPartsTable from "$lib/features/products/components/teknisi/TeknisiPartsTable.svelte";
</script>

<div class="container mx-auto py-6 space-y-6">
    <header class="flex justify-between items-center">
        <div>
            <h1
                class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
                Katalog Sparepart
            </h1>
            <p class="text-slate-500">
                Lihat ketersediaan komponen dan lakukan permintaan pengambilan
                barang.
            </p>
        </div>
    </header>

    <TeknisiPartsTable />
</div>
