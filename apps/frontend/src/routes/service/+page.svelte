<script lang="ts">
    import {
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
    } from "$lib/components/ui/tabs";
    import { Separator } from "$lib/components/ui/separator";
    import ServiceList from "./components/service-list.svelte";
    import ServiceForm from "./components/service-form.svelte";
    import WarrantyClaimForm from "./components/warranty-claim-form.svelte";
</script>

<div class="space-y-6">
    <div>
        <h3 class="text-lg font-medium">Service & Reparasi</h3>
        <p class="text-sm text-muted-foreground">
            Kelola service handphone customer, dari penerimaan hingga
            pengambilan.
        </p>
    </div>
    <Separator />

    <Tabs value="list" class="space-y-4">
        <TabsList>
            <TabsTrigger value="list">Daftar Service</TabsTrigger>
            <TabsTrigger value="new">Service Baru</TabsTrigger>
            <TabsTrigger value="warranty">Klaim Garansi</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
            <ServiceList />
        </TabsContent>

        <TabsContent value="new">
            <ServiceForm />
        </TabsContent>

        <TabsContent value="warranty">
            <WarrantyClaimForm />
        </TabsContent>
    </Tabs>
</div>
