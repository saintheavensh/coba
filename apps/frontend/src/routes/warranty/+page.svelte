<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/components/ui/table";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { Badge } from "$lib/components/ui/badge";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Search, RotateCcw, ShieldCheck, AlertCircle } from "lucide-svelte";
    import { goto } from "$app/navigation";

    let services = $state<any[]>([]);
    let loading = $state(true);
    let searchQuery = $state("");

    async function loadData() {
        loading = true;
        try {
            // Fetch all services and filter mostly on client side for now
            // as we want to show units WITH warranty specifically.
            // Optimized approach would be backend filter, but getCounts/getAll
            // might not have 'warranty' filter yet.
            const res = await api.get("/services");
            // Filter services that have warranty field set
            // Filter services that have warranty field set (exclude 'Tanpa Garansi' explicitly if needed,
            // but let's show everything that has a warranty string not equal to null/empty)
            services = res.data.filter(
                (s: any) => s.warranty && s.warranty !== "Tanpa Garansi",
            );
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadData();
    });

    function isExpired(dateStr: string) {
        if (!dateStr) return false;
        return new Date(dateStr) < new Date();
    }

    function formatDate(dateStr: string) {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }

    let filteredServices = $derived(
        services.filter((s) => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
                s.no.toLowerCase().includes(q) ||
                s.customer?.name?.toLowerCase().includes(q) ||
                s.device?.model?.toLowerCase().includes(q)
            );
        }),
    );
</script>

<div class="p-6 space-y-6">
    <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
    >
        <div>
            <h1 class="text-3xl font-bold tracking-tight">Data Garansi</h1>
            <p class="text-muted-foreground">
                Monitoring masa garansi unit service yang telah diambil.
            </p>
        </div>
        <Button variant="outline" size="sm" onclick={loadData}>
            <RotateCcw class="mr-2 h-4 w-4" /> Refresh
        </Button>
    </div>

    <Card>
        <CardHeader class="pb-3">
            <div class="flex items-center gap-2">
                <Search class="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari No Service / Customer / Device..."
                    bind:value={searchQuery}
                    class="max-w-xs"
                />
            </div>
        </CardHeader>
        <CardContent>
            {#if loading}
                <div class="flex justify-center py-8">Loading...</div>
            {:else if filteredServices.length === 0}
                <div class="text-center py-8 text-muted-foreground">
                    Belum ada data garansi unit.
                </div>
            {:else}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Service No</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Device</TableHead>
                            <TableHead>Masa Garansi</TableHead>
                            <TableHead>Berakhir Pada</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead class="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {#each filteredServices as s}
                            <TableRow>
                                <TableCell class="font-medium">{s.no}</TableCell
                                >
                                <TableCell>
                                    <div class="font-medium">
                                        {s.customer?.name}
                                    </div>
                                    <div class="text-xs text-muted-foreground">
                                        {s.customer?.phone}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        {s.device?.brand}
                                        {s.device?.model}
                                    </div>
                                    <div class="text-xs text-muted-foreground">
                                        IMEI: {s.device?.imei || "-"}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline"
                                        >{s.warranty || "-"}</Badge
                                    >
                                </TableCell>
                                <TableCell>
                                    {formatDate(s.warrantyExpiryDate)}
                                </TableCell>
                                <TableCell>
                                    {#if !s.warrantyExpiryDate}
                                        <Badge variant="secondary"
                                            >No Date</Badge
                                        >
                                    {:else if isExpired(s.warrantyExpiryDate)}
                                        <Badge
                                            variant="destructive"
                                            class="gap-1"
                                        >
                                            <AlertCircle class="h-3 w-3" /> Expired
                                        </Badge>
                                    {:else}
                                        <Badge
                                            variant="default"
                                            class="bg-green-600 hover:bg-green-700 gap-1"
                                        >
                                            <ShieldCheck class="h-3 w-3" /> Active
                                        </Badge>
                                    {/if}
                                </TableCell>
                                <TableCell class="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onclick={() => goto(`/service/${s.id}`)}
                                    >
                                        Detail
                                    </Button>
                                </TableCell>
                            </TableRow>
                        {/each}
                    </TableBody>
                </Table>
            {/if}
        </CardContent>
    </Card>
</div>
