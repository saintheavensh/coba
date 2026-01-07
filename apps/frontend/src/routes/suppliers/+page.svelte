<script lang="ts">
    import SupplierList from "../products/components/supplier-list.svelte";
</script>

<div class="container mx-auto py-6 space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold tracking-tight">Data Supplier</h2>
            <p class="text-muted-foreground">
                Manajemen data supplier dan merk produk.
            </p>
        </div>
    </div>

    <div class="border rounded-md bg-white p-4">
        <SupplierList />
    </div>
</div>
