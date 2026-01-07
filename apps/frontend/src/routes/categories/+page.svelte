<script lang="ts">
    import CategoryList from "../products/components/category-list.svelte";
</script>

<div class="container mx-auto py-6 space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold tracking-tight">Kategori Produk</h2>
            <p class="text-muted-foreground">Manajemen master data kategori.</p>
        </div>
    </div>

    <div class="border rounded-md bg-white p-4">
        <CategoryList />
    </div>
</div>
