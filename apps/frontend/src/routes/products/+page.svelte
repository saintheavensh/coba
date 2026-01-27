<script lang="ts">
    import ProductList from "./components/product-list.svelte";
    import { Button } from "$lib/components/ui/button";
    import { ClipboardList } from "lucide-svelte";
    import { goto } from "$app/navigation";
</script>

<div class="container mx-auto py-6 space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold tracking-tight">Inventaris Produk</h2>
            <p class="text-muted-foreground">Manajemen data produk dan stok.</p>
        </div>
        <div class="flex items-center gap-2">
            <Button variant="outline" onclick={() => goto("/inventory/opname")}>
                <ClipboardList class="mr-2 h-4 w-4" />
                Stock Opname
            </Button>
        </div>
    </div>

    <!-- No Tabs, just Product List -->
    <ProductList />
</div>
