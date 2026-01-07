<script lang="ts">
    import ProductList from "./components/product-list.svelte";
</script>

<div class="container mx-auto py-6 space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold tracking-tight">Inventaris Produk</h2>
            <p class="text-muted-foreground">Manajemen data produk dan stok.</p>
        </div>
    </div>

    <!-- No Tabs, just Product List -->
    <ProductList />
</div>
