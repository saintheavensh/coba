<script lang="ts">
    import {
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
    } from "$lib/components/ui/tabs";
    import DefectiveItemsList from "./components/defective-items-list.svelte";
    import PurchaseReturnsList from "./components/purchase-returns-list.svelte";
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold tracking-tight">Retur Pembelian</h2>
            <p class="text-muted-foreground">
                Kelola barang rusak dan dokumen pengembalian.
            </p>
        </div>
    </div>

    <Tabs value="staging" class="space-y-4">
        <TabsList>
            <TabsTrigger value="staging">Gudang Retur (Staging)</TabsTrigger>
            <TabsTrigger value="history">Riwayat Retur</TabsTrigger>
        </TabsList>

        <TabsContent value="staging" class="space-y-4">
            <DefectiveItemsList />
        </TabsContent>

        <TabsContent value="history" class="space-y-4">
            <PurchaseReturnsList />
        </TabsContent>
    </Tabs>
</div>
