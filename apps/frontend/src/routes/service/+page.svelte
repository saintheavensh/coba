<script lang="ts">
    import { Separator } from "$lib/components/ui/separator";
    import ServiceList from "./components/service-list.svelte";
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

    <ServiceList />
</div>
