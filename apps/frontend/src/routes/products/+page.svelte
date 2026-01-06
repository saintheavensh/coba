<script lang="ts">
    import {
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
    } from "$lib/components/ui/tabs";
    import ProductList from "./components/product-list.svelte";
    import CategoryList from "./components/category-list.svelte";
    import SupplierList from "./components/supplier-list.svelte";
    import PurchaseList from "./components/purchase-list.svelte";
</script>

<div class="container mx-auto py-6 space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold tracking-tight">Inventaris</h2>
            <p class="text-muted-foreground">
                Manajemen stok produk dan master data kategori.
            </p>
        </div>
    </div>

    <Tabs value="products" class="w-full">
        <TabsList class="grid w-full grid-cols-3 lg:w-[450px] mb-4">
            <TabsTrigger value="products">Produk & Stok</TabsTrigger>
            <TabsTrigger value="categories">Kategori</TabsTrigger>
            <TabsTrigger value="suppliers">Supplier & Merk</TabsTrigger>
        </TabsList>

        <!-- Tab Content: Produk -->
        <TabsContent value="products" class="space-y-4">
            <ProductList />
        </TabsContent>

        <!-- Tab Content: Kategori -->
        <TabsContent value="categories" class="space-y-4">
            <CategoryList />
        </TabsContent>

        <!-- Tab Content: Supplier -->
        <TabsContent value="suppliers" class="space-y-4">
            <SupplierList />
        </TabsContent>

        <!-- Tab Content: Pembelian -->
    </Tabs>
</div>
